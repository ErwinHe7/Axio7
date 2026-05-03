import Link from 'next/link';
import { AlertTriangle, BadgeCheck, Calendar, Home, MapPin, ShieldCheck, Train } from 'lucide-react';
import type { HousingListing } from '@/lib/housing';

export function HousingListingCard({ listing }: { listing: HousingListing }) {
  const riskColor = listing.riskLevel === 'low' ? '#34d399' : listing.riskLevel === 'medium' ? '#fbbf24' : '#fb7185';

  return (
    <Link
      href={`/housing/listings/${listing.id}`}
      className="group block overflow-hidden rounded-[24px] border p-4 transition hover:-translate-y-1"
      style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)', boxShadow: '0 22px 70px rgba(0,0,0,0.26)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--r-pink2)' }}>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
              {listing.verificationStatus === 'proof_uploaded' || listing.isEduVerifiedPost ? <BadgeCheck className="h-3 w-3" /> : <Home className="h-3 w-3" />}
              {listing.isEduVerifiedPost ? 'EDU verified' : listing.verificationStatus.replace('_', ' ')}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">{listing.sourceType.replace('_', ' ')}</span>
          </div>
          <h3 className="mt-3 text-lg font-black leading-tight text-white">{listing.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>{listing.description}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-black text-white">${listing.price.toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>per month</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--r-text2)' }}><MapPin className="h-3.5 w-3.5" />{listing.neighborhood}, {listing.borough}</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--r-text2)' }}><Calendar className="h-3.5 w-3.5" />Move-in {listing.moveInDate ?? 'flexible'}</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--r-text2)' }}><Train className="h-3.5 w-3.5" />{listing.commute.label ?? 'commute available'}</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: riskColor }}><AlertTriangle className="h-3.5 w-3.5" />Risk {listing.riskScore}/100</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}>{listing.matchScore ?? 80}% match</span>
        {listing.noFee && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs" style={{ color: 'var(--r-text2)' }}>No fee</span>}
        {listing.furnished && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs" style={{ color: 'var(--r-text2)' }}>Furnished</span>}
        {listing.positiveSignals.slice(0, 1).map((signal) => (
          <span key={signal} className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200"><ShieldCheck className="h-3 w-3" />{signal}</span>
        ))}
      </div>
    </Link>
  );
}
