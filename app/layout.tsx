import './globals.css';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });
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
      <body className={`${font.className} min-h-screen bg-[#f3eeee] text-stone-900 antialiased`}>
        <Header />
        <PopupHost />
        <ToastHost />
        <main className="mx-auto max-w-6xl space-y-4 px-4 pb-28 pt-5 md:px-6">{children}</main>
      </body>
    </html>
  );
}
