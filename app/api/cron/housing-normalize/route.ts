import { NextResponse } from 'next/server';
import { seedHousingAdapter } from '@/lib/housing/adapters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const raw = await seedHousingAdapter.fetchListings();
  return NextResponse.json({ ok: true, job: 'housing-normalize', source: seedHousingAdapter.name, normalized: raw.length });
}
