import { LightPage } from '@/components/LightPage';
import { NeighborhoodCard } from '@/components/housing/NeighborhoodCard';
import { NYC_NEIGHBORHOODS } from '@/lib/housing';

export const dynamic = 'force-dynamic';

export default function NeighborhoodsPage() {
  return (
    <LightPage>
      <div className="space-y-6">
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Neighborhood Intelligence Agent</div>
          <h1 className="font-fraunces text-5xl font-black italic leading-none text-white sm:text-7xl">Understand NYC before signing.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>Newcomer-friendly explanations for commute, budget, student fit, safety feeling, and neighborhood tradeoffs across Manhattan, Brooklyn, Queens, Jersey City, and Hoboken.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {NYC_NEIGHBORHOODS.map((neighborhood) => <NeighborhoodCard key={neighborhood.slug} neighborhood={neighborhood} />)}
        </div>
      </div>
    </LightPage>
  );
}
