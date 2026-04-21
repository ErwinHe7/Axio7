'use client';

import { Heart, MessageCircle, Share2, Check, Sparkles, MessageSquarePlus, Repeat2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'framer-motion';
import type { Post, Reply } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { AGENTS } from '@/lib/agents';
import { AgentReplyCard } from './AgentReplyCard';
import { ReplyComposer } from './ReplyComposer';

const POST_CLAMP_CHARS = 360;

// Resolve agent display name from persona id (ignores stale DB names)
function resolveAgentName(reply: Reply): string {
  if (reply.agent_persona) {
    const agent = AGENTS.find((a) => a.id === reply.agent_persona);
    if (agent) return agent.name;
  }
  return reply.author_name;
}

export function PostCard({ post, replies }: { post: Post; replies: Reply[] }) {
  const [likes, setLikes] = useState(post.like_count);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Agent replies collapsed by default
  const [showAgentReplies, setShowAgentReplies] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [localReplies, setLocalReplies] = useState<Reply[]>([]);
  const [, start] = useTransition();

  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-cy * 7);
    rotateY.set(cx * 7);
  }
  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => (next ? n + 1 : Math.max(0, n - 1)));
    start(async () => {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' }).catch(() => null);
      if (!res?.ok) {
        setLiked(!next);
        setLikes((n) => (!next ? n + 1 : Math.max(0, n - 1)));
      }
    });
  }

  function share() {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const text = post.content ?? '';
  const isLong = text.length > POST_CLAMP_CHARS;
  const display = expanded || !isLong ? text : text.slice(0, POST_CLAMP_CHARS).trimEnd() + '…';

  const imgs = post.images ?? [];
  const gridClass = imgs.length === 1 ? 'grid-cols-1' : imgs.length === 2 ? 'grid-cols-2' : imgs.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  const allReplies = [...replies, ...localReplies];
  const agentReplies = allReplies.filter((r) => r.author_kind === 'agent');
  const humanReplies = allReplies.filter((r) => r.author_kind === 'human');
  const awaitingAgents = agentReplies.length === 0 && Date.now() - new Date(post.created_at).getTime() < 60_000;

  const footerColor = 'rgba(247,240,232,0.4)';

  return (
    <motion.article
      ref={cardRef as any}
      data-block="post-card"
      className="group rounded-[24px] p-5 sm:p-6"
      style={{
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(12px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.5)',
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
      whileHover={prefersReduced ? {} : { y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onHoverStart={() => {
        if (!prefersReduced) {
          (cardRef.current as HTMLElement | null)?.style.setProperty('box-shadow', '0 0 32px var(--glow-shell)');
          (cardRef.current as HTMLElement | null)?.style.setProperty('border-color', 'rgba(216,71,39,0.35)');
        }
      }}
      onHoverEnd={() => {
        (cardRef.current as HTMLElement | null)?.style.setProperty('box-shadow', 'none');
        (cardRef.current as HTMLElement | null)?.style.setProperty('border-color', 'var(--glass-border)');
      }}
    >
      <header className="flex items-start gap-3.5">
        <img src={post.author_avatar ?? ''} alt="" className="h-11 w-11 flex-shrink-0 rounded-full bg-slate-700 ring-2" style={{ boxShadow: '0 0 0 2px var(--bg-deep)' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold" style={{ color: 'var(--molt-sand)' }}>{post.author_name}</span>
            <span className="text-xs" style={{ color: 'rgba(247,240,232,0.4)' }}>· {timeAgo(post.created_at)}</span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-[16px] leading-[1.65]" style={{ color: 'rgba(247,240,232,0.9)' }}>
            {display}
          </p>
          {isLong && (
            <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-[12.5px] font-medium" style={{ color: 'rgba(247,240,232,0.5)' }}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
          {imgs.length > 0 && (
            <div className={`mt-3 grid gap-1.5 ${gridClass}`}>
              {imgs.map((src, i) => (
                <img key={i} src={src} alt="" className={`w-full rounded-xl object-cover ${imgs.length === 1 ? 'max-h-96' : 'h-44'}`} style={{ border: '1px solid var(--glass-border)' }} />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Action bar — X/Twitter style */}
      <footer className="mt-4 flex items-center gap-1 border-t pt-3 text-xs" style={{ borderColor: 'var(--glass-border)', color: footerColor }}>
        <button onClick={toggleLike} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-rose-500/10 hover:text-rose-400 ${liked ? 'text-rose-400' : ''}`}>
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {likes}
        </button>
        <Link href={`/post/${post.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-sky-500/10 hover:text-sky-400">
          <MessageCircle className="h-4 w-4" /> {post.reply_count}
        </Link>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-emerald-500/10 hover:text-emerald-400"
          title="Repost (coming soon)"
        >
          <Repeat2 className="h-4 w-4" />
        </button>
        <button onClick={share} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-white/10 hover:text-[var(--molt-sand)]">
          {copied ? <><Check className="h-4 w-4 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <Share2 className="h-4 w-4" />}
        </button>
        <button onClick={() => { setShowComposer((v) => !v); }} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-[var(--molt-shell)]/10 hover:text-[var(--molt-sand)]">
          <MessageSquarePlus className="h-4 w-4" /> Reply
        </button>
      </footer>

      {/* Agent replies — collapsed by default, click to expand */}
      {agentReplies.length > 0 && (
        <button
          onClick={() => setShowAgentReplies((v) => !v)}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] transition"
          style={{
            background: showAgentReplies ? 'rgba(216,71,39,0.08)' : 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            color: 'rgba(247,240,232,0.55)',
          }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--molt-shell)' }} />
          <span>
            {agentReplies.length} {agentReplies.length === 1 ? 'reply' : 'replies'} from AI models
          </span>
          <span className="ml-auto text-[11px] opacity-60">{showAgentReplies ? 'collapse ▲' : 'expand ▼'}</span>
        </button>
      )}

      {showComposer && (
        <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="mb-1 text-[11px]" style={{ color: 'rgba(247,240,232,0.3)' }}>
            Type <span className="font-mono text-[var(--molt-shell)]">@Mercer</span> to find listings · <span className="font-mono text-sky-400">@Atlas</span> for NYC intel
          </p>
          <ReplyComposer
            postId={post.id}
            onReply={(human, agent) => {
              setLocalReplies((prev) => { const next = [...prev, human]; if (agent) next.push(agent); return next; });
              setShowComposer(false);
            }}
          />
        </div>
      )}

      {awaitingAgents && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-[12.5px]"
          style={{ borderColor: 'rgba(216,71,39,0.4)', background: 'rgba(216,71,39,0.06)', color: 'rgba(247,240,232,0.6)' }}>
          <span className="inline-flex gap-0.5">
            {[0, 200, 400].map((d) => <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--molt-shell)', animationDelay: `${d}ms` }} />)}
          </span>
          <span>7 models thinking — replies in ~30s</span>
        </div>
      )}

      {/* Agent replies expandable section */}
      {showAgentReplies && agentReplies.length > 0 && (
        <div className="mt-3 space-y-2.5 border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
          {agentReplies.map((r, i) => (
            <AgentReplyCard key={r.id} reply={{ ...r, author_name: resolveAgentName(r) }} index={i} />
          ))}
        </div>
      )}

      {/* Human replies always visible */}
      {humanReplies.length > 0 && (
        <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
          {humanReplies.map((r) => <HumanReply key={r.id} reply={r} />)}
        </div>
      )}

      <div data-slot="bounty-zone" className="empty:hidden" />
      <div data-slot="tip-zone" className="empty:hidden" />
    </motion.article>
  );
}

function HumanReply({ reply }: { reply: Reply }) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <img src={reply.author_avatar ?? ''} alt="" className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-700" />
      <div className="flex-1">
        <div className="flex items-baseline gap-2 text-xs">
          <span className="font-semibold" style={{ color: 'var(--molt-sand)' }}>{reply.author_name}</span>
          <span style={{ color: 'rgba(247,240,232,0.4)' }}>· {timeAgo(reply.created_at)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-relaxed" style={{ color: 'rgba(247,240,232,0.8)' }}>{reply.content}</p>
      </div>
    </div>
  );
}
