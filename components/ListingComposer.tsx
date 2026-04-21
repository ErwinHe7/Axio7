'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, X } from 'lucide-react';

const CATEGORIES = ['sublet', 'furniture', 'electronics', 'books', 'services', 'tickets', 'tutoring', 'other'] as const;

export function ListingComposer() {
  const [form, setForm] = useState({
    seller_name: '',
    category: 'furniture' as (typeof CATEGORIES)[number],
    title: '',
    description: '',
    asking_price: '',
    location: '',
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const router = useRouter();

  async function aiDraft() {
    if (!hint.trim()) {
      setError('Type a short hint first (e.g. "Sony WH-1000XM5, like new")');
      return;
    }
    setError(null);
    setDrafting(true);
    try {
      const res = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hint: hint.trim(), category: form.category }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'failed' }));
        setError(error);
        return;
      }
      const { title, description, suggested_price_cents } = await res.json();
      setForm((f) => ({
        ...f,
        title: title || f.title,
        description: description || f.description,
        asking_price: suggested_price_cents ? (suggested_price_cents / 100).toFixed(0) : f.asking_price,
      }));
    } finally {
      setDrafting(false);
    }
  }

  function addImage() {
    const u = newImageUrl.trim();
    if (!u) return;
    try {
      new URL(u);
    } catch {
      setError('Image must be a full URL (https://…)');
      return;
    }
    if (imageUrls.length >= 6) {
      setError('Max 6 images');
      return;
    }
    setError(null);
    setImageUrls([...imageUrls, u]);
    setNewImageUrl('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const dollars = parseFloat(form.asking_price);
      if (!Number.isFinite(dollars) || dollars < 0) {
        setError('Price must be a non-negative number.');
        return;
      }
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_name: form.seller_name.trim() || 'Anonymous',
          category: form.category,
          title: form.title.trim(),
          description: form.description.trim(),
          asking_price_cents: Math.round(dollars * 100),
          location: form.location.trim() || undefined,
          images: imageUrls,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'failed' }));
        setError(error);
        return;
      }
      const { listing } = await res.json();
      router.push(`/trade/${listing.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="rounded-lg border border-accent/30 bg-accent-soft/40 p-3">
        <label className="block text-xs font-medium text-accent">
          <Sparkles className="mr-1 inline-block h-3.5 w-3.5" /> AI Draft (describe your item in a sentence)
        </label>
        <div className="mt-1 flex gap-2">
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Sony WH-1000XM5, used 6 months, great condition"
            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={aiDraft}
            disabled={drafting}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Draft
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your name">
          <input
            value={form.seller_name}
            onChange={(e) => setForm({ ...form, seller_name: e.target.value })}
            placeholder="How buyers see you"
            className="input"
          />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Title">
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="IKEA Malm desk + chair"
          className="input"
        />
      </Field>
      <Field label="Description">
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Condition, pickup details, anything a buyer should know."
          className="input"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Asking price (USD)">
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.asking_price}
            onChange={(e) => setForm({ ...form, asking_price: e.target.value })}
            placeholder="120"
            className="input"
          />
        </Field>
        <Field label="Location (optional)">
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Morningside Heights, NYC"
            className="input"
          />
        </Field>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Images (URLs)</label>
        <div className="mt-1 flex gap-2">
          <input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://i.imgur.com/example.jpg"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={addImage}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:border-ink"
          >
            Add
          </button>
        </div>
        {imageUrls.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {imageUrls.map((u, i) => (
              <div key={u} className="relative">
                <img src={u} alt="" className="aspect-square w-full rounded-md border border-slate-200 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                  className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-600 shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1 text-[11px] text-ink-muted">
          Paste direct image URLs (from Imgur, GitHub, etc). File upload needs Supabase Storage — see README.
        </p>
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-end">
        <button
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Publish listing
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #0f172a;
        }
        .input:focus {
          outline: none;
          border-color: #0f172a;
          box-shadow: 0 0 0 1px #0f172a;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
