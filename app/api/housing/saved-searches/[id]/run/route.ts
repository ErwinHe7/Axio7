import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { rankHousingListings } from '@/lib/housing/scoring';
import { getSavedSearch, listHousingListings, recordAgentRun, recordSavedSearchRun } from '@/lib/housing/store';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const savedSearch = await getSavedSearch(user.id, params.id);
  if (!savedSearch && params.id !== 'demo') return NextResponse.json({ error: 'saved search not found' }, { status: 404 });

  const filters = savedSearch?.filters ?? json?.filters ?? {};
  const preference = HousingPreferenceSchema.parse(json?.preference ?? filters ?? {});
  const listings = await listHousingListings({
    borough: filters.borough,
    maxPrice: filters.maxPrice,
    verifiedOnly: filters.verifiedOnly,
    noFeeOnly: filters.noFeeOnly,
    maxRisk: filters.riskMax ?? filters.maxRisk,
  });
  const ranked = rankHousingListings(listings, preference).filter((match) => match.score >= (savedSearch?.min_match_score ?? json?.minMatchScore ?? 80));
  const payload = {
    minMatchScore: savedSearch?.min_match_score ?? json?.minMatchScore ?? 80,
    matches: ranked,
    alerts: ranked.map((match) => ({ listingId: match.listing.id, title: match.listing.title, score: match.score, reason: match.reasons[0] ?? 'Strong match for saved search' })),
  };

  if (savedSearch) await recordSavedSearchRun(savedSearch.id, ranked.map((match) => ({ listingId: match.listing.id, score: match.score })));
  await recordAgentRun({ agent: 'monitoring', status: 'completed', userId: user.id, input: { savedSearchId: params.id, filters, preference }, output: payload });

  return NextResponse.json(payload);
}
