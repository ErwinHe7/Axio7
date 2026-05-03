import { NextResponse } from 'next/server';
import { NYC_NEIGHBORHOODS } from '@/lib/housing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const neighborhood = NYC_NEIGHBORHOODS.find((item) => item.slug === params.slug);
  if (!neighborhood) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ neighborhood });
}
