import Link from 'next/link';
import Image from 'next/image';
import { Home, ShoppingBag, Sparkles, User, LogIn, LogOut } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          Aximoas
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/" icon={<Home className="h-4 w-4" />} label="Feed" />
          <NavLink href="/trade" icon={<ShoppingBag className="h-4 w-4" />} label="Trade" />
          <NavLink href="/profile" icon={<User className="h-4 w-4" />} label="Me" />
          {user.authenticated ? <UserChip user={user} /> : <SignInButton />}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-surface-alt hover:text-ink"
    >
      {icon}
      {label}
    </Link>
  );
}

function SignInButton() {
  return (
    <Link
      href="/auth/signin"
      className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ink/90"
    >
      <LogIn className="h-3.5 w-3.5" />
      Sign in
    </Link>
  );
}

function UserChip({ user }: { user: { name: string; avatar: string | null } }) {
  return (
    <div className="ml-1 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
      ) : (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs text-ink-muted">
          {(user.name?.[0] ?? 'U').toUpperCase()}
        </span>
      )}
      <span className="max-w-[8rem] truncate text-xs font-medium">{user.name}</span>
      <a
        href="/auth/signout"
        title="Sign out"
        className="ml-0.5 rounded p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
      >
        <LogOut className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
