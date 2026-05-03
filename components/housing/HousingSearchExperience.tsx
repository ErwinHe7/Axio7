'use client';

import { useMemo, useState } from 'react';
import { Bell, Filter, ShieldCheck } from 'lucide-react';
import type { HousingListing } from '@/lib/housing';
import { HousingMap } from './HousingMap';
import { HousingListingCard } from './HousingListingCard';

export function HousingSearchExperience({ listings }: { listings: HousingListing[] }) {
  const [borough, setBorough] = useState('All');
  const [maxPrice, setMaxPrice] = useState(3000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [noFeeOnly, setNoFeeOnly] = useState(false);
  const [riskMax, setRiskMax] = useState(100);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => listings.filter((listing) => {
    if (borough !== 'All' && listing.borough !== borough) return false;
    if (listing.price > maxPrice) return false;
    if (verifiedOnly && !listing.isEduVerifiedPost && listing.verificationStatus !== 'proof_uploaded' && listing.verificationStatus !== 'admin_verified') return false;
    if (noFeeOnly && !listing.noFee) return false;
    if (listing.riskScore > riskMax) return false;
    return listing.status !== 'removed';
  }), [borough, listings, maxPrice, noFeeOnly, riskMax, verifiedOnly]);

  return (
    <div className="space-y-5">
      <section className="rounded-[26px] border p-4" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>
          <Filter className="h-4 w-4" /> Live housing filters
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_160px]">
          <div className="flex flex-wrap gap-2">
            {['All', 'Manhattan', 'Queens', 'Brooklyn', 'New Jersey nearby'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setBorough(item)}
                className="rounded-full border px-4 py-2 text-sm font-bold transition"
                style={{
                  borderColor: borough === item ? 'rgba(255,62,197,0.45)' : 'var(--lt-border)',
                  background: borough === item ? 'linear-gradient(135deg,rgba(255,62,197,0.28),rgba(138,61,240,0.24))' : 'rgba(255,255,255,0.04)',
                  color: borough === item ? '#fff' : 'var(--r-text2)',
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="space-y-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>
            Max rent ${maxPrice.toLocaleString()}
            <input type="range" min="1200" max="3500" step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-pink-400" />
          </label>
          <label className="space-y-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>
            Risk under {riskMax}
            <input type="range" min="20" max="100" step="5" value={riskMax} onChange={(e) => setRiskMax(Number(e.target.value))} className="w-full accent-pink-400" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setVerifiedOnly((value) => !value)} className="rounded-full border px-4 py-2 text-sm font-bold" style={{ borderColor: verifiedOnly ? 'rgba(52,211,153,0.45)' : 'var(--lt-border)', background: verifiedOnly ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)', color: verifiedOnly ? '#a7f3d0' : 'var(--r-text2)' }}>
            <ShieldCheck className="mr-1 inline h-4 w-4" /> Verified only
          </button>
          <button type="button" onClick={() => setNoFeeOnly((value) => !value)} className="rounded-full border px-4 py-2 text-sm font-bold" style={{ borderColor: noFeeOnly ? 'rgba(255,62,197,0.45)' : 'var(--lt-border)', background: noFeeOnly ? 'rgba(255,62,197,0.12)' : 'rgba(255,255,255,0.04)', color: noFeeOnly ? 'var(--r-pink2)' : 'var(--r-text2)' }}>No fee</button>
          <button type="button" onClick={() => setSaved(true)} className="r-btn-pink ml-auto">
            <Bell className="h-4 w-4" /> {saved ? 'Saved search active' : 'Save + monitor'}
          </button>
        </div>
        {saved && (
          <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            Monitoring Agent will watch for listings under ${maxPrice.toLocaleString()}, risk ≤ {riskMax}, {borough === 'All' ? 'all NYC areas' : borough}, and notify Message when a strong match appears.
          </div>
        )}
      </section>

      <section id="map">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Map view</div>
            <h2 className="mt-1 text-2xl font-black text-white">Tap listings on the NYC map</h2>
          </div>
          <div className="text-sm font-bold" style={{ color: 'var(--r-text2)' }}>{filtered.length} matches</div>
        </div>
        <HousingMap listings={filtered.length ? filtered : listings} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Filtered results</div>
            <h2 className="mt-1 text-2xl font-black text-white">Ranked candidates</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((listing) => <HousingListingCard key={listing.id} listing={listing} />)}
        </div>
      </section>
    </div>
  );
}
