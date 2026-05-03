import { BadgeCheck, Users } from 'lucide-react';
import type { RoommateMatch } from '@/lib/housing';

export function RoommateMatchCard({ match }: { match: RoommateMatch }) {
  return (
    <div className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full text-lg font-black text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}>
            {match.profile.name.slice(0, 1)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white">{match.profile.name}</h3>
              {match.profile.verified && <BadgeCheck className="h-4 w-4 text-emerald-300" />}
            </div>
            <p className="text-xs" style={{ color: 'var(--r-text3)' }}>{match.profile.school} · ${match.profile.budget}/mo · {match.profile.moveInDate}</p>
          </div>
        </div>
        <span className="rounded-full px-3 py-1 font-mono text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}>{match.score}%</span>
      </div>
      <p className="mt-3 text-sm" style={{ color: 'var(--r-text2)' }}>{match.profile.intro}</p>
      <div className="mt-4 space-y-1.5 text-xs" style={{ color: 'var(--r-text2)' }}>
        {match.reasons.slice(0, 4).map((reason) => <div key={reason} className="flex items-start gap-2"><Users className="mt-0.5 h-3.5 w-3.5 text-pink-300" />{reason}</div>)}
      </div>
    </div>
  );
}
