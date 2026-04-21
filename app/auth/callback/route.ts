import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * OAuth / magic-link callback.
 * Supabase redirects here with a `?code=...` param after the user authenticates
 * via Google (or clicks the magic link). We exchange the code for a session,
 * which sets the auth cookies, then redirect to `?next` (or `/`).
 *
 * Wire this URL into:
 *   - Supabase Auth → URL Configuration → Redirect URLs:
 *       http://localhost:3000/auth/callback
 *       https://aximoas.vercel.app/auth/callback
 *   - Google Cloud OAuth client → Authorized redirect URIs (Supabase's callback,
 *     already pre-filled if you used the Supabase dashboard integration).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';
  const errorDescription = url.searchParams.get('error_description');

  if (errorDescription) {
    const signin = new URL('/auth/signin', url.origin);
    signin.searchParams.set('error', errorDescription);
    return NextResponse.redirect(signin);
  }

  if (code) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const signin = new URL('/auth/signin', url.origin);
        signin.searchParams.set('error', error.message);
        return NextResponse.redirect(signin);
      }
    } catch (err: any) {
      const signin = new URL('/auth/signin', url.origin);
      signin.searchParams.set('error', err?.message ?? 'auth failed');
      return NextResponse.redirect(signin);
    }
  }

  // Prevent open-redirects: only allow same-origin paths.
  const target = next.startsWith('/') ? new URL(next, url.origin) : new URL('/', url.origin);
  return NextResponse.redirect(target);
}
