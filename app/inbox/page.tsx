import Link from 'next/link';
import { Suspense } from 'react';
import { MessageSquare, Tag, Users, Home, MessagesSquare } from 'lucide-react';
import { LightPage } from '@/components/LightPage';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { listTransactionsByUser, listPosts, listReplies } from '@/lib/store';
import { formatCents, timeAgo } from '@/lib/format';
import { PostComposer } from '@/components/PostComposer';
import { FeedRealtime } from '@/components/FeedRealtime';

export const dynamic = 'force-dynamic';

export default async function InboxPage({ searchParams }: { searchParams?: { tab?: string } }) {
  const user = await getCurrentUser();
  const activeTab = searchParams?.tab ?? 'chats';

  if (!user.authenticated) {
    return (
      <LightPage>
        <div className="py-20 text-center space-y-4">
          <MessageSquare className="mx-auto h-10 w-10 opacity-40" style={{ color: 'var(--r-pink2)' }} />
          <p className="text-sm" style={{ color: 'var(--lt-muted)' }}>Sign in to see your AXIO7 messages, housing inquiries, roommate matches, and discussions.</p>
          <Link href="/auth/signin?next=/inbox" className="r-btn-pink">Sign in with Google</Link>
        </div>
      </LightPage>
    );
  }

  const [conversations, posts] = await Promise.all([
    listTransactionsByUser(user.id).catch(() => []),
    listPosts(20).catch(() => []),
  ]);
  const repliesByPost = await Promise.all(posts.map((post) => listReplies(post.id).catch(() => [])));

  const tabs = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'housing', label: 'Housing Inquiries', icon: Home },
    { id: 'roommates', label: 'Roommate Matches', icon: Users },
    { id: 'discussion', label: 'Discussion', icon: MessagesSquare },
  ];

  return (
    <LightPage>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--r-pink2)' }}>Message center</div>
            <h1 className="font-fraunces text-5xl font-black italic leading-none text-white sm:text-6xl">Message</h1>
            <p className="mt-3 max-w-2xl text-sm" style={{ color: 'var(--r-text2)' }}>Housing inquiries, roommate match conversations, direct trade chats, and the original AXIO7 community discussion now live here.</p>
          </div>
          <Link href="/housing" className="r-btn-pink">Start housing search →</Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <Link key={tab.id} href={`/inbox?tab=${tab.id}`} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold" style={{ borderColor: active ? 'rgba(255,62,197,0.45)' : 'var(--lt-border)', background: active ? 'linear-gradient(135deg,rgba(255,62,197,0.28),rgba(138,61,240,0.24))' : 'var(--lt-surface)', color: active ? '#fff' : 'var(--r-text2)' }}>
                <Icon className="h-4 w-4" />{tab.label}
              </Link>
            );
          })}
        </div>

        {activeTab === 'discussion' ? (
          <section className="space-y-4">
            <Suspense fallback={null}><PostComposer /></Suspense>
            <FeedRealtime initialPosts={posts} initialReplies={repliesByPost} userId={user.id} isAdmin={isAdmin(user)} />
          </section>
        ) : activeTab === 'roommates' ? (
          <section className="rounded-[22px] border p-8 text-center" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
            <Users className="mx-auto h-8 w-8 text-pink-300" />
            <h2 className="mt-3 text-xl font-black text-white">Roommate match messages</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--r-text2)' }}>Mutual opt-in roommate conversations will appear here. Browse matches first.</p>
            <Link href="/housing/roommates" className="r-btn-pink mt-4">View roommate matches →</Link>
          </section>
        ) : activeTab === 'housing' ? (
          <section className="space-y-2">
            {conversations.length === 0 ? <EmptyHousingState /> : <ConversationList conversations={conversations} />}
          </section>
        ) : (
          <section className="space-y-2">
            {conversations.length === 0 ? <EmptyChatState /> : <ConversationList conversations={conversations} />}
          </section>
        )}
      </div>
    </LightPage>
  );
}

function EmptyChatState() {
  return (
    <div className="rounded-[22px] border-dashed p-16 text-center" style={{ border: '1px dashed var(--lt-border)', background: 'var(--lt-surface)' }}>
      <MessageSquare className="mx-auto mb-3 h-8 w-8 text-pink-300" />
      <p className="text-sm font-medium text-white">No active messages yet.</p>
      <p className="mt-1 text-xs" style={{ color: 'var(--lt-muted)' }}>When you connect with a buyer, seller, subletter, or roommate, the conversation appears here.</p>
      <Link href="/housing/listings" className="r-btn-pink mt-4">Browse housing listings →</Link>
    </div>
  );
}

function EmptyHousingState() {
  return (
    <div className="rounded-[22px] border-dashed p-16 text-center" style={{ border: '1px dashed var(--lt-border)', background: 'var(--lt-surface)' }}>
      <Home className="mx-auto mb-3 h-8 w-8 text-pink-300" />
      <p className="text-sm font-medium text-white">No housing inquiries yet.</p>
      <p className="mt-1 text-xs" style={{ color: 'var(--lt-muted)' }}>Contact a listing or generate outreach to start a housing inquiry.</p>
      <Link href="/housing" className="r-btn-pink mt-4">Run housing agents →</Link>
    </div>
  );
}

function ConversationList({ conversations }: { conversations: Awaited<ReturnType<typeof listTransactionsByUser>> }) {
  return (
    <ul className="space-y-2">
      {conversations.map((tx) => {
        const threadUrl = `/trade/${tx.listing_id}/thread?tx=${tx.id}`;
        const hasUnread = tx.unread_count > 0;
        return (
          <li key={tx.id}>
            <Link href={threadUrl} className="flex items-start gap-3 rounded-[18px] px-4 py-3.5 transition hover:opacity-90" style={{ background: hasUnread ? 'rgba(255,62,197,0.09)' : 'var(--lt-surface)', border: `1px solid ${hasUnread ? 'rgba(255,62,197,0.24)' : 'var(--lt-border)'}` }}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}>
                {tx.buyer_name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-white">{tx.buyer_name} / {tx.seller_name}</span>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {hasUnread && <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ background: 'var(--r-pink)' }}>{tx.unread_count}</span>}
                    {tx.last_message_at && <span className="text-[11px]" style={{ color: 'var(--lt-subtle)' }}>{timeAgo(tx.last_message_at)}</span>}
                  </div>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--lt-muted)' }}>
                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 capitalize" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--lt-subtle)' }}><Tag className="h-2.5 w-2.5" />{tx.listing_category}</span>
                  <span className="truncate font-medium text-white">{tx.listing_title}</span>
                  <span className="flex-shrink-0">· {formatCents(tx.amount_cents, 'USD')}</span>
                </div>
                {tx.last_message && <p className="mt-1 truncate text-xs" style={{ color: 'var(--lt-muted)' }}>{tx.last_message}</p>}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
