'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, House, Map, MessageSquare, User, Users } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
  { href: '/housing', label: 'Find Housing', icon: House, match: (path: string) => path === '/housing' || path.startsWith('/housing/listings') || path.startsWith('/housing/matches') || path.startsWith('/housing/saved') },
  { href: '/housing/post-sublet', label: 'Post Sublet', icon: House, match: (path: string) => path.startsWith('/housing/post-sublet') },
  { href: '/housing/roommates', label: 'Roommates', icon: Users, match: (path: string) => path.startsWith('/housing/roommates') },
  { href: '/housing/neighborhoods', label: 'Neighborhoods', icon: Map, match: (path: string) => path.startsWith('/housing/neighborhoods') },
  { href: '/inbox', label: 'Message', icon: MessageSquare, match: (path: string) => path.startsWith('/inbox') || path.startsWith('/messages') },
  { href: '/profile', label: 'Profile', icon: User, match: (path: string) => path.startsWith('/profile') },
];

export function NavTabs({ unreadMessages }: { unreadMessages: number }) {
  const pathname = usePathname() || '/';

  return (
    <div aria-label="Primary navigation" className="app-nav-tabs">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`app-nav-tab${active ? ' active' : ''}`}
          >
            <span className="relative inline-flex">
              <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={active ? 2.6 : 2.1} />
              {tab.href === '/inbox' && unreadMessages > 0 && (
                <span className="app-nav-badge">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
