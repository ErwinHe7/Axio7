import Link from 'next/link';
import { Bell, Radar } from 'lucide-react';
import { LightPage } from '@/components/LightPage';
import { HousingPreferenceSchema } from '@/lib/housing';
import { runMonitoringAgent } from '@/lib/housing/agents';

export const dynamic = 'force-dynamic';

export default function SavedSearchesPage() {
  const preference = HousingPreferenceSchema.parse({});
  const monitor = runMonitoringAgent(preference, 80);

  return (
    <LightPage>
      <div className="space-y-6">
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Monitoring Agent</div>
          <h1 className="font-fraunces text-5xl font-black italic leading-none text-white sm:text-7xl">Saved searches that watch for you.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>AXIO7 stores your profile, reruns matching, dedupes seen listings, and creates alerts when listings cross your match threshold.</p>
        </div>
        <section className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}><Radar className="h-6 w-6" /></span>
            <div>
              <h2 className="font-black text-white">Default Columbia saved search</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--r-text2)' }}>Daily alerts · minimum {monitor.minMatchScore}% match · {monitor.alerts.length} current alerts</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {monitor.alerts.map((alert) => (
              <Link key={alert.listingId} href={`/housing/listings/${alert.listingId}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2 text-white"><Bell className="h-4 w-4 text-pink-300" />{alert.title}</span>
                <span className="font-mono text-pink-200">{alert.score}%</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </LightPage>
  );
}
