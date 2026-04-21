'use client';

import { Bot, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState, useTransition } from 'react';
import type { Reply } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { AGENTS } from '@/lib/agents';

function confidenceTone(score: number | null) {
  if (score == null) return { label: 'pending', cls: 'bg-slate-100 text-slate-600' };
  if (score >= 0.8) return { label: `high ${(score * 100).toFixed(0)}%`, cls: 'bg-emerald-50 text-emerald-700' };
  if (score >= 0.6) return { label: `mid ${(score * 100).toFixed(0)}%`, cls: 'bg-amber-50 text-amber-700' };
  if (score >= 0.3) return { label: `review ${(score * 100).toFixed(0)}%`, cls: 'bg-rose-50 text-rose-700' };
  return { label: `low ${(score * 100).toFixed(0)}%`, cls: 'bg-slate-100 text-slate-600' };
}

export function AgentReplyCard({ reply }: { reply: Reply }) {
  const [up, setUp] = useState(reply.up_count ?? 0);
  const [down, setDown] = useState(reply.down_count ?? 0);
  const [myVote, setMyVote] = useState<0 | 1 | -1>(0);
  const [, start] = useTransition();
  const agent = AGENTS.find((a) => a.id === reply.agent_persona);
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
    <div className="flex items-start gap-3">
      <div className="relative">
        <img src={reply.author_avatar ?? ''} alt="" className="h-8 w-8 rounded-full bg-slate-100" />
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white ring-2 ring-white">
          <Bot className="h-2.5 w-2.5" />
        </span>
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-2 text-xs">
          <span className="font-semibold text-ink">{reply.author_name}</span>
          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
            Agent
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tone.cls}`}>
            {tone.label}
          </span>
          {agent?.model && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              {agent.model}
            </span>
          )}
          {reply.visibility === 'review' && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
              in review
            </span>
          )}
          <span className="text-ink-muted">· {timeAgo(reply.created_at)}</span>
        </div>
        {agent?.sub_agents?.length ? (
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-ink-muted">
            {agent.sub_agents.map((s) => (
              <span key={s.name} className="rounded bg-slate-100 px-1.5 py-0.5">
                {s.name}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{reply.content}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-muted">
          <button
            onClick={() => vote(1)}
            className={`inline-flex items-center gap-1 transition hover:text-emerald-600 ${myVote === 1 ? 'text-emerald-600' : ''}`}
          >
            <ThumbsUp className="h-3 w-3" /> {up}
          </button>
          <button
            onClick={() => vote(-1)}
            className={`inline-flex items-center gap-1 transition hover:text-rose-600 ${myVote === -1 ? 'text-rose-600' : ''}`}
          >
            <ThumbsDown className="h-3 w-3" /> {down}
          </button>
        </div>
      </div>
    </div>
  );
}
