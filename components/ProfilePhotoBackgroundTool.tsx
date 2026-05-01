'use client';

/**
 * Portrait Background Tool
 *
 * Uses RMBG-1.4 (open-source, state-of-the-art background removal model)
 * via @huggingface/transformers running entirely in the browser.
 *
 * No API key. No uploads. Completely free.
 * First run downloads ~150MB model (cached in browser afterwards).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Loader2, RotateCcw, Upload } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const BG_OPTIONS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Red',   value: '#d71920' },
  { label: 'Blue',  value: '#2f5eea' },
  { label: 'Gray',  value: '#6b7280' },
];

type Status = 'idle' | 'loading_model' | 'processing' | 'done' | 'error';
type BrushMode = 'erase' | 'restore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function loadImgFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Cannot load image'));
    img.src = url;
  });
}

// ─── Singleton pipeline (loaded once, reused) ─────────────────────────────────

let pipelinePromise: Promise<(img: string) => Promise<{ mask: { width: number; height: number; data: Uint8ClampedArray } }>> | null = null;

function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      // Dynamic import so webpack never bundles this at build time
      const { pipeline, env } = await import(/* webpackIgnore: true */ '@huggingface/transformers' as string) as any;
      // Use float16 model for speed; fall back to float32 if unavailable
      env.backends.onnx.wasm.proxy = false;
      const pipe = await pipeline(
        'image-segmentation',
        'Xenova/rmbg-1.4',
        { quantized: true }
      );
      return pipe;
    })();
  }
  return pipelinePromise;
}

// ─── Core processing ──────────────────────────────────────────────────────────

/**
 * Run RMBG-1.4 and return a Float32Array alpha mask at the model's output size,
 * plus the original image element for full-resolution compositing.
 */
async function runSegmentation(
  file: File,
  onStage: (s: string) => void
): Promise<{ origImg: HTMLImageElement; alphaData: Uint8ClampedArray; maskW: number; maskH: number }> {
  onStage('Loading AI model… (first run ~30s, cached afterwards)');
  const pipe = await getPipeline();

  // Read file as data URL for the pipeline
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = () => reject(new Error('Cannot read file'));
    reader.readAsDataURL(file);
  });

  onStage('Segmenting portrait… (10–40s depending on image size)');
  const result = await pipe(dataUrl);

  // Pipeline returns array of segments; RMBG returns a single foreground mask
  const seg = Array.isArray(result) ? result[0] : result;
  if (!seg?.mask) throw new Error('Model returned no mask');

  const mask = seg.mask as { width: number; height: number; data: Uint8ClampedArray };

  onStage('Loading original image…');
  const origImg = await loadImgFromUrl(dataUrl);

  return {
    origImg,
    alphaData: mask.data,  // grayscale: 255 = person, 0 = background
    maskW: mask.width,
    maskH: mask.height,
  };
}

// ─── Canvas compositing ───────────────────────────────────────────────────────

/**
 * Fill maskCanvas with subject RGBA pixels at preview scale.
 * R,G,B = original pixel; A = segmentation alpha (0=bg, 255=person).
 */
function buildMaskCanvas(
  maskCanvas: HTMLCanvasElement,
  origImg: HTMLImageElement,
  alphaData: Uint8ClampedArray,
  maskW: number,
  maskH: number,
  prevW: number,
  prevH: number,
) {
  maskCanvas.width = prevW;
  maskCanvas.height = prevH;
  const ctx = maskCanvas.getContext('2d', { willReadFrequently: true })!;

  // Draw original image at preview size to get pixel colors
  ctx.drawImage(origImg, 0, 0, prevW, prevH);
  const imgData = ctx.getImageData(0, 0, prevW, prevH);
  const px = imgData.data;

  // Scale mask to preview size and apply as alpha
  const scaleX = maskW / prevW;
  const scaleY = maskH / prevH;

  for (let y = 0; y < prevH; y++) {
    for (let x = 0; x < prevW; x++) {
      const mx = Math.min(Math.floor(x * scaleX), maskW - 1);
      const my = Math.min(Math.floor(y * scaleY), maskH - 1);
      const alpha = alphaData[my * maskW + mx]; // 0–255
      const i = (y * prevW + x) * 4;
      px[i + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/** Composite mask canvas (has per-pixel alpha) onto solid bg; render to preview canvas. */
function renderPreviewCanvas(
  maskCanvas: HTMLCanvasElement,
  previewCanvas: HTMLCanvasElement,
  bgColor: string,
) {
  const W = maskCanvas.width;
  const H = maskCanvas.height;
  const [bgR, bgG, bgB] = hexToRgb(bgColor);

  previewCanvas.width = W;
  previewCanvas.height = H;
  const prevCtx = previewCanvas.getContext('2d')!;

  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
  const maskData = maskCtx.getImageData(0, 0, W, H).data;

  const out = prevCtx.createImageData(W, H);
  const op = out.data;

  for (let i = 0; i < W * H; i++) {
    const alpha = maskData[i * 4 + 3] / 255; // 0.0–1.0
    const p = i * 4;
    op[p]     = Math.round(maskData[p]     * alpha + bgR * (1 - alpha));
    op[p + 1] = Math.round(maskData[p + 1] * alpha + bgG * (1 - alpha));
    op[p + 2] = Math.round(maskData[p + 2] * alpha + bgB * (1 - alpha));
    op[p + 3] = 255;
  }

  prevCtx.putImageData(out, 0, 0);
}

/**
 * Export full-resolution PNG: scale mask back up to original dims, composite.
 */
function exportFullRes(
  maskCanvas: HTMLCanvasElement,
  origImg: HTMLImageElement,
  bgColor: string,
): string {
  const fullW = origImg.naturalWidth;
  const fullH = origImg.naturalHeight;
  const prevW = maskCanvas.width;
  const prevH = maskCanvas.height;
  const [bgR, bgG, bgB] = hexToRgb(bgColor);

  // Get original full-res pixel data
  const srcCv = document.createElement('canvas');
  srcCv.width = fullW; srcCv.height = fullH;
  const srcCtx = srcCv.getContext('2d')!;
  srcCtx.drawImage(origImg, 0, 0);
  const srcPx = srcCtx.getImageData(0, 0, fullW, fullH).data;

  // Get preview-scale alpha mask
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
  const maskPx = maskCtx.getImageData(0, 0, prevW, prevH).data;

  // Compose at full resolution
  const outCv = document.createElement('canvas');
  outCv.width = fullW; outCv.height = fullH;
  const outCtx = outCv.getContext('2d')!;
  const outData = outCtx.createImageData(fullW, fullH);
  const op = outData.data;

  for (let fy = 0; fy < fullH; fy++) {
    for (let fx = 0; fx < fullW; fx++) {
      // Map full-res → preview mask pixel
      const py = Math.min(Math.floor(fy * prevH / fullH), prevH - 1);
      const px2 = Math.min(Math.floor(fx * prevW / fullW), prevW - 1);
      const alpha = maskPx[(py * prevW + px2) * 4 + 3] / 255;

      const fi = (fy * fullW + fx) * 4;
      op[fi]     = Math.round(srcPx[fi]     * alpha + bgR * (1 - alpha));
      op[fi + 1] = Math.round(srcPx[fi + 1] * alpha + bgG * (1 - alpha));
      op[fi + 2] = Math.round(srcPx[fi + 2] * alpha + bgB * (1 - alpha));
      op[fi + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCv.toDataURL('image/png');
}

// ─── Component ────────────────────────────────────────────────────────────────

const MAX_PREVIEW = 900;

export function ProfilePhotoBackgroundTool() {
  const [status, setStatus] = useState<Status>('idle');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [stage, setStage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refineMode, setRefineMode] = useState(false);
  const [brushMode, setBrushMode] = useState<BrushMode>('erase');
  const [brushSize, setBrushSize] = useState(24);

  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const origImgRef = useRef<HTMLImageElement | null>(null);
  const origPreviewUrl = useRef<string | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const isPainting = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const doRenderPreview = useCallback(() => {
    const mc = maskCanvasRef.current;
    const pc = previewCanvasRef.current;
    if (!mc || !pc || mc.width === 0) return;
    renderPreviewCanvas(mc, pc, bgColor);
  }, [bgColor]);

  useEffect(() => {
    if (status === 'done') doRenderPreview();
  }, [bgColor, status, doRenderPreview]);

  // ── Process file ─────────────────────────────────────────────────────────────

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    setStatus('loading_model');
    setErrorMsg(null);
    setRefineMode(false);
    undoStack.current = [];

    if (origPreviewUrl.current) URL.revokeObjectURL(origPreviewUrl.current);
    origPreviewUrl.current = URL.createObjectURL(file);

    try {
      setStatus('processing');
      const { origImg, alphaData, maskW, maskH } = await runSegmentation(file, setStage);
      origImgRef.current = origImg;

      const scale = Math.min(1, MAX_PREVIEW / Math.max(origImg.naturalWidth, origImg.naturalHeight));
      const prevW = Math.round(origImg.naturalWidth * scale);
      const prevH = Math.round(origImg.naturalHeight * scale);

      buildMaskCanvas(maskCanvasRef.current!, origImg, alphaData, maskW, maskH, prevW, prevH);

      setStage('');
      setStatus('done');
      doRenderPreview();
    } catch (err: any) {
      console.error('[rmbg]', err);
      setErrorMsg(
        `Processing failed: ${err?.message ?? 'unknown error'}. ` +
        'Try a smaller image or a photo with a clear person against a distinct background.'
      );
      setStatus('error');
      setStage('');
    }
  }

  // ── Brush ────────────────────────────────────────────────────────────────────

  function canvasXY(e: React.MouseEvent<HTMLCanvasElement>): [number, number] {
    const cv = previewCanvasRef.current!;
    const r = cv.getBoundingClientRect();
    return [
      (e.clientX - r.left) * (cv.width / r.width),
      (e.clientY - r.top) * (cv.height / r.height),
    ];
  }

  function pushUndo() {
    const mc = maskCanvasRef.current!;
    const ctx = mc.getContext('2d', { willReadFrequently: true })!;
    undoStack.current = [ctx.getImageData(0, 0, mc.width, mc.height), ...undoStack.current.slice(0, 29)];
  }

  function paintAt(x: number, y: number) {
    const mc = maskCanvasRef.current!;
    const ctx = mc.getContext('2d', { willReadFrequently: true })!;
    const r = brushSize / 2;
    const x0 = Math.max(0, Math.floor(x - r - 1));
    const y0 = Math.max(0, Math.floor(y - r - 1));
    const x1 = Math.min(mc.width,  Math.ceil(x + r + 1));
    const y1 = Math.min(mc.height, Math.ceil(y + r + 1));
    const patch = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
    const d = patch.data;
    for (let iy = 0; iy < patch.height; iy++) {
      for (let ix = 0; ix < patch.width; ix++) {
        const dist = Math.sqrt((ix + x0 - x) ** 2 + (iy + y0 - y) ** 2);
        if (dist > r) continue;
        const t = Math.max(0, 1 - Math.max(0, dist - (r - 2)) / 2); // soft edge
        const idx = (iy * patch.width + ix) * 4;
        const cur = d[idx + 3];
        d[idx + 3] = brushMode === 'erase'
          ? Math.round(cur * (1 - t))
          : Math.min(255, Math.round(cur + 255 * t));
      }
    }
    ctx.putImageData(patch, x0, y0);
    doRenderPreview();
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!refineMode) return;
    e.preventDefault();
    isPainting.current = true;
    pushUndo();
    paintAt(...canvasXY(e));
  }
  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!refineMode || !isPainting.current) return;
    e.preventDefault();
    paintAt(...canvasXY(e));
  }
  function onMouseUp() { isPainting.current = false; }

  function undo() {
    if (!undoStack.current.length) return;
    const mc = maskCanvasRef.current!;
    mc.getContext('2d', { willReadFrequently: true })!.putImageData(undoStack.current[0], 0, 0);
    undoStack.current = undoStack.current.slice(1);
    doRenderPreview();
  }

  // ── Download ─────────────────────────────────────────────────────────────────

  function download() {
    const mc = maskCanvasRef.current;
    const orig = origImgRef.current;
    if (!mc || !orig) return;
    const dataUrl = exportFullRes(mc, orig, bgColor);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'axio7-portrait-background.png';
    a.click();
  }

  // ── Input ────────────────────────────────────────────────────────────────────

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = '';
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }

  const busy = status === 'loading_model' || status === 'processing';

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-[22px] p-5 space-y-5" style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)' }}>

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--lt-text)' }}>
          Portrait Background
        </h2>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--lt-muted)' }}>
          Replace a portrait background with a clean solid color. Runs entirely in your browser — no upload, no account required.
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--lt-subtle)' }}>
          For official documents, review the final image carefully. AXIO7 does not guarantee government approval.
        </p>
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium" style={{ color: 'var(--lt-muted)' }}>Background:</span>
        {BG_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setBgColor(opt.value)} title={opt.label}
            className="h-8 w-8 rounded-full transition hover:scale-110 active:scale-95"
            style={{ background: opt.value, outline: bgColor === opt.value ? '2.5px solid var(--molt-shell)' : '2px solid transparent', outlineOffset: '2px', border: opt.value === '#ffffff' ? '1px solid #e5e7eb' : 'none' }}
            aria-label={opt.label}
          />
        ))}
        <span className="text-xs" style={{ color: 'var(--lt-muted)' }}>
          {BG_OPTIONS.find(o => o.value === bgColor)?.label}
        </span>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop} onDragOver={e => e.preventDefault()}
        onClick={() => !busy && fileRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 transition"
        style={{ borderColor: 'var(--lt-border)', color: 'var(--lt-muted)', cursor: busy ? 'default' : 'pointer' }}
      >
        {busy ? (
          <>
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--molt-shell)' }} />
            <p className="text-sm font-medium px-6 text-center" style={{ color: 'var(--molt-shell)' }}>{stage || 'Processing…'}</p>
            <p className="text-xs" style={{ color: 'var(--lt-muted)' }}>Model runs locally — nothing leaves your device</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6" />
            <p className="text-sm font-medium">{status === 'done' ? 'Upload another photo' : 'Click or drag portrait photo here'}</p>
            <p className="text-xs">JPG, PNG, WebP · First run downloads ~150MB AI model (cached)</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="sr-only" onChange={onFileChange} disabled={busy} />
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}>
          {errorMsg}
        </div>
      )}

      {/* Hidden mask canvas — always in DOM so refs work */}
      <canvas ref={maskCanvasRef} style={{ display: 'none' }} />

      {/* Result */}
      {status === 'done' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Original */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-center uppercase tracking-wider" style={{ color: 'var(--lt-muted)' }}>Original</p>
              <div className="flex items-center justify-center rounded-xl overflow-hidden" style={{ background: '#f3f4f6', border: '1px solid var(--lt-border)', minHeight: 140 }}>
                {origPreviewUrl.current && (
                  <img src={origPreviewUrl.current} alt="Original" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }} />
                )}
              </div>
            </div>

            {/* Result / editable canvas */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-center uppercase tracking-wider" style={{ color: 'var(--lt-muted)' }}>
                {refineMode ? `✏️ ${brushMode === 'erase' ? 'Erasing' : 'Restoring'}` : 'Result'}
              </p>
              <div className="flex items-center justify-center rounded-xl overflow-hidden"
                style={{ background: bgColor, border: refineMode ? '2px solid var(--molt-shell)' : '1px solid var(--lt-border)', minHeight: 140 }}>
                <canvas ref={previewCanvasRef}
                  style={{ maxWidth: '100%', maxHeight: 280, display: 'block', cursor: refineMode ? (brushMode === 'erase' ? 'cell' : 'crosshair') : 'default', touchAction: 'none' }}
                  onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                />
              </div>
            </div>
          </div>

          {/* Refine toolbar */}
          <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--lt-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--lt-text)' }}>Edge Refinement</span>
              <button onClick={() => setRefineMode(v => !v)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-90"
                style={refineMode ? { background: 'rgba(0,0,0,0.08)', color: 'var(--lt-text)' } : { background: 'var(--molt-shell)', color: 'white' }}>
                {refineMode ? 'Done' : '✏️ Refine edges'}
              </button>
            </div>

            {refineMode && (
              <>
                <div className="flex gap-2">
                  <button onClick={() => setBrushMode('erase')}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold transition"
                    style={brushMode === 'erase' ? { background: '#dc2626', color: 'white' } : { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
                    🧹 Erase residue
                  </button>
                  <button onClick={() => setBrushMode('restore')}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold transition"
                    style={brushMode === 'restore' ? { background: '#059669', color: 'white' } : { background: 'rgba(5,150,105,0.08)', color: '#059669' }}>
                    ✏️ Restore person
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs w-16 flex-shrink-0" style={{ color: 'var(--lt-muted)' }}>Brush: {brushSize}px</span>
                  <input type="range" min={4} max={80} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))}
                    className="flex-1" style={{ accentColor: 'var(--molt-shell)' }} />
                </div>

                <button onClick={undo} disabled={!undoStack.current.length}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 hover:opacity-80"
                  style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--lt-text)' }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Undo
                </button>

                <p className="text-[11px]" style={{ color: 'var(--lt-muted)' }}>
                  Paint on the Result image. <b>Erase</b> removes leftover background; <b>Restore</b> recovers cut edges (hair, shoulders).
                </p>
              </>
            )}
          </div>

          {/* Download */}
          <button onClick={download}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--molt-shell)' }}>
            <Download className="h-4 w-4" /> Download full-resolution PNG
          </button>

          <p className="text-[11px] text-center" style={{ color: 'var(--lt-subtle)' }}>
            For official documents, review carefully. AXIO7 does not guarantee government approval.
          </p>
        </>
      )}
    </div>
  );
}
