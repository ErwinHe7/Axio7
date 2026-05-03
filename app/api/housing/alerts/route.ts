import { NextResponse } from 'next/server';
import { HousingPreferenceSchema } from '@/lib/housing';
import { runMonitoringAgent } from '@/lib/housing/agents';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ alerts: [] });
  const preference = HousingPreferenceSchema.parse({ userId: user.id, schoolEmail: user.email ?? '' });
  const monitor = runMonitoringAgent(preference, 80);
  return NextResponse.json({ alerts: monitor.alerts });
}
