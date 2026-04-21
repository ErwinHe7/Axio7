import Link from 'next/link';
import { Home, ShoppingBag, Sparkles, User, LogIn, LogOut } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Aximoas
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/"       icon={<Home className="h-4 w-4" />}        label="Feed"    />
          <NavLink href="/trade"  icon={<ShoppingBag className="h-4 w-4" />} label="Trade"   />
          <NavLink href="/profile" icon={<User className="h-4 w-4" />}       label="Profile" />

          {user.authenticated ? (
            <UserChip user={user} />
          ) : (
            <Link
              href="/auth/signin"
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function UserChip({ user }: { user: { name: string; avatar: string | null } }) {
  return (
    <div className="ml-1 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm">
      {user.avatar ? (
        <img src={user.avatar} alt="" className="h-6 w-6 rounded-full ring-1 ring-slate-200" />
      ) : (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-[11px] font-bold text-white">
          {(user.name?.[0] ?? 'U').toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-[7rem] truncate text-xs font-medium sm:block">{user.name}</span>
      <a
        href="/auth/signout"
        title="Sign out"
        className="rounded p-0.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink"
      >
        <LogOut className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
