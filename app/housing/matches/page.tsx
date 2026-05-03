import Link from 'next/link';
import { LightPage } from '@/components/LightPage';
import { HousingListingCard } from '@/components/housing/HousingListingCard';
import { HousingPreferenceSchema } from '@/lib/housing';
import { parseHousingNeed, runMatchingAgent } from '@/lib/housing/agents';

export const dynamic = 'force-dynamic';

export default function MatchesPage({ searchParams }: { searchParams?: { q?: string } }) {
  const preference = searchParams?.q ? parseHousingNeed(searchParams.q) : HousingPreferenceSchema.parse({});
  const result = runMatchingAgent(preference);

  return (
    <LightPage>
      <div className="space-y-6">
        <div className="rounded-[26px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
          <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Matching Agent results</div>
          <h1 className="mt-2 font-fraunces text-5xl font-black italic leading-none text-white">Your ranked housing matches</h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--r-text2)' }}>{result.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs" style={{ color: 'var(--r-text2)' }}>
            <span className="rounded-full bg-white/5 px-3 py-1">School: {preference.school}</span>
            <span className="rounded-full bg-white/5 px-3 py-1">Budget: ${preference.budgetMin}-${preference.budgetMax}</span>
            <span className="rounded-full bg-white/5 px-3 py-1">Commute: {preference.maxCommuteMinutes} min</span>
            <span className="rounded-full bg-white/5 px-3 py-1">Room: {preference.roomType}</span>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {result.listingMatches.map((match) => <HousingListingCard key={match.listing.id} listing={match.listing} />)}
        </div>
        <Link href="/housing/saved" className="r-btn-pink">Save this search and monitor new listings →</Link>
      </div>
    </LightPage>
  );
}
