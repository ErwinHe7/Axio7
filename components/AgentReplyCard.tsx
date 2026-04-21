'use client';

import { Bot, ThumbsDown, ThumbsUp, Sparkles } from 'lucide-react';
import { useState, useTransition } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Reply } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { AGENTS } from '@/lib/agents';

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
  if (score >= 0.8) return { label: `${(score * 100).toFixed(0)}%`, cls: 'text-emerald-400' };
  if (score >= 0.6) return { label: `${(score * 100).toFixed(0)}%`, cls: 'text-amber-400' };
  return { label: `${(score * 100).toFixed(0)}%`, cls: 'text-rose-400' };
}

interface Props { reply: Reply; index?: number; }

export function AgentReplyCard({ reply, index = 0 }: Props) {
  const [up, setUp] = useState(reply.up_count ?? 0);
  const [down, setDown] = useState(reply.down_count ?? 0);
  const [myVote, setMyVote] = useState<0 | 1 | -1>(0);
  const [expanded, setExpanded] = useState(false);
  const [, start] = useTransition();
  const prefersReduced = useReducedMotion();

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
    <motion.div
      className="relative overflow-hidden rounded-2xl pl-5 pr-4 py-3.5"
      style={{
        background: 'rgba(11,79,108,0.12)',
        border: '1px solid var(--glass-border)',
      }}
      initial={prefersReduced ? false : { opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
    >
      {/* Left persona color bar */}
      <span aria-hidden className="absolute left-0 top-0 h-full w-[2px]" style={{ background: bar }} />

      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={reply.author_avatar ?? ''}
            alt={reply.author_name}
            className="h-9 w-9 rounded-full"
            style={{ boxShadow: `0 0 0 2px var(--bg-deep), 0 0 0 3px ${bar}44` }}
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full ring-2"
            style={{ background: bar, boxShadow: '0 0 0 2px var(--bg-deep)' }}
          >
            <Bot className="h-2.5 w-2.5 text-white" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 text-xs">
            <span className="text-[14px] font-semibold" style={{ color: bar }}>{reply.author_name}</span>
            {agent?.tagline && (
              <span className="hidden truncate text-[11px] sm:inline" style={{ color: 'rgba(247,240,232,0.35)' }}>
                {agent.tagline}
              </span>
            )}
            <span className="ml-auto text-[11px]" style={{ color: 'rgba(247,240,232,0.3)' }}>{timeAgo(reply.created_at)}</span>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-[1.65]" style={{ color: 'rgba(247,240,232,0.85)' }}>
            {display}
          </p>
          {isLong && (
            <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-[12px] font-medium" style={{ color: 'rgba(247,240,232,0.5)' }}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'rgba(247,240,232,0.35)' }}>
            <button onClick={() => vote(1)} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-white/5 ${myVote === 1 ? 'font-semibold text-emerald-400' : ''}`}>
              <ThumbsUp className="h-3 w-3" /> {up}
            </button>
            <button onClick={() => vote(-1)} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-white/5 ${myVote === -1 ? 'font-semibold text-rose-400' : ''}`}>
              <ThumbsDown className="h-3 w-3" /> {down}
            </button>
            <span className="ml-auto flex items-center gap-2">
              {agent?.model && (
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--molt-shell)' }}>
                  {agent.model.split('/').pop()}
                </span>
              )}
              {tone.label && (
                <span className={`inline-flex items-center gap-0.5 font-medium ${tone.cls}`}>
                  <Sparkles className="h-2.5 w-2.5" />{tone.label}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Verified badge slot */}
      <div data-slot="verified-badge" className="absolute top-2 right-2 empty:hidden" />
    </motion.div>
  );
}
