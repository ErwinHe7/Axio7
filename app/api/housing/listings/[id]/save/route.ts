import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { saveHousingListing } from '@/lib/housing/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const saved = await saveHousingListing(user.id, params.id);
  return NextResponse.json({ ok: true, saved });
}
