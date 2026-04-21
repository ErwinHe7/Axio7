import { NextResponse } from 'next/server';
import { getListing, listBids } from '@/lib/store';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = await getListing(params.id);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const bids = await listBids(listing.id);
  return NextResponse.json({ listing, bids });
}
