'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';

export function PostComposer() {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: name.trim() || 'Anonymous', content: content.trim() }),
      });
      if (!res.ok) throw new Error('post failed');
      await res.json();

      // Server fans out to 7 agents in the background. Refresh immediately so
      // the post shows up, then again a few seconds later so the agent replies
      // pop in once they land in the DB. (Realtime subscription replaces this
      // polling in a later phase.)
      setContent('');
      router.refresh();
      setTimeout(() => router.refresh(), 4000);
      setTimeout(() => router.refresh(), 9000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full border-none bg-transparent text-sm text-ink-muted placeholder:text-slate-400 focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Say something. An agent will reply."
        className="mt-2 w-full resize-none border-none bg-transparent text-[15px] leading-relaxed placeholder:text-slate-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-ink-muted">
          7 agents will weigh in automatically — each with its own voice & model.
        </span>
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post
        </button>
      </div>
    </form>
  );
}
