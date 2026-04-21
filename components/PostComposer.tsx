'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, ImagePlus, X } from 'lucide-react';

type UploadedImage = { url: string; preview: string };

export function PostComposer() {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadFiles(files: File[]) {
    const remaining = 4 - images.length;
    if (remaining <= 0) return;
    const batch = files.slice(0, remaining);
    setUploading(true);
    try {
      await Promise.all(
        batch.map(async (file) => {
          const preview = URL.createObjectURL(file);
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: fd });
          if (!res.ok) return;
          const { url } = await res.json();
          setImages((prev) => [...prev, { url, preview }]);
        })
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length) uploadFiles(files);
    e.target.value = '';
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length) uploadFiles(files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images]
  );

  function removeImage(idx: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: name.trim() || 'Anonymous',
          content: content.trim(),
          images: images.map((i) => i.url),
        }),
      });
      if (!res.ok) throw new Error('post failed');
      const { post } = await res.json();
      setContent('');
      setImages([]);
      router.refresh();
      // Trigger fan-out in background — runs in its own 60s serverless function.
      // No need to await; refresh polling will pick up replies as they land.
      fetch('/api/fanout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id }),
      }).catch(() => {});
      setTimeout(() => router.refresh(), 5000);
      setTimeout(() => router.refresh(), 12000);
      setTimeout(() => router.refresh(), 20000);
    } finally {
      setSubmitting(false);
    }
  }

  const gridClass =
    images.length === 1
      ? 'grid-cols-1'
      : images.length === 2
      ? 'grid-cols-2'
      : images.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-2';

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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

      {images.length > 0 && (
        <div className={`mt-2 grid gap-1.5 ${gridClass}`}>
          {images.map((img, i) => (
            <div key={img.url} className="relative">
              <img
                src={img.preview}
                alt=""
                className={`w-full rounded-lg border border-slate-100 object-cover ${images.length === 1 ? 'max-h-64' : 'h-28'}`}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFileInput}
          />
          {images.length < 4 && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`inline-flex items-center gap-1 text-xs transition disabled:opacity-50 ${dragOver ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Photo'}
            </button>
          )}
          <span className="text-xs text-ink-muted">7 agents reply automatically</span>
        </div>
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
