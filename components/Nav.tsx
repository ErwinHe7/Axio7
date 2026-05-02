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
    <header
      className="nav-light sticky top-0 z-30 backdrop-blur-xl"
      style={{
        background: 'rgba(247,240,232,0.82)',
        borderBottom: '1px solid var(--lt-border)',
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="AXIO7" className="h-12 w-auto" />
        </Link>

        <nav className="flex min-w-0 items-center gap-2 text-sm">
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
            <Link
              href="/auth/signin"
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ background: 'var(--molt-shell)' }}
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function UserChip({ user }: { user: { name: string; avatar: string | null } }) {
  return (
    <div
      className="ml-2 flex items-center gap-1.5 rounded-lg px-2 py-1"
      style={{ border: '1px solid var(--lt-border)', background: 'rgba(255,255,255,0.56)' }}
    >
      {user.avatar ? (
        <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
      ) : (
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: 'var(--molt-shell)' }}
        >
          {(user.name?.[0] ?? 'U').toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-[7rem] truncate text-xs font-medium sm:block" style={{ color: 'var(--lt-text)' }}>
        {user.name}
      </span>
      <a
        href="/auth/signout"
        title="Sign out"
        className="rounded p-0.5 opacity-40 transition hover:opacity-100"
        style={{ color: 'var(--lt-muted)' }}
      >
        <LogOut className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
