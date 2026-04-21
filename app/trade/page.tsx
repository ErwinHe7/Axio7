import Link from 'next/link';
import { Plus, Home, Sofa, Smartphone, BookOpen, Hammer, Package, Ticket, GraduationCap, MapPin } from 'lucide-react';
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trade</h1>
          <p className="mt-1 text-sm text-ink-muted">
            NYC sublets, furniture, electronics, tickets — post, bid, deal.
          </p>
        </div>
        <Link
          href="/trade/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white transition hover:bg-ink/90"
        >
          <Plus className="h-4 w-4" /> Post listing
        </Link>
      </div>

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
