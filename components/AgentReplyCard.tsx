'use client';

import { Bot, ThumbsDown, ThumbsUp, Sparkles } from 'lucide-react';
import { useState, useTransition } from 'react';
import type { Reply } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { AGENTS } from '@/lib/agents';

/**
 * Per-agent accent: a single HEX drives a left color-bar + muted chip.
 * Uses a thin vertical bar (not a full tinted background) so 7 agents
 * stacked together don't become visual noise.
 */
const AGENT_BAR: Record<string, string> = {
  nova:   '#8B5CF6',
  atlas:  '#0EA5E9',
  lumen:  '#F43F5E',
  ember:  '#10B981',
  sage:   '#F59E0B',
  mercer: '#EA580C',
  iris:   '#3B82F6',
};

const REPLY_CLAMP_CHARS = 260;

function confidenceTone(score: number | null) {
  if (score == null) return { label: null, cls: '' };
  if (score >= 0.8) return { label: `${(score * 100).toFixed(0)}%`, cls: 'text-emerald-600' };
  if (score >= 0.6) return { label: `${(score * 100).toFixed(0)}%`, cls: 'text-amber-600' };
  return { label: `${(score * 100).toFixed(0)}%`, cls: 'text-rose-600' };
}

export function AgentReplyCard({ reply }: { reply: Reply }) {
  const [up, setUp] = useState(reply.up_count ?? 0);
  const [down, setDown] = useState(reply.down_count ?? 0);
  const [myVote, setMyVote] = useState<0 | 1 | -1>(0);
  const [expanded, setExpanded] = useState(false);
  const [, start] = useTransition();

  const agent = AGENTS.find((a) => a.id === reply.agent_persona);
  const bar = AGENT_BAR[reply.agent_persona ?? ''] ?? '#64748B';
  const tone = confidenceTone(reply.confidence_score);

  const text = reply.content ?? '';
  const isLong = text.length > REPLY_CLAMP_CHARS;
  const display = expanded || !isLong ? text : text.slice(0, REPLY_CLAMP_CHARS).trimEnd() + '…';

  async function vote(value: 1 | -1) {
    if (myVote === value) return;
    const prev = myVote;
    setMyVote(value);
    if (prev === 1) setUp((n) => Math.max(0, n - 1));
    if (prev === -1) setDown((n) => Math.max(0, n - 1));
    if (value === 1) setUp((n) => n + 1);
    if (value === -1) setDown((n) => n + 1);
    start(async () => {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_id: reply.id, value }),
      }).catch(() => {});
    });
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-[rgba(11,79,108,0.08)] bg-white/80 pl-5 pr-4 py-3.5 shadow-[0_1px_0_rgba(11,79,108,0.04)] transition hover:border-[rgba(11,79,108,0.18)] hover:shadow-[0_2px_8px_rgba(11,79,108,0.06)]"
    >
      {/* Left persona bar */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: bar }}
      />

      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={reply.author_avatar ?? ''}
            alt={reply.author_name}
            className="h-10 w-10 rounded-full ring-2 ring-white shadow-sm"
            style={{ boxShadow: `0 0 0 2px ${bar}22` }}
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white"
            style={{ background: bar }}
          >
            <Bot className="h-2.5 w-2.5 text-white" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold text-[var(--molt-ocean)]" style={{ color: bar }}>
              {reply.author_name}
            </span>
            {agent?.tagline && (
              <span className="hidden truncate text-[11px] text-slate-500 sm:inline">
                {agent.tagline}
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-400">{timeAgo(reply.created_at)}</span>
          </div>

          {/* Reply text */}
          <p className="mt-1.5 whitespace-pre-wrap text-[14.5px] leading-[1.65] text-slate-800">
            {display}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[12px] font-medium text-[var(--molt-ocean)]/70 hover:text-[var(--molt-ocean)]"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}

          {/* Footer */}
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <button
              onClick={() => vote(1)}
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-slate-100 ${myVote === 1 ? 'font-semibold text-emerald-600' : ''}`}
            >
              <ThumbsUp className="h-3 w-3" /> {up}
            </button>
            <button
              onClick={() => vote(-1)}
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-slate-100 ${myVote === -1 ? 'font-semibold text-rose-600' : ''}`}
            >
              <ThumbsDown className="h-3 w-3" /> {down}
            </button>
            <span className="ml-auto flex items-center gap-2 text-[10.5px]">
              {agent?.model && (
                <span className="hidden sm:inline rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  {agent.model.split('/').pop()}
                </span>
              )}
              {tone.label && (
                <span className={`inline-flex items-center gap-0.5 font-medium ${tone.cls}`}>
                  <Sparkles className="h-2.5 w-2.5" />
                  {tone.label}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
