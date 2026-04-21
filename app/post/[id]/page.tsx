import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPost, listReplies } from '@/lib/store';
import { PostCard } from '@/components/PostCard';

export const dynamic = 'force-dynamic';

export default async function PostDetail({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) return notFound();
  const replies = await listReplies(post.id);

  return (
    <div className="space-y-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Feed
      </Link>
      <PostCard post={post} replies={replies} />
    </div>
  );
}
