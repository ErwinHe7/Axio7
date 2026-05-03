import { NextResponse } from 'next/server';
import { z } from 'zod';
import { HOUSING_LISTINGS, HousingPreferenceSchema } from '@/lib/housing';
import { runCommunicationAgent } from '@/lib/housing/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({
  listingId: z.string(),
  preference: HousingPreferenceSchema.optional(),
  scenario: z.enum(['subletter', 'landlord', 'leasing_office', 'roommate', 'risk_questions', 'video_tour']).default('subletter'),
  language: z.enum(['en', 'zh']).default('en'),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  const listing = HOUSING_LISTINGS.find((item) => item.id === parsed.data.listingId);
  if (!listing) return NextResponse.json({ error: 'listing not found' }, { status: 404 });
  return NextResponse.json({ draft: runCommunicationAgent({ listing, preference: parsed.data.preference, scenario: parsed.data.scenario, language: parsed.data.language }) });
}
