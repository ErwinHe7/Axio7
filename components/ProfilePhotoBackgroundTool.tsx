'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Loader2, RotateCcw, Upload } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const BG_OPTIONS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Red',   value: '#d71920' },
  { label: 'Blue',  value: '#2f5eea' },
  { label: 'Gray',  value: '#6b7280' },
];

const MAX_PREVIEW_SIZE = 900; // px — preview canvas max dimension

type Status = 'idle' | 'uploading' | 'done' | 'error';
type BrushMode = 'erase' | 'restore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Cannot load image'));
    img.src = url;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/**
 * Composite: draw bg color, then draw transparent-PNG subject on top.
 * Always outputs at fullW × fullH (original resolution).
 */
function compositeToDataURL(
  maskCanvas: HTMLCanvasElement,  // preview-size canvas with edited alpha
  origImg: HTMLImageElement,       // original full-res image
  subjectImg: HTMLImageElement,    // full-res transparent PNG from API
  bgColor: string,
  fullW: number,
  fullH: number,
): string {
  const [bgR, bgG, bgB] = hexToRgb(bgColor);

  // 1. Get the edited alpha mask at preview scale
  const prevW = maskCanvas.width;
  const prevH = maskCanvas.height;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.getImageData(0, 0, prevW, prevH).data;

  // 2. Draw full-res subject to get full-res pixel + alpha data
  const subjectCanvas = document.createElement('canvas');
  subjectCanvas.width = fullW;
  subjectCanvas.height = fullH;
  const subCtx = subjectCanvas.getContext('2d')!;
  subCtx.drawImage(subjectImg, 0, 0, fullW, fullH);
  const subjectData = subCtx.getImageData(0, 0, fullW, fullH);
  const subPx = subjectData.data;

  // 3. Create output canvas at full resolution
  const outCanvas = document.createElement('canvas');
  outCanvas.width = fullW;
  outCanvas.height = fullH;
  const outCtx = outCanvas.getContext('2d')!;
  const outData = outCtx.createImageData(fullW, fullH);
  const outPx = outData.data;

  // Scale factors from preview to full resolution
  const scaleX = fullW / prevW;
  const scaleY = fullH / prevH;

  for (let fy = 0; fy < fullH; fy++) {
    for (let fx = 0; fx < fullW; fx++) {
      // Map full-res pixel to preview-scale mask pixel
      const py = Math.min(Math.floor(fy / scaleY), prevH - 1);
      const px = Math.min(Math.floor(fx / scaleX), prevW - 1);
      const maskAlpha = maskData[(py * prevW + px) * 4 + 3]; // 0–255

      const fi = (fy * fullW + fx) * 4;
      const alpha = maskAlpha / 255; // 0.0 = background, 1.0 = person

      // Soft blend: person pixels at alpha confidence, bg color elsewhere
      outPx[fi]     = Math.round(subPx[fi]     * alpha + bgR * (1 - alpha));
      outPx[fi + 1] = Math.round(subPx[fi + 1] * alpha + bgG * (1 - alpha));
      outPx[fi + 2] = Math.round(subPx[fi + 2] * alpha + bgB * (1 - alpha));
      outPx[fi + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL('image/png');
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfilePhotoBackgroundTool() {
  const [status, setStatus] = useState<Status>('idle');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [stage, setStage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refineMode, setRefineMode] = useState(false);
  const [brushMode, setBrushMode] = useState<BrushMode>('erase');
  const [brushSize, setBrushSize] = useState(24);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);

  // Refs for canvases
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);   // shows composite preview
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);      // stores edited alpha (RGBA)
  const origImgRef = useRef<HTMLImageElement | null>(null);
  const subjectImgRef = useRef<HTMLImageElement | null>(null);
  const fullWRef = useRef(0);
  const fullHRef = useRef(0);
  const prevWRef = useRef(0);
  const prevHRef = useRef(0);

  // Brush state
  const isPainting = useRef(false);
  const undoStack = useRef<ImageData[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const origPreviewUrl = useRef<string | null>(null);

  // ── Render preview (composite mask + bg onto preview canvas) ─────────────────
  const renderPreview = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!maskCanvas || !previewCanvas) return;

    const W = maskCanvas.width;
    const H = maskCanvas.height;
    const [bgR, bgG, bgB] = hexToRgb(bgColor);

    const maskCtx = maskCanvas.getContext('2d')!;
    const maskData = maskCtx.getImageData(0, 0, W, H).data;

    const prevCtx = previewCanvas.getContext('2d')!;
    const prevData = prevCtx.createImageData(W, H);
    const prevPx = prevData.data;

    for (let i = 0; i < W * H; i++) {
      const alpha = maskData[i * 4 + 3] / 255;
      const pi = i * 4;
      // subject pixel (stored in mask canvas R,G,B channels — see below)
      const sR = maskData[pi];
      const sG = maskData[pi + 1];
      const sB = maskData[pi + 2];

      prevPx[pi]     = Math.round(sR * alpha + bgR * (1 - alpha));
      prevPx[pi + 1] = Math.round(sG * alpha + bgG * (1 - alpha));
      prevPx[pi + 2] = Math.round(sB * alpha + bgB * (1 - alpha));
      prevPx[pi + 3] = 255;
    }

    prevCtx.putImageData(prevData, 0, 0);
  }, [bgColor]);

  // Re-render preview when color changes
  useEffect(() => {
    if (status === 'done') renderPreview();
  }, [bgColor, status, renderPreview]);

  // ── Process uploaded file ────────────────────────────────────────────────────
  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image too large. Max 10MB.');
      return;
    }

    setStatus('uploading');
    setErrorMsg(null);
    setRefineMode(false);
    undoStack.current = [];

    // Store original preview URL
    if (origPreviewUrl.current) URL.revokeObjectURL(origPreviewUrl.current);
    origPreviewUrl.current = URL.createObjectURL(file);

    setStage('Sending to remove.bg…');

    // Call backend API
    const fd = new FormData();
    fd.append('image', file);

    let res: Response;
    try {
      res = await fetch('/api/photo/remove-background', { method: 'POST', body: fd });
    } catch (err: any) {
      setErrorMsg(`Network error: ${err?.message ?? 'unknown'}`);
      setStatus('error');
      setStage('');
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErrorMsg(body.error ?? `Error ${res.status}`);
      setStatus('error');
      setStage('');
      return;
    }

    setStage('Loading result…');

    // Get transparent PNG blob
    const pngBlob = await res.blob();
    const subjectUrl = URL.createObjectURL(pngBlob);

    // Load both images
    const [subjectImg, origImg] = await Promise.all([
      loadImageFromUrl(subjectUrl),
      loadImageFromUrl(origPreviewUrl.current!),
    ]);

    URL.revokeObjectURL(subjectUrl);

    subjectImgRef.current = subjectImg;
    origImgRef.current = origImg;
    fullWRef.current = origImg.naturalWidth;
    fullHRef.current = origImg.naturalHeight;

    // Calculate preview dimensions
    const scale = Math.min(1, MAX_PREVIEW_SIZE / Math.max(origImg.naturalWidth, origImg.naturalHeight));
    const prevW = Math.round(origImg.naturalWidth * scale);
    const prevH = Math.round(origImg.naturalHeight * scale);
    prevWRef.current = prevW;
    prevHRef.current = prevH;

    // Build mask canvas: stores subject RGBA pixels at preview scale
    // R,G,B = subject pixel color; A = alpha (0=background, 255=person)
    const maskCanvas = maskCanvasRef.current!;
    maskCanvas.width = prevW;
    maskCanvas.height = prevH;
    const maskCtx = maskCanvas.getContext('2d')!;

    // Draw subject (transparent PNG) at preview scale to get RGBA
    maskCtx.clearRect(0, 0, prevW, prevH);
    maskCtx.drawImage(subjectImg, 0, 0, prevW, prevH);
    // The canvas now has the subject pixels with correct alpha from remove.bg

    // Set preview canvas size
    const previewCanvas = previewCanvasRef.current!;
    previewCanvas.width = prevW;
    previewCanvas.height = prevH;

    setStage('');
    setStatus('done');
    renderPreview();
  }

  // ── Brush painting ───────────────────────────────────────────────────────────

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = previewCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function pushUndo() {
    const maskCanvas = maskCanvasRef.current!;
    const ctx = maskCanvas.getContext('2d')!;
    undoStack.current = [ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height), ...undoStack.current.slice(0, 19)];
  }

  function paintAt(x: number, y: number) {
    const maskCanvas = maskCanvasRef.current!;
    const maskCtx = maskCanvas.getContext('2d')!;
    const r = brushSize / 2;
    const px = Math.round(x);
    const py = Math.round(y);

    const imageData = maskCtx.getImageData(
      Math.max(0, px - r - 1), Math.max(0, py - r - 1),
      Math.min(maskCanvas.width, px + r + 2) - Math.max(0, px - r - 1),
      Math.min(maskCanvas.height, py + r + 2) - Math.max(0, py - r - 1),
    );
    const { data, width, height } = imageData;
    const offX = Math.max(0, px - r - 1);
    const offY = Math.max(0, py - r - 1);

    for (let iy = 0; iy < height; iy++) {
      for (let ix = 0; ix < width; ix++) {
        const dist = Math.sqrt((ix + offX - px) ** 2 + (iy + offY - py) ** 2);
        if (dist <= r) {
          // Soft falloff at edge
          const softness = Math.max(0, 1 - Math.max(0, dist - (r - 2)) / 2);
          const idx = (iy * width + ix) * 4;
          const curAlpha = data[idx + 3];
          if (brushMode === 'erase') {
            data[idx + 3] = Math.round(curAlpha * (1 - softness));
          } else {
            data[idx + 3] = Math.round(Math.min(255, curAlpha + 255 * softness));
          }
        }
      }
    }

    maskCtx.putImageData(imageData, offX, offY);
    renderPreview();
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!refineMode) return;
    e.preventDefault();
    isPainting.current = true;
    pushUndo();
    const { x, y } = getCanvasPos(e);
    paintAt(x, y);
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!refineMode || !isPainting.current) return;
    e.preventDefault();
    const { x, y } = getCanvasPos(e);
    paintAt(x, y);
  }

  function onMouseUp() { isPainting.current = false; }

  function undo() {
    if (undoStack.current.length === 0) return;
    const maskCanvas = maskCanvasRef.current!;
    const ctx = maskCanvas.getContext('2d')!;
    ctx.putImageData(undoStack.current[0], 0, 0);
    undoStack.current = undoStack.current.slice(1);
    renderPreview();
  }

  // ── Download ─────────────────────────────────────────────────────────────────

  async function downloadResult() {
    const maskCanvas = maskCanvasRef.current;
    const subjectImg = subjectImgRef.current;
    const origImg = origImgRef.current;
    if (!maskCanvas || !subjectImg || !origImg) return;

    const dataUrl = compositeToDataURL(
      maskCanvas, origImg, subjectImg, bgColor,
      fullWRef.current, fullHRef.current,
    );
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'axio7-portrait-background.png';
    a.click();
  }

  // ── Input handlers ────────────────────────────────────────────────────────────

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  const isProcessing = status === 'uploading';

  return (
    <div className="rounded-[22px] p-5 space-y-5" style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)' }}>

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--lt-text)' }}>
          Portrait Background
        </h2>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--lt-muted)' }}>
          Replace a portrait background with a clean solid color. For official ID photos, inspect and refine edges before download.
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--lt-subtle)' }}>
          Images are processed through remove.bg and are not stored by AXIO7.
          For official documents, review the final image carefully. AXIO7 does not guarantee government approval.
        </p>
      </div>

      {/* Background color */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium" style={{ color: 'var(--lt-muted)' }}>Background:</span>
        {BG_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setBgColor(opt.value)}
            title={opt.label}
            className="h-8 w-8 rounded-full transition hover:scale-110 active:scale-95"
            style={{
              background: opt.value,
              outline: bgColor === opt.value ? '2.5px solid var(--molt-shell)' : '2px solid transparent',
              outlineOffset: '2px',
              border: opt.value === '#ffffff' ? '1px solid #e5e7eb' : 'none',
            }}
            aria-label={opt.label}
          />
        ))}
        <span className="text-xs" style={{ color: 'var(--lt-muted)' }}>
          {BG_OPTIONS.find((o) => o.value === bgColor)?.label}
        </span>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isProcessing && fileRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 transition"
        style={{ borderColor: 'var(--lt-border)', color: 'var(--lt-muted)', cursor: isProcessing ? 'default' : 'pointer' }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--molt-shell)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--molt-shell)' }}>{stage || 'Processing…'}</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6" />
            <p className="text-sm font-medium">{status === 'done' ? 'Upload another photo' : 'Click or drag portrait photo here'}</p>
            <p className="text-xs">JPG, PNG, WebP · Max 10MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="sr-only" onChange={handleInputChange} disabled={isProcessing} />
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}>
          {errorMsg}
        </div>
      )}

      {/* Result area */}
      {status === 'done' && (
        <>
          {/* Two-column preview */}
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

            {/* Result / Editable canvas */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-center uppercase tracking-wider" style={{ color: 'var(--lt-muted)' }}>
                {refineMode ? `✏️ Refining — ${brushMode === 'erase' ? 'Erase residue' : 'Restore person'}` : 'Result'}
              </p>
              <div
                className="flex items-center justify-center rounded-xl overflow-hidden relative"
                style={{ background: bgColor, border: refineMode ? '2px solid var(--molt-shell)' : '1px solid var(--lt-border)', minHeight: 140 }}
              >
                {/* Hidden mask canvas */}
                <canvas ref={maskCanvasRef} style={{ display: 'none' }} />
                {/* Visible preview canvas — also the brush target in refine mode */}
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 280,
                    display: 'block',
                    cursor: refineMode ? (brushMode === 'erase' ? 'cell' : 'crosshair') : 'default',
                    touchAction: 'none',
                  }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                />
              </div>
            </div>
          </div>

          {/* Refine tools */}
          <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--lt-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--lt-text)' }}>Edge Refinement</span>
              {!refineMode ? (
                <button
                  onClick={() => setRefineMode(true)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-90"
                  style={{ background: 'var(--molt-shell)', color: 'white' }}
                >
                  ✏️ Refine edges
                </button>
              ) : (
                <button
                  onClick={() => setRefineMode(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                  style={{ background: 'rgba(0,0,0,0.08)', color: 'var(--lt-text)' }}
                >
                  Done refining
                </button>
              )}
            </div>

            {refineMode && (
              <>
                {/* Brush mode */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setBrushMode('erase')}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold transition"
                    style={brushMode === 'erase' ? { background: '#dc2626', color: 'white' } : { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
                  >
                    🧹 Erase residue
                  </button>
                  <button
                    onClick={() => setBrushMode('restore')}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold transition"
                    style={brushMode === 'restore' ? { background: '#059669', color: 'white' } : { background: 'rgba(5,150,105,0.08)', color: '#059669' }}
                  >
                    ✏️ Restore person
                  </button>
                </div>

                {/* Brush size */}
                <div className="flex items-center gap-3">
                  <span className="text-xs w-16" style={{ color: 'var(--lt-muted)' }}>Brush: {brushSize}px</span>
                  <input
                    type="range" min={4} max={80} value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-1"
                    style={{ accentColor: 'var(--molt-shell)' }}
                  />
                </div>

                {/* Undo */}
                <button
                  onClick={undo}
                  disabled={undoStack.current.length === 0}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 hover:opacity-80"
                  style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--lt-text)' }}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Undo
                </button>

                <p className="text-[11px]" style={{ color: 'var(--lt-muted)' }}>
                  Paint on the Result canvas above. <strong>Erase residue</strong> removes leftover background. <strong>Restore person</strong> recovers cut edges.
                </p>
              </>
            )}
          </div>

          {/* Download */}
          <button
            onClick={downloadResult}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--molt-shell)' }}
          >
            <Download className="h-4 w-4" />
            Download full-resolution PNG
          </button>

          <p className="text-[11px] text-center" style={{ color: 'var(--lt-subtle)' }}>
            For official documents, review the final image carefully. AXIO7 does not guarantee government approval.
          </p>
        </>
      )}
    </div>
  );
}
