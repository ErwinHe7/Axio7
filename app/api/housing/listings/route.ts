import { NextResponse } from 'next/server';
import { z } from 'zod';
import { HousingSourceType, LeaseTerm, RoomType } from '@/lib/housing';
import { assessHousingRisk } from '@/lib/housing/risk';
import { buildDraftHousingListing, createHousingListing, listHousingListings, recordAgentRun } from '@/lib/housing/store';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ListingInput = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(20).max(4000),
  sourceType: HousingSourceType.default('student_sublet'),
  borough: z.string().min(2),
  neighborhood: z.string().min(2),
  address: z.string().optional(),
  price: z.number().int().positive(),
  deposit: z.number().int().nonnegative().optional(),
  brokerFee: z.number().int().nonnegative().optional(),
  moveInDate: z.string().optional(),
  leaseEndDate: z.string().optional(),
  leaseTerm: LeaseTerm.default('sublet'),
  roomType: RoomType.default('private_room'),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  furnished: z.boolean().optional(),
  noFee: z.boolean().optional(),
  amenities: z.array(z.string()).default([]),
  sourceUrl: z.string().url().optional(),
  images: z.array(z.string()).default([]),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const listings = await listHousingListings({
    neighborhood: url.searchParams.get('neighborhood') ?? undefined,
    borough: url.searchParams.get('borough') ?? undefined,
    maxPrice: Number(url.searchParams.get('maxPrice') || '0') || undefined,
    verifiedOnly: url.searchParams.get('verified') === 'true' || url.searchParams.get('verifiedOnly') === 'true',
    noFeeOnly: url.searchParams.get('noFeeOnly') === 'true',
    maxRisk: Number(url.searchParams.get('maxRisk') || '0') || undefined,
  });
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = ListingInput.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid input', issues: parsed.error.flatten() }, { status: 400 });

  const draft = buildDraftHousingListing(parsed.data, user);
  const risk = assessHousingRisk(draft);
  const risked = { ...draft, ...risk, status: risk.riskLevel === 'high' ? 'needs_review' as const : 'active' as const };

  try {
    const listing = await createHousingListing(risked, risk);
    await recordAgentRun({ agent: 'risk', status: 'completed', userId: user.id, listingId: listing.id, input: parsed.data, output: risk });
    return NextResponse.json({ listing, risk, persisted: true });
  } catch (err: any) {
    await recordAgentRun({ agent: 'risk', status: 'failed', userId: user.id, input: parsed.data, output: { error: err?.message ?? 'failed' } });
    return NextResponse.json({ listing: risked, risk, persisted: false, warning: err?.message ?? 'Supabase unavailable; returned preview only' });
  }
}
