import { NextResponse } from 'next/server';
import { acceptBid } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await acceptBid(params.id);
    if (!result) return NextResponse.json({ error: 'bid not acceptable' }, { status: 400 });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'failed' }, { status: 500 });
  }
}
