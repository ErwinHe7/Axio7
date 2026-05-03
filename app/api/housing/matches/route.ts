import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { runMatchingAgent } from '@/lib/housing/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const preference = HousingPreferenceSchema.parse({});
  return NextResponse.json(runMatchingAgent(preference));
}
