import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/components/rentals/rentals.css';

const RentalsApp = nextDynamic(() => import('@/components/rentals/RentalsApp'), { ssr: false });

export const dynamic = 'force-dynamic';

export default function RentalsPage() {
  return (
    <div className="space-y-4">
      <Link href="/trade" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Trade
      </Link>
      <div className="rentals-wrapper">
        <RentalsApp />
      </div>
    </div>
  );
}
