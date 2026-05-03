import Link from 'next/link';
import { ArrowRight, Bell, Home, MessageSquare, ShieldCheck } from 'lucide-react';
import { LightPage } from '@/components/LightPage';
import { HousingListingCard } from '@/components/housing/HousingListingCard';
import { HousingWorkflow } from '@/components/housing/HousingWorkflow';
import { HousingMap } from '@/components/housing/HousingMap';
import { HOUSING_LISTINGS, HousingPreferenceSchema } from '@/lib/housing';
import { runMatchingAgent } from '@/lib/housing/agents';

export const dynamic = 'force-dynamic';

export default function HousingPage({ searchParams }: { searchParams?: { q?: string } }) {
  const preference = HousingPreferenceSchema.parse({ rawText: searchParams?.q });
  const matches = runMatchingAgent(preference).listingMatches.slice(0, 3);

  return (
    <LightPage>
      <div className="space-y-8">
        <section className="rounded-[28px] border p-6 sm:p-8" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-pink-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Commercial housing agent workflow
            </div>
            <h1 className="font-fraunces text-5xl font-black italic leading-none text-white sm:text-7xl">Find housing in NYC with AI agents.</h1>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: 'var(--r-text2)' }}>
              Search verified sublets, building availability, neighborhoods, roommates, risk checks, and outreach in one agent workflow.
            </p>
            <form action="/housing/matches" className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:flex-row">
              <input
                name="q"
                className="min-h-12 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-pink-300/50"
                placeholder="I am a Columbia student, budget $1800, moving in August, quiet, 30 min commute..."
              />
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}>
                Run agents <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/housing/listings" className="r-btn-pink">Browse listings →</Link>
              <Link href="/housing/post-sublet" className="r-btn-ghost">Post verified sublet</Link>
              <Link href="/housing/neighborhoods" className="r-btn-ghost">Explore neighborhoods</Link>
            </div>
          </div>
        </section>

        <section id="map">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Map view</div>
              <h2 className="mt-1 text-2xl font-black text-white">Tap listings on the NYC map</h2>
            </div>
            <Link href="/housing/listings" className="hidden text-sm font-bold sm:inline" style={{ color: 'var(--r-pink2)' }}>View all</Link>
          </div>
          <HousingMap listings={HOUSING_LISTINGS} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Top matches</div>
              <h2 className="mt-1 text-2xl font-black text-white">Verified + risk-scored candidates</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {matches.map((match) => <HousingListingCard key={match.listing.id} listing={match.listing} />)}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>
            <Home className="h-4 w-4" /> Agent workflow, not a search bar
          </div>
          <HousingWorkflow />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/housing/saved" className="rounded-[22px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <Bell className="h-6 w-6 text-pink-300" />
            <h3 className="mt-3 font-black text-white">Monitoring Agent</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--r-text2)' }}>Save a profile and get alerted when high-match listings appear.</p>
          </Link>
          <Link href="/housing/roommates" className="rounded-[22px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <MessageSquare className="h-6 w-6 text-pink-300" />
            <h3 className="mt-3 font-black text-white">Roommate matching</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--r-text2)' }}>Match with students by school, move-in, budget, neighborhood, and lifestyle.</p>
          </Link>
          <Link href="/inbox" className="rounded-[22px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <MessageSquare className="h-6 w-6 text-pink-300" />
            <h3 className="mt-3 font-black text-white">Message center</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--r-text2)' }}>Housing inquiries, roommate chats, and original community discussions live here.</p>
          </Link>
        </section>
      </div>
    </LightPage>
  );
}
