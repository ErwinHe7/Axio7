import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    profile: {
      userId: user.id,
      name: user.name,
      email: user.email,
      schoolEmail: user.email?.endsWith('.edu') ? user.email : '',
      school: user.email?.includes('columbia') ? 'Columbia' : '',
      isEduVerified: Boolean(user.email?.endsWith('.edu')),
      verificationMethod: user.email?.endsWith('.edu') ? 'edu_email' : 'none',
      verifiedAt: user.email?.endsWith('.edu') ? new Date().toISOString() : undefined,
    },
    persisted: false,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.authenticated) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ profile: { userId: user.id, ...body }, persisted: false });
}
