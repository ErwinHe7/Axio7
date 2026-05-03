import { NextResponse } from 'next/server';
import { HOUSING_LISTINGS } from '@/lib/housing';
import { runRiskAgent } from '@/lib/housing/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ ok: true, job: 'housing-risk', assessments: HOUSING_LISTINGS.map((listing) => ({ listingId: listing.id, ...runRiskAgent(listing) })) });
}
