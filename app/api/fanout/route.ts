import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fanOutAgentReplies } from '@/lib/agent-fanout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Input = z.object({ post_id: z.string().uuid() });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Input.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid input' }, { status: 400 });

  const result = await fanOutAgentReplies(parsed.data.post_id).catch((err) => {
    console.error('[fanout]', err);
    return { succeeded: 0, failed: 7 };
  });

  return NextResponse.json(result);
}
