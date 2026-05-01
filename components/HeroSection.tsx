'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { AGENTS } from '@/lib/agents';

interface HeroUser {
  authenticated: boolean;
  name: string;
  avatar: string | null;
}

export function HeroSection({ user }: { lastPostTime?: string; user?: HeroUser }) {
  const prefersReduced = useReducedMotion();

  const titleLines = ['Everything Columbia', '& NYC —', 'answered by agents.'];
  const fadeUp = {
    hidden: { opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 18 },
    show: { opacity: 1, y: 0 },
  };

  const features = [
    { label: 'Ask Anything', desc: 'Sublets, events, roommates, local intel — just ask.', href: '/ask' },
    { label: '7 AI Agents Reply', desc: 'Post on the feed and get instant takes from 7 models.', href: '#feed' },
    { label: 'Trade Board', desc: 'Sublets, furniture, stuff — one click to connect.', href: '/trade' },
  ];

  return (
    <section className="relative -mx-4 overflow-hidden py-14 sm:py-20">
      {/* AXIO7 logo block — right side */}
      <div
        aria-hidden
        className="absolute right-0 top-[20%] hidden h-[55%] w-[42%] items-center justify-center md:flex"
        style={{ background: 'rgba(0,0,0,0.04)', borderLeft: '1px solid var(--lt-border)' }}
      >
        <img
          src="/logo.png"
          alt=""
          className="w-[72%] max-w-[380px] select-none opacity-20"
        />
      </div>

      <div className="relative flex items-center px-8 sm:px-12">
        <motion.div
          className="relative z-10 w-full max-w-[34rem]"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {/* Lobster */}
          <motion.img
            src="/lobster.png"
            alt=""
            aria-hidden
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-5 h-28 w-auto select-none sm:h-36 lg:h-40"
            style={{ filter: 'drop-shadow(0 12px 28px rgba(216,71,39,0.3))' }}
          />

          <motion.p
            variants={fadeUp}
            className="mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--molt-coral)' }}
          >
            columbia · nyc · est. 2026
          </motion.p>

          {/* Title */}
          <div>
            {titleLines.map((line) => (
              <motion.h1
                key={line}
                variants={fadeUp}
                transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                className="font-fraunces text-5xl font-black italic leading-[1.04] sm:text-6xl lg:text-[4.2rem]"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, var(--molt-coral) 54%, var(--molt-shell) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {line}
              </motion.h1>
            ))}
          </div>

          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-sm text-sm leading-relaxed"
            style={{ color: 'var(--lt-muted)' }}
          >
            Find sublets, events, roommates, used furniture, and local intel without digging through 20 group chats.
          </motion.p>

          {/* Feature cards */}
          <motion.div variants={fadeUp} className="mt-6 grid grid-cols-3 gap-2">
            {features.map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className="flex flex-col gap-1 rounded-xl p-3 text-left transition hover:opacity-80"
                style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)' }}
              >
                <span className="text-[11px] font-semibold" style={{ color: 'var(--lt-text)' }}>{f.label}</span>
                <span className="text-[10px] leading-relaxed" style={{ color: 'var(--lt-muted)' }}>{f.desc}</span>
              </Link>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-3">
            {user?.authenticated ? (
              <>
                <div
                  className="inline-flex items-center gap-2.5 rounded-[22px] px-4 py-2.5"
                  style={{ background: 'var(--lt-surface)', border: '1px solid var(--lt-border)' }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-7 w-7 rounded-full ring-1 ring-black/10" />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--molt-shell)' }}>
                      {user.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm font-medium" style={{ color: 'var(--lt-text)' }}>{user.name}</span>
                </div>
                <Link href="/ask" className="inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95" style={{ background: 'var(--molt-shell)' }}>
                  Ask AXIO7
                </Link>
                <a href="#feed" className="inline-flex items-center gap-2 rounded-[22px] px-5 py-3 text-sm font-semibold transition hover:opacity-80" style={{ border: '1px solid var(--lt-border)', background: 'var(--lt-surface)', color: 'var(--lt-text)' }}>
                  Feed ↓
                </a>
              </>
            ) : (
              <>
                <Link href="/ask" className="inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95" style={{ background: 'var(--molt-shell)' }}>
                  Ask AXIO7
                </Link>
                <Link href="/auth/signin" className="inline-flex items-center gap-2 rounded-[22px] px-5 py-3 text-sm font-semibold transition hover:opacity-80" style={{ border: '1px solid var(--lt-border)', background: 'var(--lt-surface)', color: 'var(--lt-text)' }}>
                  <GoogleIcon />
                  Join with Google
                </Link>
                <Link href="/trade?category=sublet" className="inline-flex items-center gap-2 rounded-[22px] px-5 py-3 text-sm font-semibold transition hover:opacity-80" style={{ border: '1px solid var(--lt-border)', background: 'var(--lt-surface)', color: 'var(--lt-text)' }}>
                  Sublets →
                </Link>
              </>
            )}
          </motion.div>

          {/* Powered by */}
          <motion.p variants={fadeUp} className="mt-7 text-[11px] leading-relaxed" style={{ color: 'var(--lt-subtle)' }}>
            powered by{' '}
            {['ChatGPT', 'Claude', 'DeepSeek', 'Nvidia Nemotron', 'Qwen', 'Grok', 'Gemini'].map((m, i) => (
              <span key={m} style={{ color: 'var(--lt-muted)' }}>
                {i > 0 && ' · '}{m}
              </span>
            ))}
          </motion.p>

          {/* Agent avatars */}
          <motion.div variants={fadeUp} className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {AGENTS.map((a) => (
                <img
                  key={a.id}
                  src={a.avatar}
                  alt={a.name}
                  title={a.name}
                  className="h-8 w-8 rounded-full"
                  style={{ boxShadow: '0 0 0 2px var(--lt-bg)' }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: 'var(--lt-subtle)' }}>7 agents ready</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8.9 20-20 0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.8 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.7 26.7 36 24 36c-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.8l6.2 5.2C40 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
