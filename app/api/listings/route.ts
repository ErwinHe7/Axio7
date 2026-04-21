import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createListing, listListings } from '@/lib/store';
import { upsertChunk } from '@/lib/knowledge';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? undefined;
  const listings = await listListings({ category });
  return NextResponse.json({ listings });
}

const Input = z.object({
  seller_name: z.string().min(1).max(80),
  category: z.enum(['sublet', 'furniture', 'electronics', 'books', 'services', 'tickets', 'tutoring', 'other']),
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(4000),
  asking_price_cents: z.number().int().nonnegative(),
  location: z.string().max(140).optional(),
  images: z.array(z.string().url().max(500)).max(6).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input', detail: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const user = await getCurrentUser();
    const listing = await createListing({
      seller_id: user.id,
      seller_name: d.seller_name?.trim() || user.name,
      category: d.category,
      title: d.title,
      description: d.description,
      asking_price_cents: d.asking_price_cents,
      currency: 'USD',
      location: d.location ?? null,
      images: d.images ?? [],
    });
    await upsertChunk({
      source_kind: 'listing',
      source_id: listing.id,
      content: `Listing (${listing.category}) ${listing.title} — $${(listing.asking_price_cents / 100).toFixed(0)} in ${listing.location ?? 'NYC'}. ${listing.description.slice(0, 200)}`,
    });
    return NextResponse.json({ listing });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'failed' }, { status: 500 });
  }
}
