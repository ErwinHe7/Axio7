import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, AlertTriangle, BadgeCheck, MessageSquare, ShieldCheck } from 'lucide-react';
import { LightPage } from '@/components/LightPage';
import { HOUSING_LISTINGS, HousingPreferenceSchema } from '@/lib/housing';
import { runCommunicationAgent, runRiskAgent } from '@/lib/housing/agents';
import { scoreHousingListing } from '@/lib/housing/scoring';

export const dynamic = 'force-dynamic';

export default function HousingListingDetailPage({ params }: { params: { id: string } }) {
  const listing = HOUSING_LISTINGS.find((item) => item.id === params.id);
  if (!listing) return notFound();
  const preference = HousingPreferenceSchema.parse({});
  const match = scoreHousingListing(listing, preference);
  const risk = runRiskAgent(listing);
  const draft = runCommunicationAgent({ listing, preference, language: 'en' });

  return (
    <LightPage>
      <div className="space-y-5">
        <Link href="/housing/listings" className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--r-text2)' }}><ArrowLeft className="h-4 w-4" /> Back to housing listings</Link>
        <section className="rounded-[28px] border p-6" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
          <div className="flex flex-col justify-between gap-4 lg:flex-row">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-200"><BadgeCheck className="mr-1 inline h-3 w-3" />{listing.verificationStatus.replace('_', ' ')}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1" style={{ color: 'var(--r-text2)' }}>{listing.sourceType.replace('_', ' ')}</span>
              </div>
              <h1 className="mt-4 font-fraunces text-5xl font-black italic leading-none text-white">{listing.title}</h1>
              <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--r-text2)' }}>{listing.description}</p>
            </div>
            <div className="rounded-[22px] border p-5 text-right" style={{ borderColor: 'var(--lt-border)', background: 'rgba(0,0,0,0.18)' }}>
              <div className="font-mono text-4xl font-black text-white">${listing.price.toLocaleString()}</div>
              <div className="mt-1 text-xs uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>monthly rent</div>
              <div className="mt-4 rounded-full px-4 py-2 text-sm font-black text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}>{match.score}% match</div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <h2 className="mb-4 text-xl font-black text-white">Agent match reasons</h2>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--r-text2)' }}>
              {match.reasons.map((reason) => <li key={reason} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />{reason}</li>)}
            </ul>
          </section>
          <section className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white"><AlertTriangle className="h-5 w-5 text-pink-300" /> Risk {risk.riskScore}/100</h2>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--r-text2)' }}>
              {risk.riskReasons.map((reason) => <li key={reason}>• {reason}</li>)}
            </ul>
          </section>
        </div>

        <section className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-white"><MessageSquare className="h-5 w-5 text-pink-300" /> Communication Agent draft</h2>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-bold text-white">{draft.subject}</div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>{draft.body}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/inbox" className="r-btn-pink">Open Message →</Link>
            <Link href={`/housing/listings/${listing.id}`} className="r-btn-ghost">Save listing</Link>
          </div>
        </section>
      </div>
    </LightPage>
  );
}
