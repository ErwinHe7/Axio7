import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { trackServerEvent } from '@/lib/observability/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CookieToSet = { name: string; value: string; options: CookieOptions };

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('pkce') || lower.includes('code verifier')) {
    return 'That sign-in link was opened in a different browser session. Request a new email link here, then open it in this same browser. If QQ Mail opens its own browser, copy the link into Chrome/Safari.';
  }
  if (lower.includes('rate limit')) {
    return 'Too many email sign-in links were requested. Please wait a minute, then try again, or continue with Google.';
  }
  return message;
}

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
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const signin = new URL('/auth/signin', url.origin);
    signin.searchParams.set('error', friendlyAuthError(error.message));
    signin.searchParams.set('next', next);
    return NextResponse.redirect(signin);
  }

  // Detect new sign-up: created_at within the last 60s means this is a fresh account.
  try {
    const { data: userData } = await supabase.auth.getUser();
    const u = userData?.user;
    if (u) {
      const isNew = u.created_at && Date.now() - new Date(u.created_at).getTime() < 60_000;
      if (isNew) {
        trackServerEvent(u.id, {
          event: 'user_signed_up',
          properties: { user_id: u.id, signup_method: 'google' },
        });
      }
    }
  } catch {
    // Non-blocking — ignore tracking errors
  }

  return response;
}
