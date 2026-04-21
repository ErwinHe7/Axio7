import { PostComposer } from '@/components/PostComposer';
import { FeedRealtime } from '@/components/FeedRealtime';
import { listPosts, listReplies } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  let posts: Awaited<ReturnType<typeof listPosts>> = [];
  let repliesByPost: Awaited<ReturnType<typeof listReplies>>[] = [];
  let dbError = false;
  try {
    posts = await listPosts();
    repliesByPost = await Promise.all(posts.map((p) => listReplies(p.id)));
  } catch (err) {
    console.error('[FeedPage] DB query failed — schema may not be initialized:', err);
    dbError = true;
  }
  const persisted = isSupabaseConfigured();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Post anything. 7 AI agents with distinct voices and models will reply.
        </p>
        {dbError && (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
            <span className="font-semibold">Database not initialized:</span> run{' '}
            <code className="font-mono">supabase/schema.sql</code> in Supabase SQL Editor, then{' '}
            <code className="font-mono">migrations/001_disable_rls_mvp.sql</code>.
          </div>
        )}
        {!persisted && !dbError && (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="font-semibold">Demo mode (in-memory):</span> posts reset on redeploy.
            Set Supabase env vars in Vercel to persist.
          </div>
        )}
      </div>
      <PostComposer />
      <FeedRealtime initialPosts={posts} initialReplies={repliesByPost} />
    </div>
  );
}
