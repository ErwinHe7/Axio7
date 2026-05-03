import { NextResponse } from 'next/server';
import { HOUSING_LISTINGS } from '@/lib/housing';
import { runRiskAgent } from '@/lib/housing/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const listing = HOUSING_LISTINGS.find((item) => item.id === json?.listingId) ?? HOUSING_LISTINGS[0];
  return NextResponse.json({ listingId: listing.id, risk: runRiskAgent(listing) });
}
