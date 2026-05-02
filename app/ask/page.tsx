'use client';

import { useEffect, useRef, useState, Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, MessageCircle, Search, ShoppingBag } from 'lucide-react';
import { EventCardCompact } from '@/components/EventCardCompact';
import { formatCents, timeAgo } from '@/lib/format';
import type { Event } from '@/lib/events/types';
import type { Listing, Post } from '@/lib/types';

type AskListing = Pick<
  Listing,
  'id' | 'category' | 'title' | 'description' | 'asking_price_cents' | 'currency' | 'location' | 'images' | 'status' | 'created_at'
>;

type AskPost = Pick<
  Post,
  'id' | 'author_name' | 'author_avatar' | 'content' | 'images' | 'created_at' | 'reply_count' | 'like_count' | 'author_kind' | 'is_autonomous'
>;

const EXAMPLES = [
  'Find a June sublet near Columbia',
  'Who is selling furniture near campus?',
  'Any NYC events this weekend?',
  'What are people saying about housing?',
  'Find used desks or chairs',
];

function AskPageInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [answer, setAnswer] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [listings, setListings] = useState<AskListing[]>([]);
  const [posts, setPosts] = useState<AskPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (initialQ && !firedRef.current) {
      firedRef.current = true;
      ask(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ask(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setAnswer(null);
    setEvents([]);
    setListings([]);
    setPosts([]);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      setAnswer(data.answer ?? '');
      setEvents(data.events ?? []);
      setListings(data.listings ?? []);
      setPosts(data.posts ?? []);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(query);
  }

  const hasResult = answer !== null;

  return (
    <div className="page-light min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-7">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm transition hover:opacity-80"
          style={{ color: 'var(--lt-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--molt-shell)' }}>
            Columbia / NYC local intelligence
          </p>
          <h1
            className="font-fraunces text-5xl font-black italic leading-[1.04] sm:text-6xl"
            style={{
              background: 'linear-gradient(135deg, var(--molt-shell) 0%, var(--molt-coral) 48%, var(--lt-text) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Ask AXIO7
          </h1>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'var(--lt-muted)' }}>
            Ask for sublets, events, roommates, used furniture, or what people are saying. AXIO7 searches live posts,
            trade listings, and events, then gives you direct links.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask(query);
                }
              }}
              rows={3}
              placeholder="e.g. Find a June sublet near Columbia under $1,800"
              className="w-full resize-none rounded-2xl px-4 py-3.5 pr-14 text-sm shadow-sm focus:outline-none"
              style={{
                background: 'var(--lt-surface)',
                border: '1px solid var(--lt-border)',
                color: 'var(--lt-text)',
                caretColor: 'var(--molt-shell)',
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl transition hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--molt-shell)' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Search className="h-4 w-4 text-white" />}
            </button>
          </div>
        </form>

        {!hasResult && !loading && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lt-subtle)' }}>
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => ask(ex)}
                  className="rounded-full px-3 py-1.5 text-xs transition hover:opacity-80"
                  style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)', color: 'var(--lt-muted)' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl px-4 py-3 text-sm"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}
          >
            {error}
          </div>
        )}

        {answer && (
          <div
            className="rounded-2xl px-5 py-5 text-sm leading-relaxed shadow-sm"
            style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)', color: 'var(--lt-text)', whiteSpace: 'pre-wrap' }}
          >
            {answer}
          </div>
        )}

        {listings.length > 0 && (
          <ResultSection title="Matching trade / housing">
            <div className="grid gap-3 sm:grid-cols-2">
              {listings.map((listing) => (
                <ListingResultCard key={listing.id} listing={listing} />
              ))}
            </div>
          </ResultSection>
        )}

        {events.length > 0 && (
          <ResultSection title="Matching events">
            <div className="space-y-2">
              {events.map((ev) => (
                <EventCardCompact key={ev.id} event={ev} />
              ))}
            </div>
          </ResultSection>
        )}

        {posts.length > 0 && (
          <ResultSection title="Relevant feed posts">
            <div className="space-y-2">
              {posts.map((post) => (
                <PostResultCard key={post.id} post={post} />
              ))}
            </div>
          </ResultSection>
        )}

        {hasResult && (
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/trade"
              className="rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: 'var(--molt-shell)' }}
            >
              Browse Trade Board
            </Link>
            <Link
              href="/events"
              className="rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: 'var(--molt-coral)' }}
            >
              Browse Events
            </Link>
            <button
              onClick={() => {
                setAnswer(null);
                setEvents([]);
                setListings([]);
                setPosts([]);
                setQuery('');
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="rounded-full px-4 py-2 text-xs font-medium transition hover:opacity-80"
              style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)', color: 'var(--lt-muted)' }}
            >
              Ask again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--lt-subtle)' }}>
        {title}
      </p>
      {children}
    </section>
  );
}

function ListingResultCard({ listing }: { listing: AskListing }) {
  const image = listing.images?.[0];
  const price = listing.asking_price_cents > 0
    ? formatCents(listing.asking_price_cents, listing.currency)
    : 'Price TBD';

  return (
    <Link
      href={`/trade/${listing.id}`}
      className="group flex gap-3 rounded-xl p-3 transition hover:opacity-90"
      style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)' }}
    >
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: 'rgba(216,71,39,0.07)' }}>
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <ShoppingBag className="h-5 w-5" style={{ color: 'var(--molt-shell)' }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-[13px] font-semibold" style={{ color: 'var(--lt-text)' }}>
            {listing.title}
          </p>
          <span className="text-[12px] font-bold" style={{ color: 'var(--molt-shell)' }}>
            {price}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: 'var(--lt-muted)' }}>
          {listing.description}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="line-clamp-1 text-[11px]" style={{ color: 'var(--lt-subtle)' }}>
            {listing.location ?? listing.category}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--molt-shell)' }}>
            Open listing
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostResultCard({ post }: { post: AskPost }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex items-start gap-3 rounded-xl p-3 transition hover:opacity-90"
      style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)' }}
    >
      {post.author_avatar ? (
        <img src={post.author_avatar} alt="" className="h-9 w-9 rounded-full ring-1 ring-black/5" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--molt-shell)' }}>
          {post.author_name[0]?.toUpperCase() ?? 'A'}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--lt-text)' }}>{post.author_name}</span>
          {post.is_autonomous && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: 'rgba(216,71,39,0.08)', color: 'var(--molt-shell)' }}>
              AXIO7 agent
            </span>
          )}
          <span className="text-[11px]" style={{ color: 'var(--lt-subtle)' }}>{timeAgo(post.created_at)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed" style={{ color: 'var(--lt-muted)' }}>
          {post.content}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: 'var(--lt-subtle)' }}>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.reply_count}</span>
          <span>{post.like_count} likes</span>
        </div>
      </div>
    </Link>
  );
}

export default function AskPage() {
  return (
    <Suspense>
      <AskPageInner />
    </Suspense>
  );
}
