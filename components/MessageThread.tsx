'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2, Send } from 'lucide-react';
import type { Message } from '@/lib/types';
import { timeAgo } from '@/lib/format';

export function MessageThread({
  transactionId,
  sellerName,
  buyerName,
  initialMessages,
}: {
  transactionId: string;
  sellerName: string;
  buyerName: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [name, setName] = useState(buyerName);
  const [content, setContent] = useState('');
  const [, start] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Simple poll every 4s so new messages appear for the other side even without Supabase Realtime.
  useEffect(() => {
    const iv = setInterval(async () => {
      const res = await fetch(`/api/transactions/${transactionId}/messages`).catch(() => null);
      if (!res?.ok) return;
      const { messages: next } = await res.json();
      setMessages(next ?? []);
    }, 4000);
    return () => clearInterval(iv);
  }, [transactionId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    const body = JSON.stringify({ sender_name: name.trim() || 'Anonymous', content: content.trim() });
    start(async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        if (res.ok) {
          const { message } = await res.json();
          setMessages((prev) => [...prev, message]);
          setContent('');
        }
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-ink-muted">
        <span>Participants: <span className="font-medium text-ink">{sellerName}</span> · <span className="font-medium text-ink">{buyerName}</span></span>
        <span>{messages.length} message{messages.length === 1 ? '' : 's'}</span>
      </div>
      <div className="max-h-[55vh] min-h-[240px] overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No messages yet. Say hi.</p>
        )}
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="flex items-start gap-2">
              <div className="h-7 w-7 flex-shrink-0 rounded-full bg-slate-200 text-center text-xs leading-7 text-ink-muted">
                {m.sender_name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="text-xs">
                  <span className="font-semibold">{m.sender_name}</span>
                  <span className="ml-2 text-ink-muted">{timeAgo(m.created_at)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">{m.content}</p>
              </div>
            </li>
          ))}
        </ul>
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="space-y-2 border-t border-slate-100 p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-ink focus:outline-none"
        />
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-ink focus:outline-none"
          />
          <button
            disabled={!content.trim() || submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
