import Link from 'next/link';
import { Plus, Home, Sofa, Smartphone, BookOpen, Hammer, Package, Ticket, GraduationCap, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { listListings } from '@/lib/store';
import { ListingCard } from '@/components/ListingCard';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { id: 'sublet',      label: 'Sublets',     icon: Home,          color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'furniture',   label: 'Furniture',   icon: Sofa,          color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'electronics', label: 'Electronics', icon: Smartphone,    color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'books',       label: 'Books',       icon: BookOpen,      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'tickets',     label: 'Tickets',     icon: Ticket,        color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'tutoring',    label: 'Tutoring',    icon: GraduationCap, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'services',    label: 'Services',    icon: Hammer,        color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'other',       label: 'Other',       icon: Package,       color: 'bg-slate-100 text-slate-700 border-slate-200' },
] as const;

export default async function TradePage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const category = searchParams?.category;
  let listings: Awaited<ReturnType<typeof listListings>> = [];
  try {
    listings = await listListings({ category });
  } catch (err) {
    console.error('[TradePage] DB query failed:', err);
  }

  const activeCat = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-fraunces text-4xl font-black italic tracking-tight text-[var(--molt-ocean)]">
            trade.
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            NYC sublets, furniture, electronics, tickets — post, bid, deal.
          </p>
        </div>
        <Link
          href="/trade/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--molt-shell)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Post listing
        </Link>
      </div>

      {/* Rentals-with-AI hero banner */}
      <Link
        href="/trade/rentals"
        className="group relative block overflow-hidden rounded-[24px] border border-[rgba(11,79,108,0.12)] bg-[var(--molt-ocean)] p-6 text-[var(--molt-sand)] shadow-[0_4px_20px_rgba(11,79,108,0.12)] transition hover:shadow-[0_8px_28px_rgba(11,79,108,0.18)] sm:p-8"
      >
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--molt-coral)]/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--molt-coral)]">
              <Sparkles className="h-3 w-3" />
              new · ai-powered
            </div>
            <h2 className="mt-3 font-fraunces text-3xl font-black italic leading-tight sm:text-4xl">
              Find your sublet<br />with a map + AI agent.
            </h2>
            <p className="mt-3 text-sm text-[var(--molt-coral)]/90 sm:text-[15px]">
              Live NYC rental map · multi-source search · AI outreach drafts · 1 click to shortlist.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--molt-shell)] px-5 py-3 text-sm font-semibold text-white shadow-lg transition group-hover:translate-x-1">
            Open rental map
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* decorative map grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F7F0E8" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mapgrid)" />
          </svg>
        </div>
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[var(--molt-shell)]/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[var(--molt-coral)]/15 blur-3xl" aria-hidden />
      </Link>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/trade"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            !category
              ? 'border-ink bg-ink text-white'
              : 'border-slate-200 bg-white text-ink-muted hover:border-ink/30 hover:text-ink'
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/trade?category=${c.id}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              category === c.id
                ? `border-transparent ${c.color}`
                : 'border-slate-200 bg-white text-ink-muted hover:border-ink/30 hover:text-ink'
            }`}
          >
            <c.icon className="h-3.5 w-3.5" />
            {c.label}
          </Link>
        ))}
      </div>

      {/* Active filter breadcrumb */}
      {activeCat && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{activeCat.label}</span>
          <span className="text-ink-muted">·</span>
          <Link href="/trade" className="text-ink-muted hover:text-ink underline text-xs">clear filter</Link>
        </div>
      )}

      {/* Listings grid */}
      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <div className="text-4xl">📭</div>
          <p className="mt-3 text-sm font-medium text-ink">No listings yet{category ? ` in ${category}` : ''}</p>
          <p className="mt-1 text-xs text-ink-muted">Be the first to post something.</p>
          <Link
            href="/trade/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
          >
            <Plus className="h-4 w-4" /> Post a listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
