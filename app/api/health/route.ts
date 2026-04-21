import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const configured = isSupabaseConfigured();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const keySnippet = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 12) ?? '(missing)';
  if (!configured) {
    return NextResponse.json({ ok: false, reason: 'not_configured', url_prefix: url.slice(0,30), key_prefix: keySnippet });
  }
  try {
    const { data, error } = await supabaseAdmin().from('posts').select('count').single();
    if (error) return NextResponse.json({ ok: false, reason: 'db_error', code: error.code, message: error.message, hint: error.hint, details: error.details, key_prefix: keySnippet });
    return NextResponse.json({ ok: true, posts_count: data, key_prefix: keySnippet });
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: 'exception', message: e?.message, key_prefix: keySnippet });
  }
}
