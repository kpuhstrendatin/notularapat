'use client';

import { useEffect, useState } from 'react';
import { SUBBAG, LBL, hariIni, isLate, type Decision, type Status } from '@/lib/types';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmt = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d} ${MON[+m - 1]} ${y}`;
};
const tambahHari = (n: number) => {
  const d = new Date(hariIni() + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
};

const WARNA: Record<Status, string> = {
  belum: '#8c8587',
  sedang: '#2f5fa8',
  menunggu: '#c0702a',
  selesai: '#3a7a5a',
};
const PILL: Record<Status | 'terlambat' | 'mendesak', string> = {
  belum: 'bg-stone-200 text-stone-700',
  sedang: 'bg-blue-100 text-blue-900',
  menunggu: 'bg-orange-100 text-orange-900',
  selesai: 'bg-green-100 text-green-900',
  terlambat: 'bg-red-100 text-red-800',
  mendesak: 'bg-amber-100 text-amber-900',
};

function Pill({ d }: { d: Decision }) {
  if (isLate(d)) return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PILL.terlambat}`}>Terlambat</span>;
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PILL[d.status]}`}>{LBL[d.status]}</span>;
}

export default function Dashboard() {
  const [rows, setRows] = useState<Decision[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/decisions', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? 'Gagal memuat');
        return j as Decision[];
      })
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Kesalahan tidak diketahui'));
  }, []);

  if (err) return <p className="rounded-2xl bg-white p-4 text-red-700 shadow-sm">Gagal memuat data: {err}</p>;
  if (!rows) return <p className="rounded-2xl bg-white p-4 text-stone-500 shadow-sm">Memuat data…</p>;

  const total = rows.length;
  const cnt = (s: Status) => rows.filter((d) => d.status === s).length;
  const nLate = rows.filter(isLate).length;
  const selesai = cnt('selesai');
  const pct = total ? Math.round((selesai / total) * 100) : 0;

  const kpi: { label: string; nilai: string | number; warna: string }[] = [
    { label: 'Total keputusan', nilai: total, warna: 'text-stone-900' },
    { label: 'Belum dikerjakan', nilai: cnt('belum'), warna: 'text-stone-600' },
    { label: 'Sedang dikerjakan', nilai: cnt('sedang'), warna: 'text-[#2f5fa8]' },
    { label: 'Selesai', nilai: selesai, warna: 'text-[#3a7a5a]' },
    { label: 'Terlambat', nilai: nLate, warna: 'text-[#b3261e]' },
    { label: 'Penyelesaian', nilai: `${pct}%`, warna: 'text-[#7a1f2b]' },
  ];

  const bar: Status[] = ['belum', 'sedang', 'menunggu', 'selesai'];

  const terbaru = rows.slice(0, 5);

  const late = rows.filter(isLate).slice(0, 3);
  const batas = tambahHari(3);
  const mendesak = rows
    .filter((d) => d.status !== 'selesai' && !isLate(d) && d.tenggat <= batas)
    .slice(0, 2);

  const perSubbag = SUBBAG.map((s) => {
    const items = rows.filter((d) => d.subbag === s);
    const done = items.filter((d) => d.status === 'selesai').length;
    return { s, n: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  }).filter((x) => x.n > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {kpi.map((k) => (
          <div key={k.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-stone-500">{k.label}</p>
            <p className={`mt-1 text-3xl font-extrabold ${k.warna}`}>{k.nilai}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold">Progres tindak lanjut</h2>
        <div className="mt-3 flex h-3.5 overflow-hidden rounded-full bg-stone-200">
          {bar.map((s) => (
            <div
              key={s}
              style={{ width: `${total ? (cnt(s) / total) * 100 : 0}%`, background: WARNA[s] }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
          {bar.map((s) => (
            <span key={s} className="flex items-center gap-2">
              <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: WARNA[s] }} />
              {LBL[s]} {cnt(s)}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Keputusan terbaru</h2>
          {terbaru.length === 0 && <p className="mt-3 text-stone-500">Belum ada keputusan.</p>}
          <div className="mt-2">
            {terbaru.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-2 border-t py-3 md:flex-row md:items-center md:gap-4"
              >
                <div className="min-w-0 flex-1 text-sm font-medium">{d.isi}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500 md:flex-none">
                  <span>{d.subbag}</span>
                  <span>{fmt(d.tenggat)}</span>
                  <Pill d={d} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Perlu perhatian</h2>
            <div className="mt-2 space-y-3 text-sm">
              {late.map((d) => (
                <div key={d.id} className="flex gap-2">
                  <span className={`h-fit flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL.terlambat}`}>Terlambat</span>
                  <span>{d.isi}</span>
                </div>
              ))}
              {mendesak.map((d) => (
                <div key={d.id} className="flex gap-2">
                  <span className={`h-fit flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL.mendesak}`}>Mendesak</span>
                  <span>
                    {d.isi} <span className="text-stone-500">· tenggat {fmt(d.tenggat)}</span>
                  </span>
                </div>
              ))}
              {late.length === 0 && mendesak.length === 0 && (
                <p className="text-stone-500">Tidak ada yang perlu perhatian.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Penyelesaian per subbagian</h2>
            <div className="mt-3 space-y-3">
              {perSubbag.map((x) => (
                <div key={x.s}>
                  <div className="flex justify-between text-sm">
                    <span>{x.s}</span>
                    <span className="text-stone-500">{x.pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-[#7a1f2b]" style={{ width: `${x.pct}%` }} />
                  </div>
                </div>
              ))}
              {perSubbag.length === 0 && <p className="text-sm text-stone-500">Belum ada data.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
