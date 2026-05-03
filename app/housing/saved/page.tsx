import Link from 'next/link';
import { Bell, Bookmark, Radar } from 'lucide-react';
import { LightPage } from '@/components/LightPage';
import { HousingListingCard } from '@/components/housing/HousingListingCard';
import { HousingPreferenceSchema } from '@/lib/housing';
import { runMonitoringAgent } from '@/lib/housing/agents';
import { getCurrentUser } from '@/lib/auth';
import { listSavedHousingListings, listSavedSearches } from '@/lib/housing/store';

export const dynamic = 'force-dynamic';

export default async function SavedSearchesPage() {
  const user = await getCurrentUser();
  const preference = HousingPreferenceSchema.parse({});
  const monitor = runMonitoringAgent(preference, 80);
  const [savedSearches, savedListings] = user.authenticated
    ? await Promise.all([listSavedSearches(user.id), listSavedHousingListings(user.id)])
    : [[], []];

  return (
    <LightPage>
      <div className="space-y-6">
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Monitoring Agent</div>
          <h1 className="font-fraunces text-5xl font-black italic leading-none text-white sm:text-7xl">Saved housing.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>Saved listings, saved searches, and fresh agent matches in one place.</p>
        </div>

        {!user.authenticated && (
          <section className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <h2 className="font-black text-white">Sign in to save searches</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--r-text2)' }}>AXIO7 stores saved listings and filters per account.</p>
            <Link href="/auth/signin?next=/housing/saved" className="r-btn-pink mt-4">Sign in</Link>
          </section>
        )}

        <section className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}><Radar className="h-6 w-6" /></span>
            <div>
              <h2 className="font-black text-white">Saved searches</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--r-text2)' }}>{savedSearches.length || 1} search profile · {monitor.alerts.length} current seed alerts</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {savedSearches.length > 0 ? savedSearches.map((search: any) => (
              <div key={search.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white">
                {search.name ?? 'AXIO7 housing search'} · min {search.min_match_score ?? 80}% · {search.enabled !== false ? 'active' : 'paused'}
              </div>
            )) : monitor.alerts.map((alert) => (
              <Link key={alert.listingId} href={`/housing/listings/${alert.listingId}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2 text-white"><Bell className="h-4 w-4 text-pink-300" />{alert.title}</span>
                <span className="font-mono text-pink-200">{alert.score}%</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>
            <Bookmark className="h-4 w-4" /> Saved listings
          </div>
          {savedListings.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {savedListings.map((listing) => <HousingListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
              <p className="text-sm" style={{ color: 'var(--r-text2)' }}>No saved listings yet. Open a listing and click Save listing.</p>
              <Link href="/housing/listings" className="r-btn-pink mt-4">Browse listings →</Link>
            </div>
          )}
        </section>
      </div>
    </LightPage>
  );
}
