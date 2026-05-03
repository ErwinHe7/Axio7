import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { parseHousingNeed, runMatchingAgent } from '@/lib/housing/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const preference = typeof json?.rawText === 'string'
    ? parseHousingNeed(json.rawText)
    : HousingPreferenceSchema.parse(json ?? {});
  const result = runMatchingAgent(preference);
  return NextResponse.json({ preference, ...result });
}
