'use client';

import { useState } from 'react';
import Ikon from './Ikon';
import type { Decision } from '@/lib/types';

type Baca = { nama: string; at: string };

const inisial = (n: string) =>
  n
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

const waktu = (at: string) =>
  new Date(at).toLocaleString('id-ID', { timeZone: 'Asia/Makassar', dateStyle: 'short', timeStyle: 'short' });

// Satu pesan Perhatian Bersama: teks tegas, progres bacaan, dan lingkaran inisial pegawai
export default function PesanBersama({
  d,
  nomor,
  sudah,
  pengubah,
  oleh,
  onBaca,
}: {
  d: Decision;
  nomor: number;
  sudah: Baca[];
  pengubah: string[];
  oleh: string;
  onBaca: (id: string) => void;
}) {
  const [lihat, setLihat] = useState(false);

  const namaSudah = sudah.map((x) => x.nama);
  const total = pengubah.length;
  const pct = total ? Math.round((namaSudah.length / total) * 100) : 0;
  const sudahSaya = !!oleh && namaSudah.includes(oleh);

  // Yang sudah membaca di depan, lalu urut abjad
  const urutan = [...pengubah].sort(
    (a, b) => Number(namaSudah.includes(b)) - Number(namaSudah.includes(a)) || a.localeCompare(b),
  );
  const belum = pengubah.filter((n) => !namaSudah.includes(n)).sort((a, b) => a.localeCompare(b));

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-red-600 text-sm font-black text-white">
            {nomor}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-snug text-red-800">{d.isi}</p>
            {d.pic && (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-stone-600">
                <Ikon nama="orang" className="h-4 w-4" /> {d.pic}
              </p>
            )}
          </div>
        </div>

        <div className="flex-none">
          {sudahSaya ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
              <Ikon nama="cek" className="h-4 w-4" /> Anda sudah membaca
            </span>
          ) : (
            <button
              onClick={() => onBaca(d.id)}
              className="rounded-xl bg-gradient-to-r from-red-700 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Sudah saya baca
            </button>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-stone-700">
            {namaSudah.length} dari {total} pegawai sudah membaca
          </span>
          <span className="font-bold text-emerald-700">{pct}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {urutan.map((n) => {
          const ok = namaSudah.includes(n);
          return (
            <span
              key={n}
              title={n + (ok ? ' — sudah membaca' : ' — belum membaca')}
              className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${
                ok ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-400 ring-1 ring-stone-200'
              }`}
            >
              {inisial(n)}
            </span>
          );
        })}
      </div>

      <button
        onClick={() => setLihat(!lihat)}
        className="mt-3 text-sm font-semibold text-red-700 hover:underline"
      >
        {lihat ? 'Sembunyikan daftar' : 'Lihat siapa saja'}
      </button>

      {lihat && (
        <div className="mt-3 grid gap-4 rounded-xl bg-stone-50 p-4 text-sm md:grid-cols-2">
          <div>
            <div className="mb-2 font-bold text-emerald-700">Sudah membaca ({namaSudah.length})</div>
            <ul className="space-y-1.5">
              {[...sudah]
                .sort((x, y) => y.at.localeCompare(x.at))
                .map((x) => (
                  <li key={x.nama} className="flex justify-between gap-3">
                    <span className="font-medium text-stone-800">{x.nama}</span>
                    <span className="text-xs text-stone-500">{waktu(x.at)}</span>
                  </li>
                ))}
              {namaSudah.length === 0 && <li className="text-stone-500">Belum ada</li>}
            </ul>
          </div>
          <div>
            <div className="mb-2 font-bold text-stone-600">Belum membaca ({belum.length})</div>
            <ul className="space-y-1.5">
              {belum.map((n) => (
                <li key={n} className="text-stone-700">
                  {n}
                </li>
              ))}
              {belum.length === 0 && <li className="text-stone-500">Semua sudah membaca</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
