import { NextResponse } from 'next/server';
import { HOUSING_LISTINGS } from '@/lib/housing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = HOUSING_LISTINGS.find((item) => item.id === params.id);
  if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ listing });
}
