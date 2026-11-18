'use client';

import { useEffect, useState } from 'react';
import { SUBBAG, type Draft } from '@/lib/types';

type Rapat = { id: string; judul: string; tanggal: string | null; updated_at: string };
const BARU = '__baru__';

export default function Impor() {
  const [rapat, setRapat] = useState<Rapat[]>([]);
  const [pilih, setPilih] = useState<string>(BARU);
  const [judulBaru, setJudulBaru] = useState('');
  const [tanggalBaru, setTanggalBaru] = useState('');
  const [oleh, setOleh] = useState('');
  const [teks, setTeks] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Muat daftar rapat, urut dari yang terakhir diupdate. Yang paling atas otomatis terpilih.
  async function muatRapat(pilihKan?: string) {
    try {
      const r = await fetch('/api/meetings');
      const data = await r.json();
      const daftar: Rapat[] = Array.isArray(data) ? data : [];
      setRapat(daftar);
      if (pilihKan) setPilih(pilihKan);
      else setPilih(daftar.length ? daftar[0].id : BARU);
    } catch {
      setPilih(BARU);
    }
  }

  useEffect(() => {
    muatRapat();
  }, []);

  async function cari() {
    setBusy(true);
    setMsg('Memproses notula…');
    const r = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teks }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg(j.error);
    setDrafts(j.drafts.map((x: Omit<Draft, 'on'>) => ({ ...x, on: true })));
    setMsg(`${j.drafts.length} draf ditemukan. Periksa sebelum disimpan.`);
  }

  function ubah(i: number, p: Partial<Draft>) {
    setDrafts((ds) => ds.map((d, k) => (k === i ? { ...d, ...p } : d)));
  }

  async function simpan() {
    const items = drafts.filter((d) => d.on);
    if (!oleh.trim()) return setMsg('Nama pengubah wajib diisi.');
    if (!items.length) return setMsg('Tidak ada yang dicentang.');
    if (items.some((d) => !d.subbag || !d.tenggat)) return setMsg('Lengkapi subbagian dan tenggat.');
    if (pilih === BARU && !judulBaru.trim()) return setMsg('Isi judul rapat baru.');

    const payload =
      pilih === BARU
        ? { oleh, meeting: { judul: judulBaru.trim(), tanggal: tanggalBaru || null }, items }
        : { oleh, meeting_id: pilih, items };

    const r = await fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error);

    setDrafts([]);
    setTeks('');
    setJudulBaru('');
    setTanggalBaru('');
    setMsg(`${j.jumlah} keputusan tersimpan.`);
    await muatRapat(j.meeting_id ?? undefined);
  }

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <h2 className="font-bold">Impor dari Notula</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-lg border p-2"
            value={pilih}
            onChange={(e) => setPilih(e.target.value)}
          >
            {rapat.map((r) => (
              <option key={r.id} value={r.id}>
                {r.judul}
                {r.tanggal ? ` · ${r.tanggal}` : ''}
              </option>
            ))}
            <option value={BARU}>+ Rapat baru</option>
          </select>

          {pilih === BARU ? (
            <>
              <input
                className="rounded-lg border p-2"
                placeholder="Judul rapat baru"
                value={judulBaru}
                onChange={(e) => setJudulBaru(e.target.value)}
              />
              <input
                className="rounded-lg border p-2"
                type="date"
                value={tanggalBaru}
                onChange={(e) => setTanggalBaru(e.target.value)}
              />
            </>
          ) : (
            <div className="rounded-lg border bg-stone-50 p-2 text-sm text-stone-500 md:col-span-2">
              Keputusan akan ditambahkan ke rapat ini.
            </div>
          )}
        </div>

        <input
          className="rounded-lg border p-2"
          placeholder="Nama pengubah"
          value={oleh}
          onChange={(e) => setOleh(e.target.value)}
        />

        <textarea
          className="min-h-40 w-full rounded-lg border p-2"
          placeholder="Tempel teks notula di sini"
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
        />

        <div className="flex items-center gap-3">
          <button
            className="rounded-lg bg-maroon px-4 py-2 text-white disabled:opacity-50"
            disabled={busy}
            onClick={cari}
          >
            Cari keputusan
          </button>
          <span className="text-sm text-stone-500">{msg}</span>
        </div>
      </section>

      {drafts.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-bold">Draf keputusan</h2>
          {drafts.map((d, i) => (
            <div key={i} className="grid gap-2 border-t pt-3 md:grid-cols-[24px_1fr_180px_160px]">
              <input type="checkbox" checked={d.on} onChange={(e) => ubah(i, { on: e.target.checked })} />
              <input className="rounded-lg border p-2" value={d.isi} onChange={(e) => ubah(i, { isi: e.target.value })} />
              <select className="rounded-lg border p-2" value={d.subbag} onChange={(e) => ubah(i, { subbag: e.target.value })}>
                <option value="">— pilih subbag —</option>
                {SUBBAG.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input className="rounded-lg border p-2" type="date" value={d.tenggat} onChange={(e) => ubah(i, { tenggat: e.target.value })} />
            </div>
          ))}
          <button className="rounded-lg bg-maroon px-4 py-2 text-white" onClick={simpan}>
            Simpan yang dicentang
          </button>
        </section>
      )}
    </div>
  );
}
