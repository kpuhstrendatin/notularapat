import './globals.css';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import PopupHost, { ToastHost } from '@/components/Popup';

const JUDUL = 'Decision Tracker · KPU Kab. Hulu Sungai Tengah';
const DESKRIPSI = 'Pantau tindak lanjut keputusan rapat KPU Kab. Hulu Sungai Tengah: progres, tenggat, dan perhatian bersama untuk seluruh pegawai.';

export const metadata = {
  metadataBase: new URL('https://decision-tracker-kpuhst.vercel.app'),
  title: JUDUL,
  description: DESKRIPSI,
  openGraph: {
    title: JUDUL,
    description: DESKRIPSI,
    url: 'https://decision-tracker-kpuhst.vercel.app',
    siteName: 'Decision Tracker KPU HST',
    locale: 'id_ID',
    type: 'website',
    images: [{ url: '/og-banner.jpg', width: 1200, height: 630, alt: 'Decision Tracker KPU Kab. Hulu Sungai Tengah' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: JUDUL,
    description: DESKRIPSI,
    images: ['/og-banner.jpg'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif' }} className="min-h-screen bg-[#f3eeee] text-stone-900 antialiased">
        <Header />
        <PopupHost />
        <ToastHost />
        <main className="mx-auto max-w-6xl space-y-4 px-4 pb-28 pt-5 md:px-6">{children}</main>
      </body>
    </html>
  );
}
