'use client';

import { useEffect, useState } from 'react';
import { LBL, isLate, SUBBAG, type Decision, type Status, STATUS } from '@/lib/types';
import PilihPengubah from '@/components/PilihPengubah';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmt = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d} ${MON[+m - 1]} ${y}`;
};

const PILL: Record<Status | 'terlambat', string> = {
  belum: 'bg-stone-200 text-stone-700',
  sedang: 'bg-blue-100 text-blue-900',
  menunggu: 'bg-orange-100 text-orange-900',
  selesai: 'bg-green-100 text-green-900',
  terlambat: 'bg-red-100 text-red-800',
};

export default function Daftar() {
  const [rows, setRows] = useState<Decision[]>([]);
  const [filter, setFilter] = useState('');
  const [cari, setCari] = useState('');
  const [subbag, setSubbag] = useState('');
  const [oleh, setOleh] = useState('');
  const [msg, setMsg] = useState('');
  const [memuat, setMemuat] = useState(true);

  async function muat() {
    setMemuat(true);
    const r = await fetch('/api/decisions', { cache: 'no-store' });
    const j = await r.json();
    setRows(Array.isArray(j) ? j : []);
    setMemuat(false);
  }

  useEffect(() => {
    muat();
  }, []);

  async function ubahStatus(id: string, status: Status) {
    if (!oleh.trim()) return setMsg('Pilih nama pengubah dulu.');
    setMsg('Menyimpan…');
    const r = await fetch('/api/decisions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, oleh }),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error);
    setMsg('Status diperbarui.');
    muat();
  }

  const tampil = rows.filter((d) => {
    const cocokCari = !cari || (d.isi + ' ' + d.subbag).toLowerCase().includes(cari.toLowerCase());
    const cocokFilter =
      !filter || (filter === 'terlambat' ? isLate(d) : d.status === filter);
    const cocokSubbag = !subbag || d.subbag === subbag;
    return cocokCari && cocokFilter && cocokSubbag;
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold">Daftar Keputusan</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <input
            className="rounded-lg border p-2 md:col-span-2"
            placeholder="Cari keputusan atau subbagian"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
          <select className="rounded-lg border p-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Semua status</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {LBL[s]}
              </option>
            ))}
            <option value="terlambat">Terlambat</option>
          </select>
          <select className="rounded-lg border p-2" value={subbag} onChange={(e) => setSubbag(e.target.value)}>
            <option value="">Semua subbag</option>
            {SUBBAG.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <PilihPengubah value={oleh} onChange={setOleh} />
        </div>
        {msg && <p className="mt-2 text-sm text-stone-500">{msg}</p>}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        {memuat && <p className="text-stone-500">Memuat…</p>}
        {!memuat && tampil.length === 0 && <p className="text-stone-500">Tidak ada keputusan yang cocok.</p>}
        {tampil.map((d) => {
          const terlambat = isLate(d);
          return (
            <div key={d.id} className="flex flex-col gap-2 border-t py-3 md:flex-row md:items-center md:gap-4">
              <div className="min-w-0 flex-1 text-sm font-medium">{d.isi}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-500 md:flex-none">
                <span>{d.subbag}</span>
                <span>{fmt(d.tenggat)}</span>
                <select
                  className="rounded-lg border p-1.5 text-sm text-stone-800"
                  value={d.status}
                  onChange={(e) => ubahStatus(d.id, e.target.value as Status)}
                  aria-label="Ubah status"
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {LBL[s]}
                    </option>
                  ))}
                </select>
                {terlambat && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PILL.terlambat}`}>Terlambat</span>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
