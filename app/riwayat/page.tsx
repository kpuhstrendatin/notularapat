'use client';

import { useEffect, useState } from 'react';
import { LBL, type Status } from '@/lib/types';
import Ikon from '@/components/Ikon';
import { StatusChip } from '@/components/Status';

type Log = {
  id: number;
  isi: string;
  status_lama: Status | null;
  status_baru: Status;
  oleh: string | null;
  at: string;
};

export default function Riwayat() {
  const [rows, setRows] = useState<Log[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/riwayat', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? 'Gagal memuat riwayat');
        return j as Log[];
      })
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Kesalahan tidak diketahui'));
  }, []);

  if (err) return <p className="rounded-2xl bg-red-50 p-4 text-red-700">{err}</p>;
  if (!rows) return <p className="rounded-2xl bg-white p-4 text-stone-500 shadow-sm">Memuat riwayat…</p>;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Ikon nama="riwayat" className="h-5 w-5 text-[#7a1f2b]" /> Riwayat perubahan progres
      </h2>
      <p className="mt-1 text-sm text-stone-500">100 perubahan terakhir.</p>

      {rows.length === 0 && (
        <p className="mt-4 rounded-lg bg-stone-50 p-4 text-stone-500">
          Belum ada perubahan progres. Riwayat akan muncul setelah progres keputusan diubah.
        </p>
      )}

      <div className="mt-3 divide-y">
        {rows.map((l) => (
          <div key={l.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{l.isi}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <Ikon nama="orang" className="h-3.5 w-3.5" /> {l.oleh ?? '—'}
                <span>·</span>
                <Ikon nama="jam" className="h-3.5 w-3.5" />
                {new Date(l.at).toLocaleString('id-ID', { timeZone: 'Asia/Makassar', dateStyle: 'medium', timeStyle: 'short' })} WITA
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {l.status_lama ? <StatusChip status={l.status_lama} /> : <span className="text-stone-400">baru</span>}
              <span className="text-stone-400">→</span>
              <StatusChip status={l.status_baru} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
