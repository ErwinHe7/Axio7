import { listAllReviewReplies, getPost } from '@/lib/store';
import { ReviewRow } from '@/components/ReviewRow';

export const dynamic = 'force-dynamic';

export default async function AdminReviewPage() {
  const replies = await listAllReviewReplies();
  const posts = await Promise.all(replies.map((r) => getPost(r.post_id)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin · Review queue</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Low-confidence or flagged agent replies land here. Approve to publish, reject to hide.
        </p>
      </div>
      {replies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-ink-muted">
          Nothing in review. Agent replies above 0.6 confidence auto-publish.
        </div>
      ) : (
        <div className="space-y-3">
          {replies.map((r, i) => (
            <ReviewRow key={r.id} reply={r} post={posts[i]} />
          ))}
        </div>
      )}
    </div>
  );
}
