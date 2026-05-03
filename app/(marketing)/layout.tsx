import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AXIO7 — Columbia & NYC, answered by agents',
  description: 'Sublets, events, roommates, NYC intel — without digging through 20 group chats. Seven AI models. One feed.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
