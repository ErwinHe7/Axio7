import { NextResponse } from 'next/server';
import { runNeighborhoodAgent } from '@/lib/housing/agents';
import { NYC_NEIGHBORHOODS } from '@/lib/housing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const school = url.searchParams.get('school') ?? undefined;
  const maxCommuteMinutes = Number(url.searchParams.get('maxCommuteMinutes') || '0') || undefined;
  return NextResponse.json({ neighborhoods: school ? runNeighborhoodAgent({ school, maxCommuteMinutes }) : NYC_NEIGHBORHOODS });
}
