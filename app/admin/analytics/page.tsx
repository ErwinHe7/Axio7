export const dynamic = 'force-dynamic';

const cardLinks = [
  {
    label: 'Realtime · who is on the site right now',
    href: 'https://analytics.google.com/analytics/web/#/p0/realtime/overview',
    hint: 'Live users, top pages, traffic sources (last 30 min)',
  },
  {
    label: 'Reports · traffic acquisition',
    href: 'https://analytics.google.com/analytics/web/#/p0/reports/explorer?params=_u..nav%3Dmaui&r=all-pages-and-screens',
    hint: 'Where visitors came from: Google, direct, social, referrals',
  },
  {
    label: 'Reports · engagement & pages',
    href: 'https://analytics.google.com/analytics/web/#/p0/reports/explorer?params=_u..nav%3Dmaui&r=all-pages-and-screens',
    hint: 'PV, sessions, average engagement time per page',
  },
  {
    label: 'Explore · custom funnels / UV',
    href: 'https://analytics.google.com/analytics/web/#/p0/analysis',
    hint: 'Build your own reports: UV by country, cohort retention, funnels',
  },
];

export default function AdminAnalyticsPage() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const lookerEmbed = process.env.NEXT_PUBLIC_LOOKER_STUDIO_EMBED;
  const tracking = Boolean(gaId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin · Analytics</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Google Analytics 4 backend. Data shows up ~30 seconds after first visit once{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_GA_ID</code>{' '}
          is set.
        </p>
      </div>

      <div
        className={`rounded-xl border p-4 text-sm ${
          tracking
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        {tracking ? (
          <>
            Tracking active — Measurement ID{' '}
            <code className="rounded bg-white/70 px-1 py-0.5 text-xs">{gaId}</code>
          </>
        ) : (
          <>
            <strong>Tracking not set up.</strong> Create a GA4 property at{' '}
            <a
              className="underline"
              href="https://analytics.google.com"
              target="_blank"
              rel="noreferrer"
            >
              analytics.google.com
            </a>
            , copy the Measurement ID (starts with <code>G-</code>), and set{' '}
            <code className="rounded bg-white/70 px-1 py-0.5 text-xs">NEXT_PUBLIC_GA_ID</code>{' '}
            in Vercel → Settings → Environment Variables. Redeploy and come back.
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cardLinks.map((c) => (
          <a
            key={c.href}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="font-medium">{c.label}</div>
            <div className="mt-1 text-xs text-ink-muted">{c.hint}</div>
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-medium">Embedded dashboard</div>
        {lookerEmbed ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200">
            <iframe
              src={lookerEmbed}
              className="h-full w-full"
              allowFullScreen
              title="Looker Studio dashboard"
            />
          </div>
        ) : (
          <p className="text-xs text-ink-muted">
            Build a Looker Studio report from your GA4 data (free) at{' '}
            <a
              className="underline"
              href="https://lookerstudio.google.com"
              target="_blank"
              rel="noreferrer"
            >
              lookerstudio.google.com
            </a>
            , click <em>Share → Embed report</em>, copy the URL, and set{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
              NEXT_PUBLIC_LOOKER_STUDIO_EMBED
            </code>{' '}
            to see UV / PV / sources / retention rendered right here.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-ink-muted">
        <div className="mb-1 font-medium text-ink">What GA4 tracks automatically</div>
        Page views, sessions, users, engagement time, scrolls, outbound clicks, site search,
        video engagement, file downloads, country/device/browser, traffic source. No code
        changes needed — just keep the env var set.
      </div>
    </div>
  );
}
