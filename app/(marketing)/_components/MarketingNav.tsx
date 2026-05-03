'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const NAV_ITEMS = [
  { href: '/', sec: 'hero', label: 'Home', icon: <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg> },
  { href: '/housing', sec: '', label: 'Find Housing', icon: <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg> },
  { href: '/housing/post-sublet', sec: '', label: 'Post Sublet', icon: <svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg> },
  { href: '/housing/neighborhoods', sec: '', label: 'Neighborhoods', icon: <svg viewBox="0 0 24 24"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg> },
  { href: '/inbox', sec: '', label: 'Message', icon: <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg> },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const ids = ['hero', 'agents', 'demo', 'feed'];
      const current = ids.findLast(id => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top <= 120 : false;
      });
      if (current) setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`r-nav${scrolled ? ' scrolled' : ''}`}>
      <Link href="/" className="nav-logo" aria-label="AXIO7 home">
        <span className="nav-mark">
          <Image src="/axio7-logo.png" alt="AXIO7" width={36} height={36} priority />
        </span>
        <span className="nav-word">AXIO7</span>
        <span className="nav-beta">BETA</span>
      </Link>

      <div className="nav-links">
        <div className="nav-pill" aria-label="Marketing navigation">
          {NAV_ITEMS.map(item => {
            const isActive = item.sec ? active === item.sec : false;
            return (
              <a key={item.label} href={item.href} className={isActive ? 'active' : undefined}>
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </div>
        <Link href="/auth/signin" className="nav-cta">Sign in →</Link>
      </div>
    </nav>
  );
}
