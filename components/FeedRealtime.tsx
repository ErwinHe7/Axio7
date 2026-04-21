'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Post, Reply } from '@/lib/types';
import { PostCard } from './PostCard';

/**
 * Wraps the initial SSR-rendered post list and subscribes to Supabase Realtime.
 * New posts slide in at the top; new replies and likes refresh the affected card.
 *
 * Falls back gracefully when Supabase env vars are missing (demo mode).
 */
export function FeedRealtime({
  initialPosts,
  initialReplies,
}: {
  initialPosts: Post[];
  initialReplies: Reply[][];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>(() => {
    const m: Record<string, Reply[]> = {};
    initialPosts.forEach((p, i) => { m[p.id] = initialReplies[i] ?? []; });
    return m;
  });
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const channelRef = useRef<ReturnType<ReturnType<typeof import('../lib/supabase-browser').supabaseBrowser>['channel']> | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return; // demo mode — no realtime

    // Dynamic import keeps supabase-browser out of the server bundle
    import('../lib/supabase-browser').then(({ supabaseBrowser }) => {
      const sb = supabaseBrowser();

      const channel = sb
        .channel('feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
          const newPost = payload.new as Post & { images?: string[] };
          const p: Post = { ...newPost, images: newPost.images ?? [] };
          setPosts((prev) => {
            if (prev.some((x) => x.id === p.id)) return prev;
            setNewPostIds((s) => new Set(s).add(p.id));
            setRepliesMap((m) => ({ ...m, [p.id]: [] }));
            setTimeout(() => setNewPostIds((s) => { const next = new Set(s); next.delete(p.id); return next; }), 700);
            return [p, ...prev];
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies' }, (payload) => {
          const reply = payload.new as Reply;
          setRepliesMap((m) => {
            const existing = m[reply.post_id] ?? [];
            if (existing.some((r) => r.id === reply.id)) return m;
            return { ...m, [reply.post_id]: [...existing, reply] };
          });
          setPosts((prev) =>
            prev.map((p) =>
              p.id === reply.post_id ? { ...p, reply_count: p.reply_count + 1 } : p
            )
          );
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, (payload) => {
          const like = payload.new as { post_id: string };
          setPosts((prev) =>
            prev.map((p) => p.id === like.post_id ? { ...p, like_count: p.like_count + 1 } : p)
          );
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_likes' }, (payload) => {
          const like = payload.old as { post_id: string };
          setPosts((prev) =>
            prev.map((p) => p.id === like.post_id ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p)
          );
        })
        .subscribe();

      channelRef.current = channel;
    });

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  // Keep router in sync so SSR pages also get the latest data on navigation
  useEffect(() => {
    router.refresh();
  }, [posts.length]);

  return (
    <div className="space-y-3">
      {posts.map((post, i) => (
        <div
          key={post.id}
          className={newPostIds.has(post.id) ? 'animate-slide-in' : ''}
        >
          <PostCard post={post} replies={repliesMap[post.id] ?? []} />
        </div>
      ))}
    </div>
  );
}
