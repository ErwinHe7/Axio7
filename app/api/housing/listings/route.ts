import { NextResponse } from 'next/server';
import { z } from 'zod';
import { HOUSING_LISTINGS, HousingSourceType, LeaseTerm, RoomType } from '@/lib/housing';
import { assessHousingRisk } from '@/lib/housing/risk';
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
  const neighborhood = url.searchParams.get('neighborhood')?.toLowerCase();
  const borough = url.searchParams.get('borough')?.toLowerCase();
  const maxPrice = Number(url.searchParams.get('maxPrice') || '0');
  const verified = url.searchParams.get('verified') === 'true';
  const listings = HOUSING_LISTINGS.filter((listing) => {
    if (neighborhood && !listing.neighborhood.toLowerCase().includes(neighborhood)) return false;
    if (borough && !listing.borough.toLowerCase().includes(borough)) return false;
    if (maxPrice && listing.price > maxPrice) return false;
    if (verified && !listing.isEduVerifiedPost && listing.verificationStatus !== 'admin_verified') return false;
    return true;
  });
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = ListingInput.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid input', issues: parsed.error.flatten() }, { status: 400 });
  const draft = {
    id: `hx-user-${Date.now()}`,
    ...parsed.data,
    realMonthlyCost: parsed.data.price + Math.round((parsed.data.brokerFee ?? 0) / 12),
    commute: {},
    postedByUserId: user.id,
    posterName: user.name,
    isEduVerifiedPost: String(user.email ?? '').endsWith('.edu'),
    verificationStatus: String(user.email ?? '').endsWith('.edu') ? 'edu_verified' as const : 'unverified' as const,
    riskScore: 50,
    riskLevel: 'medium' as const,
    riskReasons: [],
    positiveSignals: [],
    status: 'draft' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const risk = assessHousingRisk(draft);
  return NextResponse.json({ listing: { ...draft, ...risk, status: 'needs_review' }, risk, persisted: false });
}
