import { LightPage } from '@/components/LightPage';
import { RoommateMatchCard } from '@/components/housing/RoommateMatchCard';
import { HousingPreferenceSchema, ROOMMATE_PROFILES } from '@/lib/housing';
import { scoreRoommate } from '@/lib/housing/scoring';

export const dynamic = 'force-dynamic';

export default function RoommatesPage() {
  const preference = HousingPreferenceSchema.parse({});
  const matches = ROOMMATE_PROFILES.map((profile) => scoreRoommate(profile, preference)).sort((a, b) => b.score - a.score);

  return (
    <LightPage>
      <div className="space-y-6">
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Roommate Matching Agent</div>
          <h1 className="font-fraunces text-5xl font-black italic leading-none text-white sm:text-7xl">Find compatible roommates.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>Match by school, budget, move-in, neighborhoods, lifestyle, and mutual opt-in.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {matches.map((match) => <RoommateMatchCard key={match.id} match={match} />)}
        </div>
      </div>
    </LightPage>
  );
}
