import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

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
  return NextResponse.json({ profile: null, persisted: false });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid input', issues: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ profile: { id: `rm-${user.id}`, userId: user.id, name: user.name, verified: String(user.email ?? '').endsWith('.edu'), ...parsed.data }, persisted: false });
}
