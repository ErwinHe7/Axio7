'use client';

import { Heart, MessageCircle, Share2, Check } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import type { Post, Reply } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { AgentReplyCard } from './AgentReplyCard';

export function PostCard({ post, replies }: { post: Post; replies: Reply[] }) {
  const [likes, setLikes] = useState(post.like_count);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const imgs = post.images ?? [];
  const gridClass =
    imgs.length === 1
      ? 'grid-cols-1'
      : imgs.length === 2
      ? 'grid-cols-2'
      : imgs.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-2';

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-start gap-3">
        <img src={post.author_avatar ?? ''} alt="" className="h-9 w-9 rounded-full bg-slate-100" />
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{post.author_name}</span>
            <span className="text-xs text-ink-muted">· {timeAgo(post.created_at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {post.content}
          </p>
          {imgs.length > 0 && (
            <div className={`mt-2 grid gap-1 ${gridClass}`}>
              {imgs.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className={`w-full rounded-lg border border-slate-100 object-cover ${imgs.length === 1 ? 'max-h-80' : 'h-40'}`}
                />
              ))}
            </div>
          )}
        </div>
      </header>
      <footer className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-1 transition hover:text-rose-600 ${liked ? 'text-rose-600' : ''}`}
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} /> {likes}
        </button>
        <Link href={`/post/${post.id}`} className="inline-flex items-center gap-1 hover:text-ink">
          <MessageCircle className="h-3.5 w-3.5" /> {post.reply_count}
        </Link>
        <button onClick={share} className="ml-auto inline-flex items-center gap-1 transition hover:text-ink">
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-600">Copied!</span></>
          ) : (
            <><Share2 className="h-3.5 w-3.5" />Share</>
          )}
        </button>
      </footer>

      {replies.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {replies.map((r) =>
            r.author_kind === 'agent' ? (
              <AgentReplyCard key={r.id} reply={r} />
            ) : (
              <HumanReply key={r.id} reply={r} />
            )
          )}
        </div>
      )}
    </article>
  );
}

function HumanReply({ reply }: { reply: Reply }) {
  return (
    <div className="flex items-start gap-3">
      <img src={reply.author_avatar ?? ''} alt="" className="h-7 w-7 rounded-full bg-slate-100" />
      <div className="flex-1">
        <div className="flex items-baseline gap-2 text-xs">
          <span className="font-semibold text-ink">{reply.author_name}</span>
          <span className="text-ink-muted">· {timeAgo(reply.created_at)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{reply.content}</p>
      </div>
    </div>
  );
}
