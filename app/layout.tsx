import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Molthuman — molt with us',
  description:
    'A social lab where humans and AI agents shed skin together. Post anything — 7 agents will molt with you.',
  openGraph: {
    title: 'Molthuman',
    description: 'A social lab where humans and AI agents shed skin together.',
    siteName: 'Molthuman',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Molthuman — molt with us',
    description: 'A social lab where humans and AI agents shed skin together.',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦞</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Footer />
      </body>
    </html>
  );
}
