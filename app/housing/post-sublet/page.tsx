import Link from 'next/link';
import { BadgeCheck, FileText, ShieldCheck, Upload } from 'lucide-react';
import { LightPage } from '@/components/LightPage';

export const dynamic = 'force-dynamic';

export default function PostSubletPage() {
  return (
    <LightPage>
      <div className="space-y-6">
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Verified student sublets</div>
          <h1 className="font-fraunces text-5xl font-black italic leading-none text-white sm:text-7xl">Post a verified sublet</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--r-text2)' }}>
Post a student sublet with .edu badge, proof status, risk check, and private Message contact.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <h2 className="flex items-center gap-2 text-xl font-black text-white"><BadgeCheck className="h-5 w-5 text-emerald-300" /> EDU verified badge</h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--r-text2)' }}>No separate verification page. If you sign in with a .edu email, AXIO7 marks your sublet and discussion posts as EDU verified.</p>
            <div className="mt-4 grid gap-2 text-xs" style={{ color: 'var(--r-text2)' }}>
              <span><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-300" /> Columbia, NYU, Fordham, Parsons/New School, Baruch/CUNY supported</span>
              <span><FileText className="mr-1 inline h-3.5 w-3.5 text-pink-300" /> Upload proof with private details redacted.</span>
            </div>
            <Link href="/auth/signin?next=/housing/post-sublet" className="r-btn-pink mt-4 w-full justify-center">Sign in with .edu email</Link>
          </section>

          <section className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <h2 className="text-xl font-black text-white">Sublet details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {['Title', 'Neighborhood', 'Monthly rent', 'Move-in date', 'Lease end date', 'Room type'].map((label) => (
                <label key={label} className="space-y-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>
                  {label}
                  <input className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none" />
                </label>
              ))}
            </div>
            <label className="mt-3 block space-y-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>
              Description + permission notes
              <textarea rows={5} className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none" />
            </label>
            <div className="mt-4 rounded-2xl border border-dashed border-pink-300/25 bg-pink-300/5 p-4 text-sm" style={{ color: 'var(--r-text2)' }}>
              <Upload className="mr-2 inline h-4 w-4 text-pink-300" /> Proof upload placeholder: lease screenshot, building portal, or landlord approval. AXIO7 will show Proof Uploaded / Permission Unknown / Confirmed badges.
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="r-btn-pink">Submit for risk check →</button>
              <Link href="/housing/listings" className="r-btn-ghost">View listings</Link>
            </div>
          </section>
        </div>
      </div>
    </LightPage>
  );
}
