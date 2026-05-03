import { NextResponse } from 'next/server';
import { HOUSING_LISTINGS } from '@/lib/housing';
import { runRiskAgent } from '@/lib/housing/agents';
import { getHousingListing, recordAgentRun } from '@/lib/housing/store';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const json = await req.json().catch(() => null);
  const listing = (json?.listingId ? await getHousingListing(json.listingId) : null) ?? HOUSING_LISTINGS[0];
  const risk = runRiskAgent(listing);
  await recordAgentRun({ agent: 'risk', status: 'completed', userId: user.authenticated ? user.id : undefined, listingId: listing.id, input: json ?? {}, output: risk });
  return NextResponse.json({ listingId: listing.id, risk });
}
