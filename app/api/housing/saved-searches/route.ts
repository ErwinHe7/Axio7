import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { runMonitoringAgent } from '@/lib/housing/agents';
import { createSavedSearch, listSavedSearches, recordAgentRun } from '@/lib/housing/store';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ savedSearches: [] });
  return NextResponse.json({ savedSearches: await listSavedSearches(user.id) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const preference = HousingPreferenceSchema.parse({ ...json?.preference, userId: user.id });
  const monitor = runMonitoringAgent(preference, json?.minMatchScore ?? 80);
  const savedSearch = await createSavedSearch(user.id, json?.filters ?? preference, json?.minMatchScore ?? 80);
  await recordAgentRun({ agent: 'monitoring', status: 'completed', userId: user.id, input: { preference, savedSearch }, output: monitor });
  return NextResponse.json({ savedSearch, monitor, persisted: true });
}
