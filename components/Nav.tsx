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
    <header className="r-nav scrolled">
      <Link href="/" className="nav-logo" aria-label="AXIO7 home">
        <span className="nav-mark">
          <img src="/axio7-logo.png" alt="AXIO7" />
        </span>
        <span className="nav-word">AXIO7</span>
        <span className="nav-beta">BETA</span>
      </Link>

      <nav className="nav-links">
        <NavTabs unreadMessages={unreadMessages} />

        {admin && (
          <Link href="/admin/agents" className="nav-admin-link" title="Admin">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}

        <BellButton authenticated={user.authenticated} />

        {user.authenticated ? (
          <UserChip user={user} />
        ) : (
          <Link href="/auth/signin" className="nav-cta">
            <LogIn className="h-4 w-4" /> Sign in -&gt;
          </Link>
        )}
      </nav>
    </header>
  );
}

function UserChip({ user }: { user: { name: string; avatar: string | null } }) {
  return (
    <div className="nav-user-chip">
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
