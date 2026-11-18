'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Dashboard' },
  { href: '/daftar', label: 'Daftar Keputusan' },
  { href: '/impor', label: 'Impor dari Notula' },
  { href: '/riwayat', label: 'Riwayat' },
];

export default function Header() {
  const path = usePathname();
  const aktif = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <>
      <header className="rounded-b-[28px] bg-gradient-to-br from-[#7a1f2b] to-[#5c1420] px-4 pb-6 pt-5 text-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white text-sm font-extrabold text-[#7a1f2b] md:h-14 md:w-14">
                KPU
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-wide md:text-2xl">DECISION TRACKER</h1>
                <p className="text-xs opacity-85 md:text-sm">
                  Monitoring Tindak Lanjut Keputusan Rapat KPU Kabupaten Hulu Sungai Tengah
                </p>
              </div>
            </div>
            <Link
              href="/impor"
              className="hidden flex-none rounded-xl bg-white px-4 py-2.5 font-bold text-[#7a1f2b] md:block"
            >
              + Keputusan baru
            </Link>
          </div>

          <nav className="mt-5 hidden flex-wrap gap-2 md:flex">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  aktif(t.href) ? 'bg-white/20 opacity-100' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="mt-5 rounded-xl border border-[#e0b75a] bg-[#fff6dc] px-4 py-3 text-sm text-[#6b4e00] md:mt-6">
            <b>Akses publik tanpa login.</b>{' '}
            <span className="hidden md:inline">
              Jangan memasukkan data pemilih, data pribadi pegawai, atau informasi rahasia. Nama pengubah dicatat tetapi tidak diverifikasi.
            </span>
            <span className="md:hidden">Jangan isi data rahasia atau data pribadi.</span>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 text-xs font-semibold text-stone-500 md:hidden">
        <Link href="/" className={aktif('/') ? 'text-[#7a1f2b]' : ''}>Dashboard</Link>
        <Link href="/daftar" className={aktif('/daftar') ? 'text-[#7a1f2b]' : ''}>Daftar</Link>
        <Link
          href="/impor"
          aria-label="Keputusan baru"
          className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-[#7a1f2b] text-3xl font-normal text-white shadow-lg"
        >
          +
        </Link>
        <Link href="/impor" className={aktif('/impor') ? 'text-[#7a1f2b]' : ''}>Impor</Link>
        <Link href="/riwayat" className={aktif('/riwayat') ? 'text-[#7a1f2b]' : ''}>Riwayat</Link>
      </nav>
    </>
  );
}
