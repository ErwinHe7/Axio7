import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({ schoolEmail: z.string().email() });

function schoolFromEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (domain.includes('columbia.edu')) return 'Columbia';
  if (domain.includes('nyu.edu')) return 'NYU';
  if (domain.includes('fordham.edu')) return 'Fordham';
  if (domain.includes('newschool.edu')) return 'Parsons / The New School';
  if (domain.includes('baruch.cuny.edu') || domain.includes('cuny.edu')) return 'Baruch / CUNY';
  return domain.endsWith('.edu') ? domain.replace('.edu', '') : 'Unknown';
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  const domain = parsed.data.schoolEmail.split('@')[1]?.toLowerCase() ?? '';
  if (!domain.endsWith('.edu')) return NextResponse.json({ error: 'school email must end in .edu' }, { status: 400 });
  return NextResponse.json({ ok: true, status: 'pending', school: schoolFromEmail(parsed.data.schoolEmail), verificationMethod: 'edu_email', devCode: 'AXIO7-EDU-DEMO' });
}
