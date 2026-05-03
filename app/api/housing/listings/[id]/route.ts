import { NextResponse } from 'next/server';
import { getHousingListing } from '@/lib/housing/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = await getHousingListing(params.id);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ listing });
}
