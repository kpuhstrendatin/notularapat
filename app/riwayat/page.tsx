'use client';

import { useEffect, useState } from 'react';
import { LBL, type Status } from '@/lib/types';

type Log = {
  id: number;
  status_lama: Status | null;
  status_baru: Status;
  oleh: string | null;
  at: string;
  decisions: { isi: string } | { isi: string }[] | null;
};

const isiDari = (d: Log['decisions']) => (Array.isArray(d) ? d[0]?.isi : d?.isi) ?? '(keputusan sudah dihapus)';

export default function Riwayat() {
  const [rows, setRows] = useState<Log[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/riwayat', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? 'Gagal memuat');
        return j as Log[];
      })
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Kesalahan tidak diketahui'));
  }, []);

  if (err) return <p className="rounded-2xl bg-white p-4 text-red-700 shadow-sm">Gagal memuat riwayat: {err}</p>;
  if (!rows) return <p className="rounded-2xl bg-white p-4 text-stone-500 shadow-sm">Memuat riwayat…</p>;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold">Riwayat perubahan status</h2>
      <p className="mt-1 text-sm text-stone-500">100 perubahan terakhir.</p>
      {rows.length === 0 && <p className="mt-3 text-stone-500">Belum ada perubahan status.</p>}
      <div className="mt-2">
        {rows.map((l) => (
          <div key={l.id} className="border-t py-3 text-sm">
            <div className="font-medium">{isiDari(l.decisions)}</div>
            <div className="mt-1 text-stone-500">
              {l.status_lama ? LBL[l.status_lama] : '—'} → <b className="text-stone-700">{LBL[l.status_baru]}</b>
              {' · '}oleh {l.oleh ?? '—'}
              {' · '}
              {new Date(l.at).toLocaleString('id-ID', {
                timeZone: 'Asia/Makassar',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              WITA
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
