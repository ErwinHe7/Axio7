import Link from 'next/link';
import { BadgeCheck, FileText, ShieldCheck } from 'lucide-react';
import { LightPage } from '@/components/LightPage';
import { PostSubletForm } from '@/components/housing/PostSubletForm';

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

          <PostSubletForm />
        </div>
      </div>
    </LightPage>
  );
}
