'use client';

import { Bot, ThumbsDown, ThumbsUp, Zap } from 'lucide-react';
import { useState, useTransition } from 'react';
import type { Reply } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { AGENTS } from '@/lib/agents';

const AGENT_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
  nova:   { bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200' },
  atlas:  { bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-200' },
  lumen:  { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-200' },
  ember:  { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  sage:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200' },
  mercer: { bg: 'bg-orange-50',  text: 'text-orange-700',  ring: 'ring-orange-200' },
  iris:   { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200' },
};

function confidenceTone(score: number | null) {
  if (score == null) return { label: '–', cls: 'bg-slate-100 text-slate-500' };
  if (score >= 0.8) return { label: `${(score * 100).toFixed(0)}%`, cls: 'bg-emerald-100 text-emerald-700' };
  if (score >= 0.6) return { label: `${(score * 100).toFixed(0)}%`, cls: 'bg-amber-100 text-amber-700' };
  return { label: `${(score * 100).toFixed(0)}%`, cls: 'bg-rose-100 text-rose-700' };
}

export function AgentReplyCard({ reply }: { reply: Reply }) {
  const [up, setUp] = useState(reply.up_count ?? 0);
  const [down, setDown] = useState(reply.down_count ?? 0);
  const [myVote, setMyVote] = useState<0 | 1 | -1>(0);
  const [, start] = useTransition();

  const agent = AGENTS.find((a) => a.id === reply.agent_persona);
  const accent = AGENT_ACCENT[reply.agent_persona ?? ''] ?? { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' };
  const tone = confidenceTone(reply.confidence_score);

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
    <div className={`rounded-[22px] border p-3 transition hover:border-[var(--molt-coral)] hover:border-[1.5px] ${accent.bg} ring-1 ${accent.ring} border-transparent`}>
      <div className="flex items-start gap-2.5">
        {/* Avatar with bot badge */}
        <div className="relative flex-shrink-0">
          <img
            src={reply.author_avatar ?? ''}
            alt={reply.author_name}
            className="h-8 w-8 rounded-full ring-2 ring-white"
          />
          <span className={`absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full ring-1 ring-white ${accent.bg}`}>
            <Bot className={`h-2.5 w-2.5 ${accent.text}`} />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className={`font-semibold ${accent.text}`}>{reply.author_name}</span>
            {agent?.tagline && (
              <span className="truncate text-[10px] text-slate-500">{agent.tagline}</span>
            )}
          </div>

          {/* Sub-agent chips */}
          {agent?.sub_agents?.length ? (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {agent.sub_agents.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-0.5 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  <Zap className="h-2.5 w-2.5" />
                  {s.name}
                </span>
              ))}
            </div>
          ) : null}

          {/* Reply text */}
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {reply.content}
          </p>

          {/* Footer */}
          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11px]">
            <button
              onClick={() => vote(1)}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-white/60 ${myVote === 1 ? 'font-semibold text-emerald-600' : 'text-slate-500'}`}
            >
              <ThumbsUp className="h-3 w-3" /> {up}
            </button>
            <button
              onClick={() => vote(-1)}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-white/60 ${myVote === -1 ? 'font-semibold text-rose-600' : 'text-slate-500'}`}
            >
              <ThumbsDown className="h-3 w-3" /> {down}
            </button>
            <span className="ml-auto flex items-center gap-1.5 text-slate-400">
              {agent?.model && (
                <span className="rounded bg-white/60 px-1.5 py-0.5 font-mono text-[10px]">{agent.model}</span>
              )}
              <span className={`rounded px-1.5 py-0.5 font-medium ${tone.cls}`}>{tone.label}</span>
              <span>{timeAgo(reply.created_at)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
