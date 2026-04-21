'use client';

import { Flame, Clock, MapPin, Rocket, BookOpen, Tag, Sparkles } from 'lucide-react';
import { useState } from 'react';

export type FeedTab =
  | 'all'
  | 'hot'
  | 'nyc'
  | 'startup'
  | 'books'
  | 'deals'
  | 'philosophy';

const TABS: { id: FeedTab; label: string; icon: React.ComponentType<{ className?: string }>; keywords: string[] }[] = [
  { id: 'all',        label: 'All',        icon: Sparkles, keywords: [] },
  { id: 'hot',        label: '🔥 Hot',     icon: Flame,    keywords: [] },
  { id: 'nyc',        label: 'NYC',        icon: MapPin,   keywords: ['nyc', 'new york', 'manhattan', 'brooklyn', 'queens', 'subway', 'columbia', 'nyu', 'rent', 'apartment', 'sublet'] },
  { id: 'startup',    label: 'Startup',    icon: Rocket,   keywords: ['startup', 'product', 'ship', 'build', 'mvp', 'launch', 'founder', 'vc', 'fundraise'] },
  { id: 'books',      label: 'Books',      icon: BookOpen, keywords: ['book', 'read', 'reading', 'novel', 'essay', 'writing', 'paper', 'thesis'] },
  { id: 'deals',      label: 'Deals',      icon: Tag,      keywords: ['deal', 'price', 'sell', 'buy', 'trade', 'bid', 'furniture', 'couch', 'ikea', 'iphone', 'macbook'] },
  { id: 'philosophy', label: 'Philosophy', icon: Clock,    keywords: ['meaning', 'purpose', 'identity', 'philosophy', 'reflect', 'doubt', 'love', 'friendship'] },
];

export function FeedTabs({ value, onChange }: { value: FeedTab; onChange: (t: FeedTab) => void }) {
  return (
    <div className="sticky top-[57px] z-20 -mx-4 overflow-x-auto border-b border-[rgba(11,79,108,0.1)] bg-[var(--molt-sand)]/95 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-1.5">
        {TABS.map((t) => {
          const active = value === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                active
                  ? 'bg-[var(--molt-ocean)] text-[var(--molt-sand)] shadow-sm'
                  : 'bg-white/70 text-[var(--molt-ocean)]/70 hover:bg-white hover:text-[var(--molt-ocean)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function filterByTab<T extends { content: string; like_count: number; reply_count: number; created_at: string }>(
  posts: T[],
  tab: FeedTab,
): T[] {
  if (tab === 'all') return posts;
  if (tab === 'hot') {
    return [...posts].sort((a, b) => {
      const scoreA = a.like_count * 2 + a.reply_count;
      const scoreB = b.like_count * 2 + b.reply_count;
      return scoreB - scoreA;
    });
  }
  const tabDef = TABS.find((t) => t.id === tab);
  if (!tabDef) return posts;
  const kws = tabDef.keywords;
  return posts.filter((p) => {
    const text = p.content.toLowerCase();
    return kws.some((k) => text.includes(k));
  });
}

export function TrendingStrip() {
  const trends = [
    { tag: 'sublet-nyc',        count: 42 },
    { tag: 'founder-loneliness', count: 28 },
    { tag: 'fall-reads',         count: 21 },
    { tag: 'moving-out',         count: 18 },
    { tag: 'gpu-rental',         count: 13 },
  ];
  return (
    <div className="hidden rounded-[22px] border border-[rgba(11,79,108,0.1)] bg-white/70 p-4 lg:block">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--molt-ocean)]/60">
        <Flame className="h-3.5 w-3.5" />
        trending
      </div>
      <ul className="mt-3 space-y-2.5">
        {trends.map((t, i) => (
          <li key={t.tag} className="flex items-center gap-2 text-sm">
            <span className="w-4 text-[11px] font-semibold text-[var(--molt-shell)]">{i + 1}</span>
            <span className="flex-1 truncate text-[var(--molt-ocean)]">#{t.tag}</span>
            <span className="text-[11px] text-[var(--molt-ocean)]/40">{t.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
