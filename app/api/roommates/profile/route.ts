import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { getRoommateProfile, upsertRoommateProfile } from '@/lib/housing/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({
  school: z.string().min(2),
  budget: z.number().int().positive(),
  moveInDate: z.string().min(1),
  preferredNeighborhoods: z.array(z.string()).default([]),
  sleepSchedule: z.string().default('flexible'),
  cleanliness: z.string().default('clean'),
  noiseTolerance: z.string().default('moderate'),
  socialLevel: z.string().default('balanced'),
  cookingFrequency: z.string().default('sometimes'),
  intro: z.string().max(1000).default(''),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ profile: null });
  const profile = await getRoommateProfile(user.id);
  return NextResponse.json({ profile, persisted: Boolean(profile) });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid input', issues: parsed.error.flatten() }, { status: 400 });
  const draft = { id: `rm-${user.id}`, userId: user.id, name: user.name, verified: String(user.email ?? '').endsWith('.edu'), ...parsed.data };
  try {
    const profile = await upsertRoommateProfile(user.id, draft);
    return NextResponse.json({ profile, persisted: true });
  } catch (err: any) {
    return NextResponse.json({ profile: draft, persisted: false, warning: err?.message ?? 'Supabase unavailable' });
  }
}
