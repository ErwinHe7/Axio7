import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const redirectTo = next.startsWith('/') ? new URL(next, url.origin).toString() : new URL('/', url.origin).toString();

  if (!code) {
    const signin = new URL('/auth/signin', url.origin);
    signin.searchParams.set('error', 'No auth code received. Please try signing in again.');
    return NextResponse.redirect(signin);
  }

  // Build response before cookie operations so we write auth cookies onto the redirect.
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.headers.get('cookie') ?? '';
          const match = cookie.split('; ').find((c) => c.startsWith(`${name}=`));
          return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const signin = new URL('/auth/signin', url.origin);
    signin.searchParams.set('error', error.message);
    return NextResponse.redirect(signin);
  }

  return response;
}
