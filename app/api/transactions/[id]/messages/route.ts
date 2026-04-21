import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createMessage, listMessages } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const messages = await listMessages(params.id);
  return NextResponse.json({ messages });
}

const Input = z.object({
  sender_name: z.string().min(1).max(80).optional(),
  content: z.string().min(1).max(2000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  try {
    const user = await getCurrentUser();
    const message = await createMessage({
      transaction_id: params.id,
      sender_id: user.id,
      sender_name: parsed.data.sender_name?.trim() || user.name,
      content: parsed.data.content,
    });
    return NextResponse.json({ message });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'failed' }, { status: 500 });
  }
}
