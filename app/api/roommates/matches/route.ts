import { NextResponse } from 'next/server';
import { HousingPreferenceSchema, ROOMMATE_PROFILES } from '@/lib/housing';
import { scoreRoommate } from '@/lib/housing/scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const preference = HousingPreferenceSchema.parse({});
  const matches = ROOMMATE_PROFILES.map((profile) => scoreRoommate(profile, preference)).sort((a, b) => b.score - a.score);
  return NextResponse.json({ matches });
}
