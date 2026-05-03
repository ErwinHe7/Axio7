import { NextResponse } from 'next/server';
import { HousingPreferenceSchema, ROOMMATE_PROFILES } from '@/lib/housing';
import { scoreRoommate } from '@/lib/housing/scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const preference = HousingPreferenceSchema.parse({});
  return NextResponse.json({ ok: true, job: 'roommate-matches', matches: ROOMMATE_PROFILES.map((profile) => scoreRoommate(profile, preference)) });
}
