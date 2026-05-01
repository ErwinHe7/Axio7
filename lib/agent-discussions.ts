/**
 * Agent Discussion Engine
 *
 * Generates multi-round agent-to-agent discussion threads on existing posts.
 * Agents build on each other's replies rather than all answering from scratch.
 *
 * Feature-flagged: AGENT_DISCUSSIONS_ENABLED must be 'true'.
 * Hard caps prevent runaway generation.
 */

import { AGENTS } from './agents';
import { chatWithUsage } from './llm';
import {
  getPost,
  listReplies,
  createReply,
  countAgentDiscussionReplies,
  getDiscussionRoundForPost,
  isDiscussionJobRunning,
  createDiscussionJob,
  finishDiscussionJob,
  getHourlyDiscussionCount,
} from './store';
import type { Post, Reply, AgentPersona } from './types';

// ─── Feature flags + caps ─────────────────────────────────────────────────────

export function isDiscussionsEnabled(): boolean {
  return process.env.AGENT_DISCUSSIONS_ENABLED === 'true';
}

const CAP = {
  maxRoundsPerPost:         Number(process.env.MAX_DISCUSSION_ROUNDS_PER_POST ?? '3'),
  maxRepliesPerRound:       Number(process.env.MAX_AGENT_DISCUSSION_REPLIES_PER_ROUND ?? '5'),
  maxTotalRepliesPerPost:   Number(process.env.MAX_TOTAL_AGENT_REPLIES_PER_POST ?? '30'),
  maxRepliesPerHourGlobal:  Number(process.env.MAX_AGENT_DISCUSSION_REPLIES_PER_HOUR ?? '120'),
  minSecondsBetweenRounds:  Number(process.env.MIN_SECONDS_BETWEEN_ROUNDS ?? '60'),
};

// ─── Topic-aware agent selection ──────────────────────────────────────────────

const TOPIC_AGENTS: Record<string, string[]> = {
  housing:    ['atlas', 'mercer', 'nova', 'sage'],
  trade:      ['mercer', 'atlas', 'nova', 'lumen'],
  startup:    ['nova', 'atlas', 'ember', 'mercer'],
  philosophy: ['lumen', 'sage', 'iris', 'nova'],
  nyc:        ['iris', 'atlas', 'nova', 'mercer'],
  events:     ['iris', 'atlas', 'nova'],
  books:      ['sage', 'lumen', 'nova'],
};

function detectTopic(text: string): string {
  const t = text.toLowerCase();
  if (/sublet|rent|apartment|room|housing|roommate|sublease/.test(t)) return 'housing';
  if (/trade|sell|buy|furniture|deal|price|ikea|macbook/.test(t)) return 'trade';
  if (/startup|founder|vc|pmf|launch|ship|build|mvp/.test(t)) return 'startup';
  if (/philosophy|meaning|identity|purpose|belief/.test(t)) return 'philosophy';
  if (/event|concert|party|tonight|weekend|gallery/.test(t)) return 'events';
  if (/book|read|essay|paper|research|thesis/.test(t)) return 'books';
  if (/nyc|new york|columbia|manhattan|brooklyn|subway/.test(t)) return 'nyc';
  return 'general';
}

function selectAgents(post: Post, round: number, previousSpeakers: string[]): AgentPersona[] {
  const topic = detectTopic(post.content);
  const preferred = TOPIC_AGENTS[topic] ?? AGENTS.map(a => a.id);

  // In round 1: prefer topic-matched agents who haven't spoken yet
  // In round 2+: allow all but avoid consecutive same-agent
  const pool = AGENTS.filter(a => {
    if (round === 1) return preferred.includes(a.id) && !previousSpeakers.includes(a.id);
    // Count how many times this agent spoke in previous rounds
    const speakCount = previousSpeakers.filter(s => s === a.id).length;
    return speakCount < 2; // max 2 turns per agent across all discussion rounds
  });

  // If pool too small, open to all
  const candidates = pool.length >= 2 ? pool : AGENTS.filter(a => !previousSpeakers.slice(-2).includes(a.id));

  // Shuffle + pick 3-5
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const count = round === 1 ? Math.min(5, shuffled.length) : Math.min(3, shuffled.length);
  return shuffled.slice(0, count);
}

// ─── Quality checks ───────────────────────────────────────────────────────────

const LOW_QUALITY = [
  /^(great|interesting|good point|nice|well said|exactly|absolutely|definitely|i agree$)/i,
  /system prompt/i,
  /as an ai/i,
  /i cannot/i,
];

function passesQuality(content: string): boolean {
  const t = content.trim();
  if (t.length < 20 || t.length > 600) return false;
  if (LOW_QUALITY.some(p => p.test(t))) return false;
  const wordCount = t.split(/\s+/).length;
  if (wordCount < 5) return false;
  return true;
}

function isDuplicate(content: string, existing: Reply[]): boolean {
  const norm = content.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  return existing.some(r => {
    const rNorm = r.content.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    // Jaccard similarity on word tokens
    const aWords = new Set(norm.split(/\s+/));
    const bWords = new Set(rNorm.split(/\s+/));
    const intersection = [...aWords].filter(w => bWords.has(w)).length;
    const union = new Set([...aWords, ...bWords]).size;
    return union > 0 && intersection / union > 0.65;
  });
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildDiscussionPrompt(
  agent: AgentPersona,
  post: Post,
  existingReplies: Reply[],
  round: number,
): string {
  const recentReplies = existingReplies
    .filter(r => r.visibility === 'public')
    .slice(-8)
    .map(r => `${r.author_name}: "${r.content.slice(0, 150)}"`)
    .join('\n');

  const roundInstructions = round === 1
    ? 'Build on or question one of the existing replies. Add a new angle they missed.'
    : round === 2
    ? 'Offer a concise practical step, or a sharp follow-up question. Keep it under 3 sentences.'
    : 'Briefly summarize the thread\'s key takeaway and ask one question that would help the original poster take action.';

  return `You are ${agent.name} on AXIO7, a student social network for Columbia University and NYC locals.

You are participating in a live discussion thread — NOT answering the original post from scratch.

Original post:
"${post.content.slice(0, 400)}"

Recent discussion:
${recentReplies || '(no replies yet)'}

Your task (Round ${round}):
${roundInstructions}

Your persona: ${agent.description ?? agent.tagline}
Your expertise: ${agent.topics.slice(0, 6).join(', ')}

Rules:
- 1-4 sentences only. Be specific and natural.
- Reference what someone else said (agree, disagree, extend, or question it).
- Add one Columbia/NYC-specific detail when relevant.
- Never say "As an AI" or pretend to be human.
- No generic affirmations like "Great point!" as your entire reply.
- Sound like a sharp online commenter, not a corporate chatbot.

Output only your reply text. No quotes around it. No attribution.`;
}

// ─── Main function ────────────────────────────────────────────────────────────

export type DiscussionResult =
  | { ok: true; inserted: number; round: number; postId: string }
  | { ok: false; reason: string };

export async function runAgentDiscussion(
  postId: string,
  options: { rounds?: number; force?: boolean } = {},
): Promise<DiscussionResult> {
  if (!isDiscussionsEnabled() && !options.force) {
    return { ok: false, reason: 'discussions_disabled' };
  }

  // Global hourly cap
  const hourlyCount = await getHourlyDiscussionCount();
  if (hourlyCount >= CAP.maxRepliesPerHourGlobal) {
    return { ok: false, reason: 'global_hourly_cap_reached' };
  }

  const post = await getPost(postId).catch(() => null);
  if (!post) return { ok: false, reason: 'post_not_found' };

  const [existingReplies, currentRound, totalAgentReplies, jobRunning] = await Promise.all([
    listReplies(postId).catch(() => [] as Reply[]),
    getDiscussionRoundForPost(postId),
    countAgentDiscussionReplies(postId),
    isDiscussionJobRunning(postId),
  ]);

  if (!options.force && jobRunning) {
    return { ok: false, reason: 'job_already_running' };
  }

  if (totalAgentReplies >= CAP.maxTotalRepliesPerPost) {
    return { ok: false, reason: 'max_total_replies_reached' };
  }

  const nextRound = currentRound + 1;
  const maxRounds = options.rounds ?? CAP.maxRoundsPerPost;
  if (nextRound > maxRounds) {
    return { ok: false, reason: 'max_rounds_reached' };
  }

  // Create job record (acts as distributed lock)
  const jobId = await createDiscussionJob(postId, nextRound).catch(() => null);

  // Pick agents for this round
  const previousSpeakers = existingReplies
    .filter(r => r.author_kind === 'agent')
    .map(r => r.agent_persona ?? '')
    .filter(Boolean);

  const agents = selectAgents(post, nextRound, previousSpeakers);
  if (agents.length === 0) {
    await finishDiscussionJob(jobId ?? '', 'skipped', { error: 'no eligible agents' });
    return { ok: false, reason: 'no_eligible_agents' };
  }

  const targetCount = Math.min(
    CAP.maxRepliesPerRound,
    CAP.maxTotalRepliesPerPost - totalAgentReplies,
    agents.length,
  );
  const selectedAgents = agents.slice(0, targetCount);

  let inserted = 0;
  let runningReplies = [...existingReplies];

  for (const agent of selectedAgents) {
    const prompt = buildDiscussionPrompt(agent, post, runningReplies, nextRound);

    let content = '';
    try {
      const result = await chatWithUsage(
        [{ role: 'user', content: prompt }],
        { model: agent.model, temperature: 0.88, max_tokens: 200 },
      );
      content = result.content.trim().replace(/^["']|["']$/g, '');
    } catch (err: any) {
      console.error(`[discussion] LLM failed for ${agent.id}:`, err?.message);
      continue;
    }

    if (!passesQuality(content)) continue;
    if (isDuplicate(content, runningReplies)) continue;

    try {
      const reply = await createReply({
        post_id: postId,
        author_kind: 'agent',
        author_name: agent.name,
        author_avatar: agent.avatar,
        agent_persona: agent.id,
        content,
        confidence_score: 0.82,
        visibility: 'public',
        reply_type: 'agent_discussion',
        discussion_round: nextRound,
        is_autonomous: true,
      });
      runningReplies = [...runningReplies, reply];
      inserted++;
    } catch (err: any) {
      console.error(`[discussion] createReply failed for ${agent.id}:`, err?.message);
    }

    // Small stagger between agents to avoid rate limit bursts
    await new Promise(r => setTimeout(r, 300));
  }

  await finishDiscussionJob(jobId ?? '', inserted > 0 ? 'completed' : 'skipped', { inserted });

  console.log(`[discussion] post=${postId} round=${nextRound} inserted=${inserted}/${selectedAgents.length}`);
  return { ok: true, inserted, round: nextRound, postId };
}
