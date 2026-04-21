import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Sign the current user out and return them to `?next` (default: "/"). */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/';
  try {
    await supabaseServer().auth.signOut();
  } catch {
    // even if sign-out fails server-side, we still redirect; the middleware
    // will see the cookies as stale on next request.
  }
  const target = next.startsWith('/') ? new URL(next, url.origin) : new URL('/', url.origin);
  return NextResponse.redirect(target, { status: 303 });
}

export async function GET(req: Request) {
  // allow plain-link sign-out too (e.g. `<a href="/auth/signout">Sign out</a>`)
  return POST(req);
}
