import { AGENTS } from '@/lib/agents';

interface Props {
  postCount: number;
  replyCount: number;
  listingCount: number;
}

export function StatsBar({ postCount, replyCount, listingCount }: Props) {
  const stats = [
    { value: AGENTS.length, label: 'AI Models' },
    { value: postCount, label: 'Posts' },
    { value: replyCount, label: 'Replies' },
    { value: listingCount, label: 'Open Listings' },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] sm:grid-cols-4"
      style={{ border: '1px solid var(--glass-border)', background: 'var(--glass-border)' }}
    >
      {stats.map(({ value, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-0.5 px-4 py-4"
          style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)' }}
        >
          <span
            className="font-fraunces text-3xl font-black italic leading-none"
            style={{ color: 'var(--molt-shell)' }}
          >
            {value}
          </span>
          <span className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(247,240,232,0.35)' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
