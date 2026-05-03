import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { parseHousingNeed, runMatchingAgent } from '@/lib/housing/agents';
import { recordAgentRun } from '@/lib/housing/store';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const json = await req.json().catch(() => null);
  const preference = typeof json?.rawText === 'string'
    ? parseHousingNeed(json.rawText)
    : HousingPreferenceSchema.parse(json ?? {});
  const result = runMatchingAgent(preference);
  await recordAgentRun({ agent: 'matching', status: 'completed', userId: user.authenticated ? user.id : undefined, input: preference, output: result });
  return NextResponse.json({ preference, ...result });
}
