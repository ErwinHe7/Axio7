import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { protectApiRequest } from '@/lib/api-protection';
import { createAxioHandle, GUEST_COOKIE, normalizeAxioHandle } from '@/lib/guest-identity';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Runs on every request that isn't a static asset.
 *
 *   1. If Supabase env vars are present, refresh the auth cookie by calling
 *      `supabase.auth.getUser()` — this is the documented pattern for keeping
 *      the session alive across server renders.
 *   2. Seed a stable guest cookie (`axio7_guest_id`) for unauthenticated
 *      users so writes (posts / bids) can still be attributed without forcing
 *      login. Guests can upgrade to real Supabase auth via /auth/signin.
 */
export async function middleware(req: NextRequest) {
  const apiProtection = protectApiRequest(req);
  if (!apiProtection.allowed) {
    return NextResponse.json(
      { error: apiProtection.code, message: apiProtection.message },
      { status: apiProtection.status, headers: apiProtection.headers }
    );
  }

  const res = NextResponse.next();
  Object.entries(apiProtection.headers).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set({ name, value, ...options });
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    });
    // Side effect: refreshes session cookie if expired but refresh token valid.
    await supabase.auth.getUser().catch(() => null);
  }

  // Guest cookie — only set if missing. One year.
  const currentGuestId = req.cookies.get(GUEST_COOKIE)?.value;
  const normalizedGuestId = currentGuestId ? normalizeAxioHandle(currentGuestId) : createAxioHandle();
  if (!currentGuestId || currentGuestId !== normalizedGuestId) {
    res.cookies.set(GUEST_COOKIE, normalizedGuestId, {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
}

export const config = {
  matcher: [
    // Skip static assets, _next internals, AND the auth callback route so
    // the OAuth code exchange happens before middleware touches the session.
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
};
