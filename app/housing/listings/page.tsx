import Link from 'next/link';
import { Plus } from 'lucide-react';
import { LightPage } from '@/components/LightPage';
import { HousingListingCard } from '@/components/housing/HousingListingCard';
import { listHousingListings } from '@/lib/housing/store';

export const dynamic = 'force-dynamic';

export default async function HousingListingsPage({ searchParams }: { searchParams?: { borough?: string; maxPrice?: string; verified?: string } }) {
  const listings = await listHousingListings({
    borough: searchParams?.borough,
    maxPrice: Number(searchParams?.maxPrice || '0') || undefined,
    verifiedOnly: searchParams?.verified === 'true',
  });

  return (
    <LightPage>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Normalized housing inventory</div>
            <h1 className="font-fraunces text-5xl font-black italic leading-none text-white sm:text-7xl">Housing Listings</h1>
            <p className="mt-3 max-w-2xl text-sm" style={{ color: 'var(--r-text2)' }}>Verified sublets, building availability, match scores, and risk checks.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/housing#map" className="r-btn-ghost">Open map</Link>
            <Link href="/housing/post-sublet" className="r-btn-pink"><Plus className="h-4 w-4" /> Post sublet</Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Manhattan', 'Queens', 'Brooklyn', 'New Jersey nearby'].map((borough) => (
            <Link key={borough} href={borough === 'All' ? '/housing/listings' : `/housing/listings?borough=${encodeURIComponent(borough)}`} className="rounded-full border px-4 py-2 text-sm font-bold" style={{ borderColor: 'var(--lt-border)', background: 'var(--lt-surface)', color: 'var(--r-text2)' }}>{borough}</Link>
          ))}
          <Link href="/housing/listings?verified=true" className="rounded-full border px-4 py-2 text-sm font-bold" style={{ borderColor: 'rgba(52,211,153,0.25)', background: 'rgba(52,211,153,0.1)', color: '#a7f3d0' }}>Verified only</Link>
          <Link href="/housing/listings?maxPrice=2000" className="rounded-full border px-4 py-2 text-sm font-bold" style={{ borderColor: 'var(--lt-border)', background: 'var(--lt-surface)', color: 'var(--r-text2)' }}>Under $2,000</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {listings.map((listing) => <HousingListingCard key={listing.id} listing={listing} />)}
        </div>
      </div>
    </LightPage>
  );
}
