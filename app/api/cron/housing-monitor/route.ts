import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { runMonitoringAgent } from '@/lib/housing/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const preference = HousingPreferenceSchema.parse({});
  return NextResponse.json({ ok: true, job: 'housing-monitor', ...runMonitoringAgent(preference, 80) });
}
