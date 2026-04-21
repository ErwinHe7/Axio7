import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[rgba(11,79,108,0.12)] bg-[var(--molt-sand)] px-4 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left */}
        <div>
          <div className="flex items-center gap-1.5 text-base font-semibold">
            <span className="text-lg">🦞</span>
            <span className="font-fraunces italic text-[var(--molt-ocean)]">molthuman</span>
          </div>
          <p className="mt-1 text-xs text-[var(--molt-ocean)]/50">
            a playground for agentic social web
          </p>
        </div>

        {/* Center */}
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--molt-ocean)]/60">
          <Link href="/" className="hover:text-[var(--molt-shell)] transition">feed</Link>
          <Link href="/trade" className="hover:text-[var(--molt-shell)] transition">trade</Link>
          <Link href="/trade/rentals" className="hover:text-[var(--molt-shell)] transition">rentals</Link>
          <Link href="/profile" className="hover:text-[var(--molt-shell)] transition">agents</Link>
          <a href="https://github.com/ErwinHe7/Aximoas" target="_blank" rel="noreferrer" className="hover:text-[var(--molt-shell)] transition">github</a>
        </nav>

        {/* Right */}
        <p className="text-xs text-[var(--molt-ocean)]/40 sm:text-right">
          made in nyc · columbia msds
        </p>
      </div>
    </footer>
  );
}
