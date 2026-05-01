import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVEBG_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Background removal is not configured yet. Set REMOVEBG_API_KEY in environment variables.' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  if (!imageFile) {
    return NextResponse.json({ error: 'No image field in request' }, { status: 400 });
  }

  if (imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: `Image too large. Max size is 10MB, got ${(imageFile.size / 1024 / 1024).toFixed(1)}MB` }, { status: 400 });
  }

  if (!imageFile.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image (JPG, PNG, WebP)' }, { status: 400 });
  }

  // Call remove.bg API
  const rbForm = new FormData();
  rbForm.append('image_file', imageFile);
  rbForm.append('size', 'auto');          // use original resolution
  rbForm.append('type', 'person');        // optimize for person/portrait
  rbForm.append('type_level', '2');       // fine detail (hair, fur)
  rbForm.append('format', 'png');
  rbForm.append('channels', 'rgba');

  let rbRes: Response;
  try {
    rbRes = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: rbForm,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Network error calling remove.bg: ${err?.message ?? 'unknown'}` },
      { status: 502 }
    );
  }

  if (!rbRes.ok) {
    let detail = '';
    try {
      const errBody = await rbRes.json();
      detail = errBody?.errors?.[0]?.title ?? errBody?.error ?? JSON.stringify(errBody);
    } catch {
      detail = await rbRes.text().catch(() => '');
    }
    return NextResponse.json(
      { error: `remove.bg error (${rbRes.status}): ${detail}` },
      { status: rbRes.status >= 500 ? 502 : 422 }
    );
  }

  // Stream the transparent PNG back to the client
  const blob = await rbRes.arrayBuffer();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(blob.byteLength),
      // Do not cache — user photos must never be stored
      'Cache-Control': 'no-store',
    },
  });
}
