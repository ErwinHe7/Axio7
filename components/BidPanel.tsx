'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import type { Bid, Listing } from '@/lib/types';
import { formatCents, timeAgo } from '@/lib/format';

export function BidPanel({ listing, bids }: { listing: Listing; bids: Bid[] }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellerMode, setSellerMode] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dollars = parseFloat(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError('Enter a positive bid amount.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          bidder_name: name.trim() || 'Anonymous',
          amount_cents: Math.round(dollars * 100),
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'failed' }));
        setError(error);
        return;
      }
      setAmount('');
      setMessage('');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {listing.status === 'open' ? (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Place a bid</h3>
            <label className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <input type="checkbox" checked={sellerMode} onChange={(e) => setSellerMode(e.target.checked)} />
              I&apos;m the seller
            </label>
          </div>
          {!sellerMode && (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-ink focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount (USD)"
                  required
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-ink focus:outline-none"
                />
              </div>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message to the seller (optional)"
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-ink focus:outline-none"
              />
              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
              <button
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit bid
              </button>
            </>
          )}
        </form>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-ink-muted">
          This listing is {listing.status}. No new bids accepted.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">
          Bids{bids.length > 0 ? ` (${bids.length})` : ''}
        </h3>
        {bids.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No bids yet. Be the first.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {bids.map((b, i) => (
              <BidRow key={b.id} bid={b} listing={listing} isTop={i === 0} sellerMode={sellerMode} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BidRow({
  bid,
  listing,
  isTop,
  sellerMode,
}: {
  bid: Bid;
  listing: Listing;
  isTop: boolean;
  sellerMode: boolean;
}) {
  const [, start] = useTransition();
  const [accepting, setAccepting] = useState(false);
  const router = useRouter();

  function accept() {
    setAccepting(true);
    start(async () => {
      const res = await fetch(`/api/bids/${bid.id}/accept`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        setAccepting(false);
      }
    });
  }

  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="flex-1">
        <div className="text-sm">
          <span className="font-semibold">{bid.bidder_name}</span>{' '}
          {isTop && (
            <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-emerald-700">
              Top
            </span>
          )}
          {bid.status !== 'active' && (
            <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
              {bid.status}
            </span>
          )}
        </div>
        {bid.message && <p className="text-xs text-ink-muted">{bid.message}</p>}
        <div className="text-[10px] text-ink-muted">{timeAgo(bid.created_at)}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="text-sm font-semibold">
          {formatCents(bid.amount_cents, listing.currency)}
        </div>
        {sellerMode && listing.status === 'open' && bid.status === 'active' && (
          <button
            onClick={accept}
            disabled={accepting}
            className="inline-flex items-center gap-1 rounded-md bg-ink px-2 py-0.5 text-[11px] font-medium text-white hover:bg-ink/90 disabled:opacity-50"
          >
            {accepting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Accept
          </button>
        )}
      </div>
    </li>
  );
}
