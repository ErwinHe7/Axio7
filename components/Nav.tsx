import Link from 'next/link';
import { LogIn, LogOut, Settings } from 'lucide-react';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getUnreadMessageCount } from '@/lib/store';
import { BellButton } from './BellButton';
import { NavTabs } from './NavTabs';

export async function Nav() {
  const user = await getCurrentUser();
  const [unreadMessages, admin] = await Promise.all([
    user.authenticated ? getUnreadMessageCount(user.id).catch(() => 0) : Promise.resolve(0),
    Promise.resolve(isAdmin(user)),
  ]);

  return (
    <header className="app-topbar sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link href="/" className="app-topbar-logo">
          <span className="app-topbar-mark">
            <img src="/axio7-logo.png" alt="AXIO7" />
          </span>
          <span className="hidden font-mono text-sm font-black tracking-[0.18em] text-white sm:inline">AXIO7</span>
        </Link>

        <nav className="flex min-w-0 items-center gap-3 text-sm">
          <NavTabs unreadMessages={unreadMessages} />

          {/* Admin link — only visible to site owner */}
          {admin && (
            <Link
              href="/admin/agents"
              className="nav-item group relative inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
              title="Admin"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
              <span
                className="absolute bottom-0.5 left-1/2 h-px w-4/5 origin-center -translate-x-1/2 scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                style={{ background: 'var(--molt-shell)' }}
              />
            </Link>
          )}

          <BellButton authenticated={user.authenticated} />

          {user.authenticated ? (
            <UserChip user={user} />
          ) : (
            <Link href="/auth/signin" className="app-signin-btn">
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function UserChip({ user }: { user: { name: string; avatar: string | null } }) {
  return (
    <div className="ml-2 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-1.5 shadow-[0_0_20px_rgba(255,62,197,0.12)] backdrop-blur-xl">
      {user.avatar ? (
        <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
      ) : (
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg,var(--r-pink),var(--r-violet))' }}
        >
          {(user.name?.[0] ?? 'U').toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-[7rem] truncate text-xs font-medium text-white/85 sm:block">
        {user.name}
      </span>
      <a
        href="/auth/signout"
        title="Sign out"
        className="rounded p-0.5 text-white/45 transition hover:text-white"
      >
        <LogOut className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
