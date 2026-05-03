import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { parseHousingNeed } from '@/lib/housing/agents';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ preference: null });
  return NextResponse.json({ preference: HousingPreferenceSchema.parse({ userId: user.id, schoolEmail: user.email ?? '' }), persisted: false });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = typeof json?.rawText === 'string' && Object.keys(json).length === 1
    ? { success: true as const, data: parseHousingNeed(json.rawText) }
    : HousingPreferenceSchema.safeParse({ ...json, userId: user.id });
  if (!parsed.success) return NextResponse.json({ error: 'invalid input', issues: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ preference: { ...parsed.data, userId: user.id, schoolEmail: parsed.data.schoolEmail || user.email || '' }, persisted: false });
}
