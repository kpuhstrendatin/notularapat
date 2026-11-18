import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Decision Tracker · KPU Kab. Hulu Sungai Tengah' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-stone-100 text-stone-900">
        <header className="bg-maroon text-white">
          <div className="mx-auto flex max-w-5xl items-center gap-6 p-4">
            <strong className="tracking-wide">DECISION TRACKER</strong>
            <nav className="flex gap-4 text-sm">
              <a href="/">Dashboard</a>
              <a href="/impor">Impor dari Notula</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl space-y-4 p-4">{children}</main>
      </body>
    </html>
  );
}
