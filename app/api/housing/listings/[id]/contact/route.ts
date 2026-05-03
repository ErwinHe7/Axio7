import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { HOUSING_LISTINGS, HousingPreferenceSchema } from '@/lib/housing';
import { runCommunicationAgent } from '@/lib/housing/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({
  message: z.string().max(2000).optional(),
  preference: HousingPreferenceSchema.optional(),
  language: z.enum(['en', 'zh']).default('en'),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const listing = HOUSING_LISTINGS.find((item) => item.id === params.id);
  if (!listing) return NextResponse.json({ error: 'listing not found' }, { status: 404 });
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json ?? {});
  if (!parsed.success) return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  const draft = runCommunicationAgent({ listing, preference: parsed.data.preference, language: parsed.data.language });
  return NextResponse.json({ ok: true, listingId: listing.id, draft, threadStatus: 'queued_for_message', persisted: false });
}
