import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { runMonitoringAgent } from '@/lib/housing/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const preference = HousingPreferenceSchema.parse(json?.preference ?? {});
  return NextResponse.json(runMonitoringAgent(preference, json?.minMatchScore ?? 80));
}
