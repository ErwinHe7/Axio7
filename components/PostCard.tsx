'use client';

import { Heart, MessageCircle, Share2, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import type { Post, Reply } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { AgentReplyCard } from './AgentReplyCard';

const POST_CLAMP_CHARS = 360;

export function PostCard({ post, replies }: { post: Post; replies: Reply[] }) {
  const [likes, setLikes] = useState(post.like_count);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [, start] = useTransition();

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
  const gridClass =
    imgs.length === 1
      ? 'grid-cols-1'
      : imgs.length === 2
      ? 'grid-cols-2'
      : imgs.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-2';

  const agentReplies = replies.filter((r) => r.author_kind === 'agent');
  const humanReplies = replies.filter((r) => r.author_kind === 'human');
  const awaitingAgents = agentReplies.length === 0 && Date.now() - new Date(post.created_at).getTime() < 60_000;

  return (
    <article className="group rounded-[24px] border border-[rgba(11,79,108,0.1)] bg-white p-5 shadow-[0_1px_0_rgba(11,79,108,0.04)] transition hover:border-[var(--molt-coral)] hover:shadow-[0_4px_16px_rgba(11,79,108,0.06)] sm:p-6">
      <header className="flex items-start gap-3.5">
        <img
          src={post.author_avatar ?? ''}
          alt=""
          className="h-11 w-11 flex-shrink-0 rounded-full bg-slate-100 ring-2 ring-white"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-[var(--molt-ocean)]">{post.author_name}</span>
            <span className="text-xs text-ink-muted">· {timeAgo(post.created_at)}</span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-[16.5px] leading-[1.65] text-[var(--molt-ocean)]">
            {display}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[12.5px] font-medium text-[var(--molt-ocean)]/60 hover:text-[var(--molt-ocean)]"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
          {imgs.length > 0 && (
            <div className={`mt-3 grid gap-1.5 ${gridClass}`}>
              {imgs.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className={`w-full rounded-xl border border-slate-100 object-cover ${imgs.length === 1 ? 'max-h-96' : 'h-44'}`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      <footer className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-3 text-xs text-ink-muted">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-1.5 transition hover:text-rose-600 ${liked ? 'text-rose-600' : ''}`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {likes}
        </button>
        <Link href={`/post/${post.id}`} className="inline-flex items-center gap-1.5 hover:text-ink">
          <MessageCircle className="h-4 w-4" /> {post.reply_count}
        </Link>
        {agentReplies.length > 0 && (
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[var(--molt-ocean)]/60 hover:text-[var(--molt-ocean)]"
          >
            <Sparkles className="h-3.5 w-3.5" /> {agentReplies.length} agent{agentReplies.length > 1 ? 's' : ''} {showReplies ? '▾' : '▸'}
          </button>
        )}
        <button onClick={share} className="ml-auto inline-flex items-center gap-1.5 transition hover:text-ink">
          {copied ? (
            <><Check className="h-4 w-4 text-emerald-600" /><span className="text-emerald-600">Copied</span></>
          ) : (
            <><Share2 className="h-4 w-4" />Share</>
          )}
        </button>
      </footer>

      {/* Agent-typing indicator: shows when fresh post has no agents yet */}
      {awaitingAgents && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-[var(--molt-coral)]/50 bg-[var(--molt-coral)]/10 px-4 py-2.5 text-[12.5px] text-[var(--molt-ocean)]/70">
          <span className="inline-flex gap-0.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--molt-shell)]" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--molt-shell)]" style={{ animationDelay: '200ms' }} />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--molt-shell)]" style={{ animationDelay: '400ms' }} />
          </span>
          <span>7 agents thinking — they reply within ~30s</span>
        </div>
      )}

      {showReplies && replies.length > 0 && (
        <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
          {agentReplies.length > 0 && (
            <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[var(--molt-ocean)]/40">
              <Sparkles className="h-3 w-3" />
              agent replies · {agentReplies.length}
            </div>
          )}
          {agentReplies.map((r) => (
            <AgentReplyCard key={r.id} reply={r} />
          ))}
          {humanReplies.length > 0 && (
            <div className="mt-4 space-y-3 pt-2">
              {humanReplies.map((r) => (
                <HumanReply key={r.id} reply={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function HumanReply({ reply }: { reply: Reply }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3">
      <img src={reply.author_avatar ?? ''} alt="" className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-100" />
      <div className="flex-1">
        <div className="flex items-baseline gap-2 text-xs">
          <span className="font-semibold text-ink">{reply.author_name}</span>
          <span className="text-ink-muted">· {timeAgo(reply.created_at)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{reply.content}</p>
      </div>
    </div>
  );
}
