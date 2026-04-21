import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPost, listPosts } from '@/lib/store';
import { fanOutAgentReplies } from '@/lib/agent-fanout';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to 60s so fan-out (7 LLM calls) can complete before Vercel cuts the function.
export const maxDuration = 60;

export async function GET() {
  try {
    const posts = await listPosts();
    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error('[GET /api/posts]', err?.message);
    return NextResponse.json({ posts: [], error: err?.message ?? 'db error' }, { status: 500 });
  }
}

const PostInput = z.object({
  author_name: z.string().max(80).optional(),
  content: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(4).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = PostInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  }
  try {
    const user = await getCurrentUser();

    const post = await createPost({
      author_id: user.id,
      author_name: parsed.data.author_name?.trim() || user.name || 'Anonymous',
      author_avatar: user.avatar,
      content: parsed.data.content,
      images: parsed.data.images ?? [],
    });

    // Await fan-out directly. maxDuration=60 gives us time to run all 7 agents.
    // This means the POST response takes ~5-15s but the client doesn't need to
    // wait — PostComposer fires and forgets, then polls via router.refresh().
    fanOutAgentReplies(post.id).catch((err) =>
      console.error('[posts POST] fanout failed', err)
    );

    // Return immediately — fan-out runs concurrently and Vercel keeps the function
    // alive until all pending promises settle (within maxDuration).
    return NextResponse.json({ post });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'failed' }, { status: 500 });
  }
}
