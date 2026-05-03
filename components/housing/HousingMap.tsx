'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, Train } from 'lucide-react';
import type { HousingListing } from '@/lib/housing';

function project(listing: HousingListing) {
  const lat = listing.lat ?? 40.75;
  const lng = listing.lng ?? -73.97;
  const minLat = 40.67;
  const maxLat = 40.84;
  const minLng = -74.04;
  const maxLng = -73.88;
  return {
    x: Math.max(5, Math.min(95, ((lng - minLng) / (maxLng - minLng)) * 100)),
    y: Math.max(5, Math.min(95, (1 - (lat - minLat) / (maxLat - minLat)) * 100)),
  };
}

export function HousingMap({ listings }: { listings: HousingListing[] }) {
  const [activeId, setActiveId] = useState(listings[0]?.id ?? '');
  const active = useMemo(() => listings.find((listing) => listing.id === activeId) ?? listings[0], [activeId, listings]);

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border" style={{ background: 'linear-gradient(135deg,rgba(12,8,20,0.96),rgba(30,16,45,0.92))', borderColor: 'var(--lt-border)' }}>
        <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'linear-gradient(rgba(255,62,197,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,62,197,0.08) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="absolute inset-x-[18%] top-0 h-full rotate-[-18deg] rounded-full border border-pink-300/15" />
        <div className="absolute inset-y-[-20%] left-[42%] w-[18%] rotate-[18deg] rounded-full border border-violet-300/15" />
        <div className="absolute left-[12%] top-[18%] rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-text2)' }}>Manhattan</div>
        <div className="absolute right-[14%] top-[54%] rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-text2)' }}>Queens</div>
        <div className="absolute bottom-[16%] left-[30%] rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-text2)' }}>Brooklyn / NJ nearby</div>

        {listings.map((listing) => {
          const pos = project(listing);
          const selected = listing.id === active?.id;
          return (
            <button
              key={listing.id}
              type="button"
              onClick={() => setActiveId(listing.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: selected ? 'translate(-50%, -50%) scale(1.12)' : 'translate(-50%, -50%)' }}
              aria-label={`View ${listing.title}`}
            >
              <span className="relative grid h-12 w-12 place-items-center rounded-full text-white shadow-[0_0_30px_rgba(255,62,197,0.65)]" style={{ background: selected ? 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' : 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)' }}>
                <MapPin className="h-5 w-5" />
                <span className="absolute -bottom-7 whitespace-nowrap rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] font-bold">${listing.price}</span>
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <aside className="rounded-[28px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Selected listing</div>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">{active.title}</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>{active.neighborhood}, {active.borough}</p>
          <div className="mt-4 grid gap-2 text-sm" style={{ color: 'var(--r-text2)' }}>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-pink-300" />${active.price.toLocaleString()} / month</span>
            <span className="inline-flex items-center gap-2"><Train className="h-4 w-4 text-pink-300" />{active.commute.label ?? 'Commute estimate available'}</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Risk {active.riskScore}/100 · {active.isEduVerifiedPost ? 'EDU verified' : active.verificationStatus.replace('_', ' ')}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {active.matchReasons?.slice(0, 3).map((reason) => (
              <span key={reason} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs" style={{ color: 'var(--r-text2)' }}>{reason}</span>
            ))}
          </div>
          <Link href={`/housing/listings/${active.id}`} className="r-btn-pink mt-5 w-full justify-center">Open listing →</Link>
        </aside>
      )}
    </section>
  );
}
