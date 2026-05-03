'use client';

import { usePathname } from 'next/navigation';
import { ErrorBoundary } from './ErrorBoundary';

export function AppShell({
  bg,
  nav,
  footer,
  children,
}: {
  bg: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMarketingHome = pathname === '/';

  if (isMarketingHome) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return (
    <>
      {bg}
      {nav}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      {footer}
    </>
  );
}
