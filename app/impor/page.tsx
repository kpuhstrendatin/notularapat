'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { SUBBAG, type Draft } from '@/lib/types';
import PilihPengubah from '@/components/PilihPengubah';

type Rapat = { id: string; judul: string; tanggal: string | null; updated_at: string };
type Mode = 'notula' | 'manual';
const BARU = '__baru__';

export default function TambahKeputusan() {
  const [mode, setMode] = useState<Mode>('notula');

  // Data rapat (notula) — dipakai bersama kedua mode
  const [rapat, setRapat] = useState<Rapat[]>([]);
  const [pilih, setPilih] = useState<string>(BARU);
  const [judulBaru, setJudulBaru] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [oleh, setOleh] = useState('');

  // Mode notula
  const [teks, setTeks] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Mode manual
  const [isiM, setIsiM] = useState('');
  const [subbagM, setSubbagM] = useState('');
  const [tenggatM, setTenggatM] = useState('');

  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function muatRapat(pilihKan?: string) {
    try {
      const r = await fetch('/api/meetings', { cache: 'no-store' });
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

  // Unggah file .docx / .txt / .md, isi kotak teks dengan hasilnya
  async function unggah(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg('Membaca file…');
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/extract', { method: 'POST', body: fd });
    const j = await r.json();
    e.target.value = '';
    if (!r.ok) return setMsg(j.error);
    setTeks(j.teks);
    setMsg('File terbaca. Klik Cari keputusan.');
  }

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

  function ubahDraf(i: number, p: Partial<Draft>) {
    setDrafts((ds) => ds.map((d, k) => (k === i ? { ...d, ...p } : d)));
  }

  // Validasi bagian rapat yang dipakai kedua mode
  function cekRapat(): string | null {
    if (!oleh.trim()) return 'Pilih nama pengubah.';
    if (pilih === BARU && !judulBaru.trim()) return 'Isi nama notula / rapat baru.';
    return null;
  }

  function payloadRapat(items: object[]) {
    return pilih === BARU
      ? { oleh, meeting: { judul: judulBaru.trim(), tanggal: tanggal || null }, items }
      : { oleh, meeting_id: pilih, items };
  }

  async function kirim(items: object[]) {
    const r = await fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadRapat(items)),
    });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error);
      return null;
    }
    return j;
  }

  // Simpan hasil impor notula
  async function simpanNotula() {
    const galat = cekRapat();
    if (galat) return setMsg(galat);
    const items = drafts.filter((d) => d.on);
    if (!items.length) return setMsg('Tidak ada yang dicentang.');
    if (items.some((d) => !d.subbag || !d.tenggat)) return setMsg('Lengkapi penanggung jawab dan tenggat.');

    const j = await kirim(items);
    if (!j) return;
    setDrafts([]);
    setTeks('');
    setJudulBaru('');
    setTanggal('');
    setMsg(`${j.jumlah} keputusan tersimpan.`);
    await muatRapat(j.meeting_id ?? undefined);
  }

  // Simpan satu keputusan yang diisi manual
  async function simpanManual() {
    const galat = cekRapat();
    if (galat) return setMsg(galat);
    if (!isiM.trim()) return setMsg('Isi keputusannya.');
    if (!subbagM) return setMsg('Pilih penanggung jawab.');
    if (!tenggatM) return setMsg('Isi tenggat.');

    const j = await kirim([{ isi: isiM.trim(), subbag: subbagM, tenggat: tenggatM, status: 'belum' }]);
    if (!j) return;
    setIsiM('');
    setSubbagM('');
    setTenggatM('');
    setMsg('Keputusan tersimpan.');
    await muatRapat(j.meeting_id ?? undefined);
  }

  const tabCls = (aktif: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold ${
      aktif ? 'bg-[#7a1f2b] text-white' : 'border text-stone-700 hover:bg-stone-50'
    }`;

  return (
    <div className="space-y-4">
      <section className="card space-y-4">
        <div>
          <h2 className="font-bold">Tambah keputusan</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={tabCls(mode === 'notula')} onClick={() => { setMode('notula'); setMsg(''); }}>
              Impor dari notula
            </button>
            <button className={tabCls(mode === 'manual')} onClick={() => { setMode('manual'); setMsg(''); }}>
              Tambah manual
            </button>
          </div>
        </div>

        {/* Data rapat, dipakai kedua mode */}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Notula / rapat</label>
            <select className="w-full rounded-lg border p-2" value={pilih} onChange={(e) => setPilih(e.target.value)}>
              {rapat.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.judul}
                  {r.tanggal ? ` · ${r.tanggal}` : ''}
                </option>
              ))}
              <option value={BARU}>+ Notula / rapat baru</option>
            </select>
          </div>

          {pilih === BARU ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">Nama notula / rapat</label>
                <input
                  className="w-full rounded-lg border p-2"
                  placeholder="Contoh: Rapat koordinasi mingguan"
                  value={judulBaru}
                  onChange={(e) => setJudulBaru(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">Tanggal pembahasan</label>
                <input
                  className="w-full rounded-lg border p-2"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border bg-stone-50 p-2 text-sm text-stone-500 md:col-span-2">
              Keputusan akan ditambahkan ke notula / rapat ini.
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Nama pengubah</label>
            <PilihPengubah value={oleh} onChange={setOleh} />
          </div>
        </div>
      </section>

      {mode === 'notula' && (
        <>
          <section className="card space-y-3">
            <h3 className="font-semibold">Dari file atau teks notula</h3>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-stone-50">
                Pilih file (.docx, .txt, .md)
                <input type="file" accept=".docx,.txt,.md" onChange={unggah} className="hidden" />
              </label>
              <span className="text-sm text-stone-500">atau tempel teks di bawah</span>
            </div>
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
              <h3 className="font-semibold">Draf keputusan</h3>
              {drafts.map((d, i) => (
                <div key={i} className="grid gap-2 border-t pt-3 md:grid-cols-[24px_1fr_180px_160px]">
                  <input type="checkbox" checked={d.on} onChange={(e) => ubahDraf(i, { on: e.target.checked })} />
                  <input
                    className="rounded-lg border p-2"
                    value={d.isi}
                    onChange={(e) => ubahDraf(i, { isi: e.target.value })}
                  />
                  <select
                    className="rounded-lg border p-2"
                    value={d.subbag}
                    onChange={(e) => ubahDraf(i, { subbag: e.target.value })}
                  >
                    <option value="">— penanggung jawab —</option>
                    {SUBBAG.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    className="rounded-lg border p-2"
                    type="date"
                    value={d.tenggat}
                    onChange={(e) => ubahDraf(i, { tenggat: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button className="rounded-lg bg-maroon px-4 py-2 text-white" onClick={simpanNotula}>
                  Simpan yang dicentang
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {mode === 'manual' && (
        <section className="card space-y-3">
          <h3 className="font-semibold">Keputusan baru</h3>
          <textarea
            className="min-h-24 w-full rounded-lg border p-2"
            placeholder="Isi keputusan, misalnya: Menyusun jadwal sosialisasi pemutakhiran data"
            value={isiM}
            onChange={(e) => setIsiM(e.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Penanggung jawab</label>
              <select className="w-full rounded-lg border p-2" value={subbagM} onChange={(e) => setSubbagM(e.target.value)}>
                <option value="">— pilih subbag —</option>
                {SUBBAG.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Tenggat</label>
              <input
                className="w-full rounded-lg border p-2"
                type="date"
                value={tenggatM}
                onChange={(e) => setTenggatM(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg bg-maroon px-4 py-2 text-white" onClick={simpanManual}>
              Simpan keputusan
            </button>
            <span className="text-sm text-stone-500">{msg}</span>
          </div>
        </section>
      )}

    </div>
  );
}
