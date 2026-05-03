import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({ schoolEmail: z.string().email(), code: z.string().min(4) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  if (!parsed.data.schoolEmail.toLowerCase().endsWith('.edu')) return NextResponse.json({ error: 'school email must end in .edu' }, { status: 400 });
  return NextResponse.json({ ok: true, isEduVerified: true, schoolEmail: parsed.data.schoolEmail, verifiedAt: new Date().toISOString(), persisted: false });
}
