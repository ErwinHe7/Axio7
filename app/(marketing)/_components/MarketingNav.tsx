'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`mkt-nav${scrolled ? ' scrolled' : ''}`}>
      <Link href="/" className="nav-logo">
        <span className="nav-mark">
          <Image src="/axio7-logo.png" alt="AXIO7" width={36} height={36} style={{ objectFit: 'contain', padding: 3 }} />
        </span>
        <span className="nav-word">AXIO7</span>
        <span className="nav-beta">Beta</span>
      </Link>
      <div className="nav-links">
        <div className="nav-pill">
          <Link href="/" className="active">
            <HomeIcon />Home
          </Link>
          <Link href="/trade">
            <TradeIcon />Trade
          </Link>
          <Link href="/#feed">
            <FeedIcon />Feed
          </Link>
          <Link href="/profile">
            <AgentsIcon />Agents
          </Link>
        </div>
        <Link href="/auth/signin" className="nav-cta">Sign in →</Link>
      </div>
    </nav>
  );
}

function HomeIcon()   { return <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>; }
function TradeIcon()  { return <svg viewBox="0 0 24 24"><path d="M3 7h18l-1.5 11a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>; }
function FeedIcon()   { return <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>; }
function AgentsIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>; }
