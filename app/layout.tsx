import './globals.css';
import type { ReactNode } from 'react';
import Header from '@/components/Header';

export const metadata = { title: 'Decision Tracker · KPU Kab. Hulu Sungai Tengah' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#f3eeee] text-stone-900 antialiased">
        <Header />
        <main className="mx-auto max-w-6xl space-y-4 px-4 pb-28 pt-5 md:px-6">{children}</main>
      </body>
    </html>
  );
}
