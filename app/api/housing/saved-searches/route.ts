import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { runMonitoringAgent } from '@/lib/housing/agents';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ savedSearches: [] });
  const preference = HousingPreferenceSchema.parse({ userId: user.id, schoolEmail: user.email ?? '' });
  return NextResponse.json({ savedSearches: [{ id: 'saved-demo', alertFrequency: 'daily', minMatchScore: 80, preference, enabled: true }], persisted: false });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const preference = HousingPreferenceSchema.parse({ ...json?.preference, userId: user.id });
  const monitor = runMonitoringAgent(preference, json?.minMatchScore ?? 80);
  return NextResponse.json({ savedSearch: { id: `saved-${Date.now()}`, preference, alertFrequency: json?.alertFrequency ?? 'daily', minMatchScore: json?.minMatchScore ?? 80, enabled: true }, monitor, persisted: false });
}
