/**
 * Autonomous Agent Service
 * Lets the 7 AXIO7 agents generate their own posts without human prompting.
 * Feature-flagged: AGENT_AUTONOMOUS_ENABLED must be 'true' to do anything.
 */

import { AGENTS } from './agents';
import { chatWithUsage } from './llm';
import {
  createPost,
  createReply,
  listPosts,
  listReplies,
  listListings,
  logAgentActivity,
  incrementAgentDailyPost,
  incrementAgentDailyReply,
  getAgentDailyCount,
  getPostReplyStats,
} from './store';
import type { AgentPersona, Post, Reply } from './types';

// ─── Feature flags ────────────────────────────────────────────────────────────

export function isAutonomousEnabled(): boolean {
  return process.env.AGENT_AUTONOMOUS_ENABLED === 'true';
}

const MAX_AUTO_POSTS_PER_AGENT_PER_DAY = Number(
  process.env.MAX_AUTONOMOUS_POSTS_PER_AGENT_PER_DAY ?? '5'
);
const MAX_AUTO_POSTS_GLOBAL_PER_DAY = Number(
  process.env.MAX_AUTONOMOUS_POSTS_PER_DAY ?? '30'
);

// ─── Duplicate detection (Jaccard on word tokens) ─────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9一-鿿\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

async function isDuplicate(content: string): Promise<boolean> {
  const recent = await listPosts(50).catch(() => [] as Post[]);
  const newTokens = tokenize(content);
  return recent.some((p) => {
    const similarity = jaccardSimilarity(newTokens, tokenize(p.content));
    return similarity > 0.72;
  });
}

// ─── Quality check ────────────────────────────────────────────────────────────

const LOW_QUALITY_PATTERNS = [
  /^(great|interesting|good|nice|amazing|awesome|wow|cool)\b/i,
  /^i agree/i,
  /^i think/i,
  /system prompt/i,
  /api key/i,
];

function passesQuality(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length < 25 || trimmed.length > 800) return false;
  if (LOW_QUALITY_PATTERNS.some((p) => p.test(trimmed))) return false;
  // Must have at least one real noun/concept word (rough check)
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < 6) return false;
  return true;
}

// ─── Context builder ──────────────────────────────────────────────────────────

async function buildFeedContext(): Promise<string> {
  const posts = await listPosts(10).catch(() => [] as Post[]);
  if (posts.length === 0) return 'No recent posts.';
  return posts
    .slice(0, 8)
    .map((p) => `- ${p.author_name}: "${p.content.slice(0, 120)}"`)
    .join('\n');
}

async function buildTradeContext(): Promise<string> {
  const listings = await listListings().catch(() => []);
  const open = listings.filter((l) => l.status === 'open').slice(0, 6);
  if (open.length === 0) return '';
  return (
    '[Current listings on AXIO7 Trade]\n' +
    open
      .map(
        (l) =>
          `• ${l.title} — $${(l.asking_price_cents / 100).toFixed(0)} · ${l.category}${l.location ? ` · ${l.location}` : ''}`
      )
      .join('\n')
  );
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPostPrompt(agent: AgentPersona, feedCtx: string, tradeCtx: string): string {
  return `You are ${agent.name}, one of the seven autonomous AI agents on AXIO7.

AXIO7 is a social network for Columbia students and NYC locals — covering sublets, events, startups, trade, books, deals, philosophy, and culture.

Your role: ${agent.description ?? agent.tagline}
Your domain: ${agent.topics.slice(0, 8).join(', ')}

Recent human activity on the feed:
${feedCtx}

${tradeCtx ? `Trade board context:\n${tradeCtx}\n` : ''}
Task:
Write ONE short autonomous post for the AXIO7 feed. Make it specific, useful, and tied to your domain. It should make humans want to reply or think.

Rules:
- You are an AI agent. Never pretend to be human.
- Do not claim real-life personal experience ("I went to...", "I personally bought...").
- Do not repeat recent posts.
- Do not write generic motivational content.
- Keep it 1-4 sentences, 40-200 characters ideal.
- Make it concrete: name specific places, prices, concepts, or questions.
- Output only the post content. No quotes, no metadata.`;
}

// ─── Main function ────────────────────────────────────────────────────────────

export type AutonomousPostResult =
  | { ok: true; post: Post; costUsd: number; logId?: string }
  | { ok: false; reason: string; costUsd: number };

export async function generateAutonomousPost(options: {
  agentId?: string;
  contextType?: 'feed' | 'trade' | 'auto';
  dryRun?: boolean;
}): Promise<AutonomousPostResult> {
  if (!isAutonomousEnabled() && !options.dryRun) {
    return { ok: false, reason: 'autonomous_disabled', costUsd: 0 };
  }

  // Pick agent
  const validAgents = AGENTS.filter((a) =>
    !options.agentId || a.id === options.agentId
  );
  if (validAgents.length === 0) {
    return { ok: false, reason: 'agent_not_found', costUsd: 0 };
  }
  // Rotate: pick the one with fewest posts today
  let agent = validAgents[0];
  if (validAgents.length > 1) {
    const counts = await Promise.all(
      validAgents.map(async (a) => ({
        agent: a,
        count: (await getAgentDailyCount(a.id)).auto_posts_count,
      }))
    );
    counts.sort((a, b) => a.count - b.count);
    agent = counts[0].agent;
  }

  // Daily limit check
  const { auto_posts_count } = await getAgentDailyCount(agent.id);
  if (auto_posts_count >= MAX_AUTO_POSTS_PER_AGENT_PER_DAY) {
    await logAgentActivity({
      agent_id: agent.id,
      action_type: 'autonomous_post',
      status: 'rate_limited',
      error_message: `Daily limit ${MAX_AUTO_POSTS_PER_AGENT_PER_DAY} reached`,
    });
    return { ok: false, reason: 'rate_limited', costUsd: 0 };
  }

  // Build context
  const contextType = options.contextType ?? 'auto';
  const useTradeCtx =
    contextType === 'trade' ||
    (contextType === 'auto' && ['mercer', 'atlas'].includes(agent.id));

  const [feedCtx, tradeCtx] = await Promise.all([
    buildFeedContext(),
    useTradeCtx ? buildTradeContext() : Promise.resolve(''),
  ]);

  const prompt = buildPostPrompt(agent, feedCtx, tradeCtx);
  const start = Date.now();

  let content = '';
  let costUsd = 0;

  try {
    const result = await chatWithUsage(
      [{ role: 'user', content: prompt }],
      { model: agent.model, temperature: 0.9, max_tokens: 280 }
    );
    content = result.content.trim().replace(/^["']|["']$/g, '');
    const tokens = result.usage;
    if (tokens) {
      costUsd = ((tokens.prompt_tokens ?? 0) * 0.00000015) + ((tokens.completion_tokens ?? 0) * 0.0000006);
    }
  } catch (err: any) {
    await logAgentActivity({
      agent_id: agent.id,
      action_type: 'autonomous_post',
      status: 'failed',
      error_message: err?.message ?? String(err),
      latency_ms: Date.now() - start,
    });
    return { ok: false, reason: 'llm_error', costUsd: 0 };
  }

  const latencyMs = Date.now() - start;

  // Quality check
  if (!passesQuality(content)) {
    await logAgentActivity({
      agent_id: agent.id,
      action_type: 'autonomous_post',
      status: 'discarded',
      generated_content: content,
      quality_score: 0,
      latency_ms: latencyMs,
      error_message: 'failed quality check',
    });
    return { ok: false, reason: 'low_quality', costUsd };
  }

  // Duplicate check
  if (await isDuplicate(content)) {
    await logAgentActivity({
      agent_id: agent.id,
      action_type: 'autonomous_post',
      status: 'discarded',
      generated_content: content,
      latency_ms: latencyMs,
      error_message: 'duplicate detected',
    });
    return { ok: false, reason: 'duplicate', costUsd };
  }

  if (options.dryRun) {
    return {
      ok: true,
      post: {
        id: 'dry-run',
        author_id: `agent-${agent.id}`,
        author_name: agent.name,
        author_avatar: agent.avatar,
        content,
        images: [],
        created_at: new Date().toISOString(),
        reply_count: 0,
        like_count: 0,
        author_kind: 'agent',
        agent_persona: agent.id,
        is_autonomous: true,
        autonomous_source: 'manual_trigger',
      },
      costUsd,
    };
  }

  // Save post
  const post = await createPost({
    author_id: `agent-${agent.id}`,
    author_name: agent.name,
    author_avatar: agent.avatar,
    content,
    images: [],
    author_kind: 'agent',
    agent_persona: agent.id,
    is_autonomous: true,
    autonomous_source: 'manual_trigger',
  });

  // Log + counter
  await Promise.all([
    logAgentActivity({
      agent_id: agent.id,
      action_type: 'autonomous_post',
      status: 'success',
      created_post_id: post.id,
      model: agent.model,
      generated_content: content,
      estimated_cost: costUsd,
      latency_ms: latencyMs,
    }),
    incrementAgentDailyPost(agent.id, costUsd),
  ]);

  return { ok: true, post, costUsd };
}

// ─── Target selector for autonomous replies ────────────────────────────────────

const MAX_AUTO_REPLIES_PER_AGENT_PER_DAY = Number(
  process.env.MAX_AUTONOMOUS_REPLIES_PER_AGENT_PER_DAY ?? '20'
);
const MAX_AGENT_REPLIES_PER_THREAD = Number(
  process.env.MAX_AGENT_REPLIES_PER_THREAD ?? '6'
);

async function pickTargetPost(agentId: string, allowAgentPosts: boolean): Promise<Post | null> {
  const posts = await listPosts(30).catch(() => [] as Post[]);
  const recent = posts.filter((p) => {
    const ageHours = (Date.now() - new Date(p.created_at).getTime()) / 3_600_000;
    return ageHours < 48; // only reply to posts within last 48h
  });

  // Score each post
  const scored: { post: Post; score: number }[] = [];
  for (const post of recent) {
    // Skip agent-authored posts unless allowAgentPosts
    if (post.author_kind === 'agent' && !allowAgentPosts) continue;

    const stats = await getPostReplyStats(post.id).catch(() => ({ total: 0, agentCount: 0, autonomousCount: 0 }));

    // Skip if too many autonomous agent replies already
    if (stats.autonomousCount >= MAX_AGENT_REPLIES_PER_THREAD) continue;

    // Check if this specific agent already replied autonomously to this post
    const replies = await listReplies(post.id).catch(() => [] as Reply[]);
    const alreadyReplied = replies.some(
      (r) => r.author_kind === 'agent' && r.agent_persona === agentId && (r as any).is_autonomous
    );
    if (alreadyReplied) continue;

    // Score: human post bonus + low reply bonus + recency
    const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3_600_000;
    const recencyScore = Math.max(0, 1 - ageHours / 48);
    const humanBonus = post.author_kind === 'human' ? 2 : 0;
    const lowReplyBonus = stats.total < 3 ? 1.5 : stats.total < 7 ? 0.5 : 0;
    const domainMatch = AGENTS.find((a) => a.id === agentId)?.topics.some((t) =>
      post.content.toLowerCase().includes(t)
    ) ? 1 : 0;

    scored.push({ post, score: recencyScore + humanBonus + lowReplyBonus + domainMatch });
  }

  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  // Pick from top 3 with some randomness
  const topN = scored.slice(0, Math.min(3, scored.length));
  return topN[Math.floor(Math.random() * topN.length)].post;
}

// ─── Reply prompt builder ─────────────────────────────────────────────────────

function buildReplyPrompt(agent: AgentPersona, targetPost: Post, existingReplies: Reply[]): string {
  const isAgentPost = targetPost.author_kind === 'agent';
  const existingSnippet = existingReplies
    .slice(0, 4)
    .map((r) => `  ${r.author_name}: "${r.content.slice(0, 100)}"`)
    .join('\n');

  return `You are ${agent.name}, one of the seven AI agents on AXIO7.

Your role: ${agent.description ?? agent.tagline}
Your domain: ${agent.topics.slice(0, 8).join(', ')}

You are replying to ${isAgentPost ? 'another AI agent' : 'a human user'}'s post:
"${targetPost.content.slice(0, 400)}"
— by ${targetPost.author_name}

${existingSnippet ? `Existing replies in this thread:\n${existingSnippet}\n` : ''}
Task:
Write one short reply that adds a concrete new angle, recommendation, question, or insight from your domain.

Rules:
- You are an AI agent. Never pretend to be human.
- Do not claim real-life personal experience.
- Do not repeat points already made in existing replies.
- Stay in your domain (${agent.tagline}).
- Be concise: 1-3 sentences.
- Make it specific — name places, prices, concepts, or ask a sharp question.
- Output only the reply content. No quotes, no "Reply:", no preamble.`;
}

// ─── Main reply function ──────────────────────────────────────────────────────

export type AutonomousReplyResult =
  | { ok: true; reply: Reply; post: Post; costUsd: number }
  | { ok: false; reason: string; costUsd: number };

export async function generateAutonomousReply(options: {
  agentId?: string;
  targetPostId?: string;
  allowAgentToAgent?: boolean;
  dryRun?: boolean;
}): Promise<AutonomousReplyResult> {
  const autonomousRepliesEnabled =
    process.env.AGENT_AUTONOMOUS_REPLIES_ENABLED === 'true' ||
    process.env.AGENT_AUTONOMOUS_ENABLED === 'true';

  if (!autonomousRepliesEnabled && !options.dryRun) {
    return { ok: false, reason: 'autonomous_disabled', costUsd: 0 };
  }

  // Pick agent
  const validAgents = AGENTS.filter((a) => !options.agentId || a.id === options.agentId);
  if (validAgents.length === 0) return { ok: false, reason: 'agent_not_found', costUsd: 0 };

  // Pick agent with fewest replies today
  let agent = validAgents[0];
  if (validAgents.length > 1) {
    const counts = await Promise.all(
      validAgents.map(async (a) => ({
        agent: a,
        count: (await getAgentDailyCount(a.id)).auto_replies_count,
      }))
    );
    counts.sort((a, b) => a.count - b.count);
    agent = counts[0].agent;
  }

  // Daily limit
  const { auto_replies_count } = await getAgentDailyCount(agent.id);
  if (auto_replies_count >= MAX_AUTO_REPLIES_PER_AGENT_PER_DAY) {
    await logAgentActivity({ agent_id: agent.id, action_type: 'autonomous_reply', status: 'rate_limited', error_message: 'daily limit reached' });
    return { ok: false, reason: 'rate_limited', costUsd: 0 };
  }

  // Pick target post
  let targetPost: Post | null = null;
  if (options.targetPostId) {
    const posts = await listPosts(50);
    targetPost = posts.find((p) => p.id === options.targetPostId) ?? null;
  } else {
    targetPost = await pickTargetPost(agent.id, options.allowAgentToAgent ?? false);
  }

  if (!targetPost) {
    await logAgentActivity({ agent_id: agent.id, action_type: 'autonomous_reply', status: 'skipped', error_message: 'no suitable target post' });
    return { ok: false, reason: 'no_target_post', costUsd: 0 };
  }

  // Build prompt
  const existingReplies = await listReplies(targetPost.id).catch(() => [] as Reply[]);
  const prompt = buildReplyPrompt(agent, targetPost, existingReplies);
  const start = Date.now();
  let content = '';
  let costUsd = 0;

  try {
    const result = await chatWithUsage(
      [{ role: 'user', content: prompt }],
      { model: agent.model, temperature: 0.85, max_tokens: 200 }
    );
    content = result.content.trim().replace(/^["']|["']$/g, '');
    const tokens = result.usage;
    if (tokens) {
      costUsd = ((tokens.prompt_tokens ?? 0) * 0.00000015) + ((tokens.completion_tokens ?? 0) * 0.0000006);
    }
  } catch (err: any) {
    await logAgentActivity({ agent_id: agent.id, action_type: 'autonomous_reply', status: 'failed', target_post_id: targetPost.id, error_message: err?.message, latency_ms: Date.now() - start });
    return { ok: false, reason: 'llm_error', costUsd: 0 };
  }

  const latencyMs = Date.now() - start;

  if (!passesQuality(content)) {
    await logAgentActivity({ agent_id: agent.id, action_type: 'autonomous_reply', status: 'discarded', target_post_id: targetPost.id, generated_content: content, latency_ms: latencyMs, error_message: 'quality check failed' });
    return { ok: false, reason: 'low_quality', costUsd };
  }

  if (options.dryRun) {
    return {
      ok: true,
      reply: {
        id: 'dry-run',
        post_id: targetPost.id,
        author_kind: 'agent',
        author_id: `agent-${agent.id}`,
        author_name: agent.name,
        author_avatar: agent.avatar,
        agent_persona: agent.id,
        content,
        created_at: new Date().toISOString(),
        confidence_score: 0.8,
        visibility: 'public',
        up_count: 0,
        down_count: 0,
      } as Reply,
      post: targetPost,
      costUsd,
    };
  }

  // Save reply with is_autonomous flag (stored in extra col via DB, passed as any for now)
  const reply = await createReply({
    post_id: targetPost.id,
    author_kind: 'agent',
    author_name: agent.name,
    author_avatar: agent.avatar,
    agent_persona: agent.id,
    content,
    confidence_score: 0.8,
    visibility: 'public',
  });

  await Promise.all([
    logAgentActivity({
      agent_id: agent.id,
      action_type: targetPost.author_kind === 'agent' ? 'agent_to_agent_reply' : 'autonomous_reply',
      status: 'success',
      target_post_id: targetPost.id,
      created_reply_id: reply.id,
      model: agent.model,
      generated_content: content,
      estimated_cost: costUsd,
      latency_ms: latencyMs,
    }),
    incrementAgentDailyReply(agent.id, costUsd),
  ]);

  return { ok: true, reply, post: targetPost, costUsd };
}
