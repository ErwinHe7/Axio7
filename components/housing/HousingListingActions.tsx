'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Check, Copy, Loader2, MessageSquare } from 'lucide-react';
import type { HousingListing } from '@/lib/housing';

export function HousingListingActions({ listing }: { listing: HousingListing }) {
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function saveListing() {
    setSaveError(null);
    const res = await fetch(`/api/housing/listings/${listing.id}/save`, { method: 'POST' });
    if (res.status === 401) {
      window.location.href = `/auth/signin?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!res.ok) {
      setSaveError('Could not save this listing yet.');
      return;
    }
    setSaved(true);
  }

  async function generateDraft(language: 'en' | 'zh' = 'en') {
    setBusy(true);
    setDraft(null);
    try {
      const res = await fetch('/api/housing/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, language }),
      });
      const data = await res.json();
      setDraft(data?.draft?.body ?? 'Could not generate a draft right now.');
    } finally {
      setBusy(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
      <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-white"><MessageSquare className="h-5 w-5 text-pink-300" /> Take action</h2>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={saveListing} className="r-btn-ghost">
          {saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {saved ? 'Saved locally' : 'Save listing'}
        </button>
        <button type="button" onClick={() => generateDraft('en')} disabled={busy} className="r-btn-pink">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          Draft outreach
        </button>
        <button type="button" onClick={() => generateDraft('zh')} disabled={busy} className="r-btn-ghost">中文联系模板</button>
        <Link href="/inbox" className="r-btn-ghost">Open Message</Link>
      </div>
      {saveError && <div className="mt-3 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">{saveError}</div>}
      {draft && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--r-pink2)' }}>Communication Agent draft</div>
            <button type="button" onClick={copyDraft} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>{draft}</p>
        </div>
      )}
    </div>
  );
}
