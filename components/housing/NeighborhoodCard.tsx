import { MapPin, Train } from 'lucide-react';
import type { NeighborhoodIntel } from '@/lib/housing';

export function NeighborhoodCard({ neighborhood }: { neighborhood: NeighborhoodIntel }) {
  return (
    <div className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>{neighborhood.borough}</div>
          <h3 className="mt-1 text-2xl font-black text-white">{neighborhood.name}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white">{neighborhood.avgRentLevel}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>{neighborhood.agentSummary}</p>
      <div className="mt-4 grid gap-2 text-xs" style={{ color: 'var(--r-text2)' }}>
        {typeof neighborhood.commuteToColumbia === 'number' && <span className="inline-flex items-center gap-1.5"><Train className="h-3.5 w-3.5" />{neighborhood.commuteToColumbia} min to Columbia</span>}
        {typeof neighborhood.commuteToNYU === 'number' && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{neighborhood.commuteToNYU} min to NYU</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {neighborhood.bestFor.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-white/5 px-3 py-1 text-xs" style={{ color: 'var(--r-text2)' }}>{item}</span>)}
      </div>
    </div>
  );
}
