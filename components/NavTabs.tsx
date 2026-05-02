'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, ShoppingBag, User } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
  { href: '/trade', label: 'Trade', icon: ShoppingBag, match: (path: string) => path.startsWith('/trade') },
  { href: '/inbox', label: 'Messages', icon: MessageSquare, match: (path: string) => path.startsWith('/inbox') },
  { href: '/profile', label: 'Profile', icon: User, match: (path: string) => path.startsWith('/profile') },
];

export function NavTabs({ unreadMessages }: { unreadMessages: number }) {
  const pathname = usePathname() || '/';

  return (
    <div
      aria-label="Primary navigation"
      className="flex min-w-0 items-center gap-1 rounded-xl border p-1 shadow-sm"
      style={{
        background: 'rgba(255,255,255,0.64)',
        borderColor: 'rgba(154,100,15,0.16)',
      }}
    >
      {tabs.map((tab, index) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;

        return (
          <div key={tab.href} className="flex items-center gap-1">
            <Link
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className="relative inline-flex min-h-9 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition hover:-translate-y-px hover:shadow-sm sm:px-3.5 sm:text-sm"
              style={{
                color: active ? '#8A4B0F' : 'var(--lt-muted)',
                background: active
                  ? 'linear-gradient(180deg, rgba(217,119,6,0.18), rgba(217,119,6,0.08))'
                  : 'transparent',
                borderColor: active ? 'rgba(154,100,15,0.30)' : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.65)' : 'none',
              }}
            >
              <span className="relative inline-flex">
                <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 2} />
                {tab.href === '/inbox' && unreadMessages > 0 && (
                  <span
                    className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                    style={{ background: 'var(--molt-shell)' }}
                  >
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
            {index < tabs.length - 1 && (
              <span aria-hidden className="hidden h-5 w-px sm:block" style={{ background: 'rgba(154,100,15,0.16)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
