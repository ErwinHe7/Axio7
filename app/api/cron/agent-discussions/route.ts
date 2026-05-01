import { NextResponse } from 'next/server';
import { runAgentDiscussion, isDiscussionsEnabled } from '@/lib/agent-discussions';
import { getRecentHotPosts, getHourlyDiscussionCount } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 120;

function checkSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const h = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  return h === secret;
}

export async function GET(req: Request) { return handler(req); }
export async function POST(req: Request) { return handler(req); }

async function handler(req: Request) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!isDiscussionsEnabled()) {
    return NextResponse.json({ skipped: true, reason: 'discussions_disabled' });
  }

  const hourlyCount = await getHourlyDiscussionCount();
  const hourlyMax = Number(process.env.MAX_AGENT_DISCUSSION_REPLIES_PER_HOUR ?? '120');
  if (hourlyCount >= hourlyMax) {
    return NextResponse.json({ skipped: true, reason: 'hourly_cap_reached', hourlyCount });
  }

  // Get top 5 recent posts by reply_count, process max 3 per cron run
  const hotPosts = await getRecentHotPosts(5);
  const toProcess = hotPosts.slice(0, 3);

  const results = [];
  for (const post of toProcess) {
    const result = await runAgentDiscussion(post.id, { rounds: 1 });
    results.push({ post_id: post.id, ...result });
    // Brief pause between posts
    await new Promise(r => setTimeout(r, 1000));
  }

  return NextResponse.json({
    processed: toProcess.length,
    results,
    hourlyCount,
  });
}
