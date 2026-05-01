import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Provider priority (auto-detected from env vars):
 *   1. Clipdrop  — CLIPDROP_API_KEY   (free 100/mo, excellent quality)
 *   2. remove.bg — REMOVEBG_API_KEY   (free 50/mo, industry standard)
 *
 * Both return transparent PNG. Swap providers by setting/removing env vars.
 * No user images are stored.
 */
export async function POST(req: NextRequest) {
  const clipdropKey = process.env.CLIPDROP_API_KEY;
  const removebgKey = process.env.REMOVEBG_API_KEY;

  if (!clipdropKey && !removebgKey) {
    return NextResponse.json(
      {
        error:
          'Background removal is not configured. ' +
          'Set CLIPDROP_API_KEY (free at clipdrop.co/apis) or REMOVEBG_API_KEY (free at remove.bg/api).',
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  if (!imageFile) {
    return NextResponse.json({ error: 'Missing "image" field.' }, { status: 400 });
  }
  if (imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `Image too large (${(imageFile.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.` },
      { status: 400 }
    );
  }
  if (!imageFile.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image (JPG, PNG, WebP).' }, { status: 400 });
  }

  // ── Try Clipdrop first ────────────────────────────────────────────────────
  if (clipdropKey) {
    const fd = new FormData();
    fd.append('image_file', imageFile);

    try {
      const res = await fetch('https://clipdrop-api.co/remove-background/v1', {
        method: 'POST',
        headers: { 'x-api-key': clipdropKey },
        body: fd,
      });

      if (res.ok) {
        const buf = await res.arrayBuffer();
        return new NextResponse(buf, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Content-Length': String(buf.byteLength),
            'Cache-Control': 'no-store',
            'X-Provider': 'clipdrop',
          },
        });
      }

      // If Clipdrop fails and we have a fallback, continue; otherwise surface error
      if (!removebgKey) {
        const detail = await res.text().catch(() => '');
        return NextResponse.json(
          { error: `Clipdrop error (${res.status}): ${detail}` },
          { status: res.status >= 500 ? 502 : 422 }
        );
      }
      // Fall through to remove.bg
      console.warn('[remove-bg] Clipdrop failed, falling back to remove.bg', res.status);
    } catch (err: any) {
      if (!removebgKey) {
        return NextResponse.json(
          { error: `Network error (Clipdrop): ${err?.message ?? 'unknown'}` },
          { status: 502 }
        );
      }
      console.warn('[remove-bg] Clipdrop network error, falling back to remove.bg', err?.message);
    }
  }

  // ── Fallback: remove.bg ───────────────────────────────────────────────────
  const rbForm = new FormData();
  rbForm.append('image_file', imageFile);
  rbForm.append('size', 'auto');      // original resolution
  rbForm.append('type', 'person');    // portrait/ID photo optimisation
  rbForm.append('type_level', '2');   // fine hair/edge detail
  rbForm.append('format', 'png');
  rbForm.append('channels', 'rgba');

  try {
    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': removebgKey! },
      body: rbForm,
    });

    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.errors?.[0]?.title ?? body?.error ?? JSON.stringify(body);
      } catch {
        detail = await res.text().catch(() => '');
      }
      return NextResponse.json(
        { error: `remove.bg error (${res.status}): ${detail}` },
        { status: res.status >= 500 ? 502 : 422 }
      );
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(buf.byteLength),
        'Cache-Control': 'no-store',
        'X-Provider': 'removebg',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Network error (remove.bg): ${err?.message ?? 'unknown'}` },
      { status: 502 }
    );
  }
}
