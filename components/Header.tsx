'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Ikon from './Ikon';

const TABS = [
  { href: '/', label: 'Dashboard', icon: 'grid' },
  { href: '/daftar', label: 'Daftar Keputusan', icon: 'daftar' },
  { href: '/impor', label: 'Impor dari Notula', icon: 'dokumen' },
  { href: '/riwayat', label: 'Riwayat', icon: 'riwayat' },
  { href: '/laporan', label: 'Laporan', icon: 'notula' },
  { href: '/panduan', label: 'Panduan', icon: 'dokumen' },
];

// Logo dari /public/logo-kpu.png. Kalau file belum ada, tampil teks KPU.
function Logo() {
  const [gagal, setGagal] = useState(false);
  if (gagal) {
    return (
      <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white text-sm font-extrabold text-[#7a1f2b] shadow-lg md:h-14 md:w-14">
        KPU
      </div>
    );
  }
  return (
    <img
      src="/logo-kpu.png"
      alt="Logo KPU"
      onError={() => setGagal(true)}
      className="h-12 w-12 flex-none rounded-full bg-white object-contain p-1 shadow-lg md:h-14 md:w-14"
    />
  );
}

export default function Header() {
  const path = usePathname();
  const aktif = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <>
      <header className="print:hidden relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#8a2633] via-[#7a1f2b] to-[#4a1219] px-4 pb-7 pt-6 text-white shadow-xl md:px-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <Logo />
              <div>
                <h1 className="text-lg font-extrabold tracking-wide md:text-2xl">DECISION TRACKER</h1>
                <p className="text-xs text-white/80 md:text-sm">
                  Monitoring Tindak Lanjut Keputusan Rapat KPU Kabupaten Hulu Sungai Tengah
                </p>
              </div>
            </div>
            <Link
              href="/impor"
              className="hidden items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#7a1f2b] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl md:inline-flex"
            >
              <Ikon nama="tambah" className="h-4 w-4" /> Keputusan baru
            </Link>
          </div>

          <nav className="mt-6 hidden flex-wrap gap-1.5 rounded-2xl bg-black/15 p-1.5 md:inline-flex">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  aktif(t.href) ? 'bg-white text-[#7a1f2b] shadow-md' : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <Ikon nama={t.icon} className="h-4 w-4" />
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-md">
            <Ikon nama="peringatan" className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
            <div>
              <b>Akses publik tanpa login.</b>{' '}
              <span className="hidden md:inline">
                Jangan memasukkan data pemilih, data pribadi pegawai, atau informasi rahasia. Nama pengubah dicatat tetapi tidak diverifikasi.
              </span>
              <span className="md:hidden">Jangan isi data rahasia atau data pribadi.</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="print:hidden fixed inset-x-2 bottom-2 z-20 flex items-end rounded-2xl border border-stone-200 bg-white/95 px-1 pb-1.5 pt-1.5 text-[10px] font-semibold text-stone-500 shadow-2xl backdrop-blur md:hidden">
        <div className="flex flex-1 justify-around">
          {[
            { href: '/', label: 'Dashboard', icon: 'grid' },
            { href: '/daftar', label: 'Daftar', icon: 'daftar' },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex min-w-[48px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 ${aktif(t.href) ? 'text-[#7a1f2b]' : ''}`}
            >
              <Ikon nama={t.icon} className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </div>

        <Link
          href="/impor"
          aria-label="Keputusan baru"
          className="-mt-7 mx-1 grid h-14 w-14 flex-none place-items-center rounded-full bg-gradient-to-br from-[#8a2633] to-[#5c1420] text-white shadow-xl ring-4 ring-[#f3eeee]"
        >
          <Ikon nama="tambah" className="h-6 w-6" />
        </Link>

        <div className="flex flex-1 justify-around">
          {[
            { href: '/laporan', label: 'Laporan', icon: 'notula' },
            { href: '/riwayat', label: 'Riwayat', icon: 'riwayat' },
            { href: '/panduan', label: 'Panduan', icon: 'dokumen' },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex min-w-[48px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 ${aktif(t.href) ? 'text-[#7a1f2b]' : ''}`}
            >
              <Ikon nama={t.icon} className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
