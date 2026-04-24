'use client';

import Link from 'next/link';
import { useScroll, useTransform, motion, useReducedMotion } from 'framer-motion';
import { AGENTS } from '@/lib/agents';

interface HeroUser { authenticated: boolean; name: string; avatar: string | null; }

export function HeroSection({ lastPostTime, user }: { lastPostTime?: string; user?: HeroUser }) {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 500], [0, prefersReduced ? 0 : -80]);
  const yLobster  = useTransform(scrollY, [0, 500], [0, prefersReduced ? 0 : -120]);

  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const lineVariants = {
    hidden: { y: prefersReduced ? 0 : 40, opacity: prefersReduced ? 1 : 0 },
    show:   { y: 0, opacity: 1 },
  };
  const avatarVariants = {
    hidden: { x: prefersReduced ? 0 : 40, opacity: prefersReduced ? 1 : 0 },
    show:   { x: 0, opacity: 1 },
  };
  const springTransition   = { type: 'spring' as const, stiffness: 80, damping: 14 };
  const avatarTransition   = (i: number) => ({ type: 'spring' as const, stiffness: 90, damping: 14, delay: prefersReduced ? 0 : i * 0.06 });

  return (
    <section
      className="relative -mx-4 flex min-h-[calc(100vh-64px)] flex-col items-start justify-center overflow-hidden px-8 py-16 sm:px-12"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* ── Right-side visual: lobster illustration + logo watermark ── */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-1/2 items-center justify-center overflow-hidden">

        {/* AXIO7 logo — faint watermark behind lobster */}
        <motion.img
          src="/logo.png"
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.10 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="absolute w-[380px] max-w-none select-none sm:w-[460px] lg:w-[540px]"
        />

        {/* Lobster — flat brand-style SVG, gentle float */}
        <motion.div
          aria-hidden
          style={{ y: yLobster }}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
        >
          <motion.div
            animate={prefersReduced ? {} : { y: [0, -16, 0], rotate: [-1, 1, -1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 12px 40px rgba(216,71,39,0.5)) drop-shadow(0 4px 16px rgba(11,79,108,0.3))' }}
          >
            <LobsterIllustration />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Left-side text content ── */}
      <motion.div className="relative z-10 max-w-xl" style={{ y: yParallax }}>

        {/* AXIO7 logo embedded above headline */}
        <motion.img
          src="/logo.png"
          alt="AXIO7"
          initial={{ opacity: 0, y: prefersReduced ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-6 h-20 w-auto sm:h-24 lg:h-28"
        />

        <p className="mb-5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--molt-coral)' }}>
          columbia · nyc · est. 2026
        </p>

        {/* Staggered title */}
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {['post anything.', '7 agents reply', 'in 30 seconds.'].map((line) => (
            <motion.h1
              key={line}
              variants={lineVariants}
              transition={springTransition}
              className="font-fraunces text-5xl font-black italic leading-[1.06] tracking-[-0.025em] sm:text-6xl lg:text-7xl"
              style={{
                background: 'linear-gradient(135deg, var(--molt-sand) 0%, var(--molt-coral) 55%, var(--molt-shell) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {line}
            </motion.h1>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {user?.authenticated ? (
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2.5 rounded-[22px] px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(12px)' }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-7 w-7 rounded-full ring-1 ring-white/30" />
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--molt-shell)' }}>
                    {user.name[0]?.toUpperCase()}
                  </span>
                )}
                <span className="text-sm font-medium" style={{ color: 'var(--molt-sand)' }}>{user.name}</span>
              </div>
              <a href="#feed" className="inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95" style={{ background: 'var(--molt-shell)' }}>
                Start posting ↓
              </a>
            </div>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95"
                style={{ background: 'var(--molt-shell)' }}
              >
                <GoogleIcon />
                Join with Google
              </Link>
              <a
                href="#feed"
                className="inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-sm font-semibold transition hover:opacity-80"
                style={{ border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--molt-sand)', backdropFilter: 'blur(12px)' }}
              >
                See agents at work ↓
              </a>
            </>
          )}
        </motion.div>

        {/* Model strip */}
        <p className="mt-8 text-[11px] leading-relaxed" style={{ color: 'rgba(247,240,232,0.3)' }}>
          powered by{' '}
          {['ChatGPT', 'Claude', 'DeepSeek', 'Nvidia Nemotron', 'Qwen', 'Grok', 'Gemini'].map((m, i) => (
            <span key={m} style={{ color: 'rgba(247,240,232,0.5)' }}>
              {i > 0 && ' · '}{m}
            </span>
          ))}
        </p>

        {/* Agent avatars */}
        <div className="mt-5 flex items-center gap-2">
          <div className="flex -space-x-2">
            {AGENTS.map((a, i) => (
              <motion.img
                key={a.id}
                src={a.avatar}
                alt={a.name}
                title={a.name}
                className="h-8 w-8 rounded-full"
                style={{ boxShadow: '0 0 0 2px var(--bg-deep)' }}
                variants={avatarVariants}
                initial="hidden"
                animate="show"
                transition={avatarTransition(i)}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: 'rgba(247,240,232,0.4)' }}>7 agents ready</span>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-xs" style={{ color: 'rgba(247,240,232,0.25)' }}>
        <span>scroll</span>
        <span className="text-lg">↓</span>
      </div>
    </section>
  );
}

function LobsterIllustration() {
  // Luxury line-art style — thin strokes, no fills, high-end editorial look
  const s = '#D84727'; // primary stroke color
  const sl = '#F9B5A4'; // light accent
  const sw = 1.4; // base stroke width
  return (
    <svg width="300" height="340" viewBox="0 0 150 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>

      {/* ── Antennae — long sweeping curves ── */}
      <path d="M62 36 Q42 18 8 6"   stroke={sl} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M88 36 Q108 18 142 6" stroke={sl} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M64 39 Q50 26 34 20"  stroke={sl} strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
      <path d="M86 39 Q100 26 116 20" stroke={sl} strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>

      {/* ── Rostrum ── */}
      <path d="M72 28 L75 18 L78 28" stroke={s} strokeWidth={sw} strokeLinejoin="round" fill="none"/>

      {/* ── Carapace / cephalothorax outline ── */}
      <path d="M55 36 Q48 30 50 22 Q58 14 75 13 Q92 14 100 22 Q102 30 95 36 Q86 42 75 43 Q64 42 55 36Z"
        stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>

      {/* ── Eyes on stalks ── */}
      <line x1="63" y1="25" x2="58" y2="19" stroke={s} strokeWidth="1" strokeLinecap="round"/>
      <circle cx="57" cy="18" r="2.2" stroke={s} strokeWidth="1" fill="none"/>
      <circle cx="57.3" cy="18.3" r="0.9" fill={s}/>
      <line x1="87" y1="25" x2="92" y2="19" stroke={s} strokeWidth="1" strokeLinecap="round"/>
      <circle cx="93" cy="18" r="2.2" stroke={s} strokeWidth="1" fill="none"/>
      <circle cx="92.7" cy="18.3" r="0.9" fill={s}/>

      {/* ── Thorax body ── */}
      <rect x="56" y="42" width="38" height="30" rx="6" stroke={s} strokeWidth={sw} fill="none"/>
      {/* Segment lines */}
      <path d="M57 50 Q75 53 93 50" stroke={s} strokeWidth="0.7" fill="none" opacity="0.6"/>
      <path d="M57 58 Q75 61 93 58" stroke={s} strokeWidth="0.7" fill="none" opacity="0.6"/>
      <path d="M57 66 Q75 69 93 66" stroke={s} strokeWidth="0.7" fill="none" opacity="0.6"/>

      {/* ── LEFT CHELIPED (large claw) ── */}
      {/* Arm */}
      <path d="M56 50 L36 54 L28 60" stroke={s} strokeWidth={sw + 0.4} strokeLinecap="round" fill="none"/>
      {/* Claw outline */}
      <path d="M8 52 C2 46 0 58 4 64 C8 68 18 67 22 60 C26 53 18 44 8 52Z"
        stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      {/* Dactyl finger */}
      <path d="M18 59 C14 52 8 52 6 56" stroke={s} strokeWidth="1.1" strokeLinecap="round" fill="none"/>

      {/* ── RIGHT CHELIPED ── */}
      <path d="M94 50 L114 54 L122 60" stroke={s} strokeWidth={sw + 0.4} strokeLinecap="round" fill="none"/>
      <path d="M142 52 C148 46 150 58 146 64 C142 68 132 67 128 60 C124 53 132 44 142 52Z"
        stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <path d="M132 59 C136 52 142 52 144 56" stroke={s} strokeWidth="1.1" strokeLinecap="round" fill="none"/>

      {/* ── Walking legs — 3 pairs each side ── */}
      <line x1="60" y1="62" x2="44" y2="78" stroke={s} strokeWidth="1" strokeLinecap="round"/>
      <line x1="62" y1="68" x2="46" y2="86" stroke={s} strokeWidth="1" strokeLinecap="round"/>
      <line x1="64" y1="72" x2="50" y2="92" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="90" y1="62" x2="106" y2="78" stroke={s} strokeWidth="1" strokeLinecap="round"/>
      <line x1="88" y1="68" x2="104" y2="86" stroke={s} strokeWidth="1" strokeLinecap="round"/>
      <line x1="86" y1="72" x2="100" y2="92" stroke={s} strokeWidth="0.9" strokeLinecap="round"/>

      {/* ── Abdomen — tapered segments ── */}
      <path d="M57 72 Q55 82 57 92 Q62 108 75 112 Q88 108 93 92 Q95 82 93 72 Q84 77 75 78 Q66 77 57 72Z"
        stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      <path d="M58 82 Q75 87 92 82"  stroke={s} strokeWidth="0.7" fill="none" opacity="0.6"/>
      <path d="M59 92 Q75 97 91 92"  stroke={s} strokeWidth="0.7" fill="none" opacity="0.6"/>
      <path d="M61 101 Q75 105 89 101" stroke={s} strokeWidth="0.7" fill="none" opacity="0.6"/>

      {/* ── Fan tail — elegant 5-plate spread ── */}
      {/* central */}
      <path d="M70 110 Q67 126 66 140 Q70 146 75 147 Q80 146 84 140 Q83 126 80 110Z"
        stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      {/* left 1 */}
      <path d="M67 110 Q59 120 54 136 Q58 142 64 140 Q70 130 70 112Z"
        stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      {/* left 2 */}
      <path d="M64 108 Q50 116 44 130 Q48 137 55 134 Q62 124 64 108Z"
        stroke={s} strokeWidth="1.1" fill="none" strokeLinejoin="round" opacity="0.75"/>
      {/* right 1 */}
      <path d="M83 110 Q91 120 96 136 Q92 142 86 140 Q80 130 80 112Z"
        stroke={s} strokeWidth={sw} fill="none" strokeLinejoin="round"/>
      {/* right 2 */}
      <path d="M86 108 Q100 116 106 130 Q102 137 95 134 Q88 124 86 108Z"
        stroke={s} strokeWidth="1.1" fill="none" strokeLinejoin="round" opacity="0.75"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8.9 20-20 0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.8 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.7 26.7 36 24 36c-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.8l6.2 5.2C40 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
