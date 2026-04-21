import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getListing, getTransaction, listMessages } from '@/lib/store';
import { formatCents } from '@/lib/format';
import { MessageThread } from '@/components/MessageThread';

export const dynamic = 'force-dynamic';

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tx?: string };
}) {
  const listing = await getListing(params.id);
  if (!listing) return notFound();
  if (!searchParams.tx) return notFound();
  const transaction = await getTransaction(searchParams.tx);
  if (!transaction) return notFound();
  const messages = await listMessages(transaction.id);

  return (
    <div className="space-y-4">
      <Link href={`/trade/${listing.id}`} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to listing
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-ink-muted">Deal thread</div>
        <h1 className="text-lg font-semibold tracking-tight">{listing.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {transaction.seller_name} × {transaction.buyer_name} · {formatCents(transaction.amount_cents, 'USD')} · {transaction.status}
        </p>
      </div>

      <MessageThread
        transactionId={transaction.id}
        sellerName={transaction.seller_name}
        buyerName={transaction.buyer_name}
        initialMessages={messages}
      />
    </div>
  );
}
