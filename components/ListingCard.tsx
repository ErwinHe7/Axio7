import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Listing } from '@/lib/types';
import { formatCents, timeAgo } from '@/lib/format';

const CATEGORY_STYLE: Record<Listing['category'], { bg: string; text: string; emoji: string }> = {
  sublet:      { bg: 'bg-blue-50',    text: 'text-blue-700',    emoji: '🏠' },
  furniture:   { bg: 'bg-amber-50',   text: 'text-amber-700',   emoji: '🛋️' },
  electronics: { bg: 'bg-violet-50',  text: 'text-violet-700',  emoji: '📱' },
  books:       { bg: 'bg-emerald-50', text: 'text-emerald-700', emoji: '📚' },
  services:    { bg: 'bg-pink-50',    text: 'text-pink-700',    emoji: '🛠️' },
  tickets:     { bg: 'bg-rose-50',    text: 'text-rose-700',    emoji: '🎟️' },
  tutoring:    { bg: 'bg-teal-50',    text: 'text-teal-700',    emoji: '🎓' },
  other:       { bg: 'bg-slate-100',  text: 'text-slate-700',   emoji: '📦' },
};

const STATUS_STYLE: Record<Listing['status'], string> = {
  open:      'bg-emerald-50 text-emerald-700',
  pending:   'bg-amber-50 text-amber-700',
  sold:      'bg-slate-100 text-slate-500',
  withdrawn: 'bg-red-50 text-red-600',
};

export function ListingCard({ listing }: { listing: Listing }) {
  const cat = CATEGORY_STYLE[listing.category];
  const hasImage = listing.images.length > 0;

  return (
    <Link
      href={`/trade/${listing.id}`}
      className="group block overflow-hidden rounded-[20px] border border-[rgba(11,79,108,0.1)] bg-white shadow-[0_1px_0_rgba(11,79,108,0.04)] transition hover:-translate-y-0.5 hover:border-[var(--molt-coral)] hover:shadow-[0_8px_24px_rgba(11,79,108,0.08)]"
    >
      {hasImage ? (
        <div className="relative h-48 overflow-hidden bg-slate-100">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {listing.images.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              +{listing.images.length - 1}
            </span>
          )}
          <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur ${cat.bg} ${cat.text}`}>
            {cat.emoji} {listing.category}
          </span>
        </div>
      ) : (
        <div className={`flex h-32 items-center justify-center text-5xl ${cat.bg}`}>
          {cat.emoji}
        </div>
      )}

      <div className="p-4">
        {!hasImage && (
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cat.bg} ${cat.text}`}>
              {cat.emoji} {listing.category}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {listing.status !== 'open' && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[listing.status]}`}>
              {listing.status}
            </span>
          )}
          <span className="ml-auto text-[11px] text-slate-400">{timeAgo(listing.created_at)}</span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-[16px] font-semibold leading-snug text-[var(--molt-ocean)]">{listing.title}</h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">{listing.description}</p>

        <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <div className="text-xl font-bold text-[var(--molt-ocean)]">{formatCents(listing.asking_price_cents, listing.currency)}</div>
            <div className="text-[11px] text-slate-400">
              {listing.bid_count > 0
                ? `${listing.bid_count} bid${listing.bid_count > 1 ? 's' : ''} · top ${formatCents(listing.top_bid_cents ?? 0, listing.currency)}`
                : 'No bids yet'}
            </div>
          </div>
          {listing.location && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3" />{listing.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
