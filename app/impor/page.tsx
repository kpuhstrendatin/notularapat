'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { tampilkanPesan } from '@/components/Popup';
import { SUBBAG, type Draft } from '@/lib/types';
import PilihPengubah from '@/components/PilihPengubah';
import Ikon from '@/components/Ikon';

type Mode = 'notula' | 'manual';
const BARU = '__baru__';

export default function TambahKeputusan() {
  const [mode, setMode] = useState<Mode>('notula');

  // Notula: pilih dari daftar, atau tambah nama baru
  const [daftarNotula, setDaftarNotula] = useState<string[]>([]);
  const [pilihNotula, setPilihNotula] = useState<string>('');
  const [namaBaru, setNamaBaru] = useState('');
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

  async function muatNotula(pilihKan?: string) {
    try {
      const r = await fetch('/api/notula', { cache: 'no-store' });
      const j = await r.json();
      const daftar: string[] = Array.isArray(j) ? j : [];
      setDaftarNotula(daftar);
      if (pilihKan !== undefined) setPilihNotula(pilihKan);
      else setPilihNotula(daftar.length ? daftar[0] : BARU);
    } catch {
      setPilihNotula(BARU);
    }
  }

  useEffect(() => {
    muatNotula();
  }, []);

  // Nama notula yang akan dipakai: dari daftar, atau nama baru yang disimpan ke daftar dulu
  async function ambilNamaNotula(): Promise<string | null> {
    if (pilihNotula !== BARU) return pilihNotula || null;
    const nama = namaBaru.trim();
    if (!nama) {
      tampilkanPesan('Isi nama notula baru.');
      return null;
    }
    const r = await fetch('/api/notula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul: nama }),
    });
    const j = await r.json();
    if (!r.ok) {
      tampilkanPesan(j.error);
      return null;
    }
    return nama;
  }

  async function unggah(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg('Membaca file…');
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/extract', { method: 'POST', body: fd });
    const j = await r.json();
    e.target.value = '';
    if (!r.ok) return tampilkanPesan(j.error);
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
    if (!r.ok) return tampilkanPesan(j.error);
    setDrafts(j.drafts.map((x: Omit<Draft, 'on'>) => ({ ...x, on: true })));
    setMsg(`${j.drafts.length} draf ditemukan. Periksa sebelum disimpan.`);
  }

  function ubahDraf(i: number, p: Partial<Draft>) {
    setDrafts((ds) => ds.map((d, k) => (k === i ? { ...d, ...p } : d)));
  }

  // Cek data bagian atas. Mengembalikan nama notula kalau lengkap.
  async function cekAtas(): Promise<string | null> {
    if (!oleh.trim()) {
      tampilkanPesan('Pilih nama pengubah dulu.');
      return null;
    }
    if (!tanggal) {
      tampilkanPesan('Isi tanggal pembahasan.');
      return null;
    }
    return ambilNamaNotula();
  }

  async function kirim(judul: string, items: object[]) {
    const r = await fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oleh, meeting: { judul, tanggal }, items }),
    });
    const j = await r.json();
    if (!r.ok) {
      tampilkanPesan(j.error);
      return null;
    }
    return j;
  }

  async function simpanNotula() {
    const judul = await cekAtas();
    if (!judul) return;
    const items = drafts.filter((d) => d.on);
    if (!items.length) return tampilkanPesan('Tidak ada yang dicentang.');
    if (items.some((d) => !d.subbag || !d.tenggat)) return tampilkanPesan('Lengkapi penanggung jawab dan tenggat.');

    const j = await kirim(judul, items);
    if (!j) return;
    setDrafts([]);
    setTeks('');
    setNamaBaru('');
    setMsg(`${j.jumlah} keputusan tersimpan ke "${judul}".`);
    await muatNotula(judul);
  }

  async function simpanManual() {
    const judul = await cekAtas();
    if (!judul) return;
    if (!isiM.trim()) return tampilkanPesan('Isi keputusannya.');
    if (!subbagM) return tampilkanPesan('Pilih penanggung jawab.');
    if (!tenggatM) return tampilkanPesan('Isi tenggat.');

    const j = await kirim(judul, [{ isi: isiM.trim(), subbag: subbagM, tenggat: tenggatM, status: 'belum' }]);
    if (!j) return;
    setIsiM('');
    setSubbagM('');
    setTenggatM('');
    setNamaBaru('');
    setMsg(`Keputusan tersimpan ke "${judul}".`);
    await muatNotula(judul);
  }

  const tab = (aktif: boolean) =>
    `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
      aktif ? 'bg-[#7a1f2b] text-white shadow-sm' : 'border text-stone-700 hover:bg-stone-50'
    }`;

  const kartu = 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm';

  return (
    <div className="space-y-4">
      <section className={kartu}>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Ikon nama="tambah" className="h-5 w-5 text-[#7a1f2b]" /> Tambah keputusan
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={tab(mode === 'notula')} onClick={() => { setMode('notula'); tampilkanPesan(''); }}>
            <Ikon nama="dokumen" className="h-4 w-4" /> Impor dari notula
          </button>
          <button className={tab(mode === 'manual')} onClick={() => { setMode('manual'); tampilkanPesan(''); }}>
            <Ikon nama="pensil" className="h-4 w-4" /> Tambah manual
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <Ikon nama="notula" className="h-3.5 w-3.5" /> Nama notula
            </label>
            <select
              className="w-full rounded-lg border p-2"
              value={pilihNotula}
              onChange={(e) => setPilihNotula(e.target.value)}
            >
              {daftarNotula.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value={BARU}>+ Nama notula baru</option>
            </select>
          </div>

          {pilihNotula === BARU ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Nama notula baru</label>
              <input
                className="w-full rounded-lg border p-2"
                placeholder="Contoh: Rapat koordinasi mingguan"
                value={namaBaru}
                onChange={(e) => setNamaBaru(e.target.value)}
              />
            </div>
          ) : (
            <div />
          )}

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <Ikon nama="kalender" className="h-3.5 w-3.5" /> Tanggal pembahasan
            </label>
            <input className="w-full rounded-lg border p-2" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <Ikon nama="orang" className="h-3.5 w-3.5" /> Nama pengubah
            </label>
            <PilihPengubah value={oleh} onChange={setOleh} />
          </div>
        </div>
        {msg && <p className="mt-3 text-sm text-stone-600">{msg}</p>}
      </section>

      {mode === 'notula' && (
        <>
          <section className={`${kartu} space-y-3`}>
            <h3 className="font-semibold">Dari file atau teks notula</h3>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-stone-50">
                <Ikon nama="unduh" className="h-4 w-4" /> Pilih file (.docx, .txt, .md)
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
            <button
              className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-white disabled:opacity-50"
              disabled={busy}
              onClick={cari}
            >
              Cari keputusan
            </button>
          </section>

          {drafts.length > 0 && (
            <section className={`${kartu} space-y-3`}>
              <h3 className="font-semibold">Draf keputusan</h3>
              {drafts.map((d, i) => (
                <div key={i} className="grid gap-2 border-t pt-3 md:grid-cols-[24px_1fr_180px_160px]">
                  <input type="checkbox" checked={d.on} onChange={(e) => ubahDraf(i, { on: e.target.checked })} />
                  <input className="rounded-lg border p-2" value={d.isi} onChange={(e) => ubahDraf(i, { isi: e.target.value })} />
                  <select className="rounded-lg border p-2" value={d.subbag} onChange={(e) => ubahDraf(i, { subbag: e.target.value })}>
                    <option value="">— penanggung jawab —</option>
                    {SUBBAG.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <input className="rounded-lg border p-2" type="date" value={d.tenggat} onChange={(e) => ubahDraf(i, { tenggat: e.target.value })} />
                </div>
              ))}
              <button className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-white" onClick={simpanNotula}>
                Simpan yang dicentang
              </button>
            </section>
          )}
        </>
      )}

      {mode === 'manual' && (
        <section className={`${kartu} space-y-3`}>
          <h3 className="font-semibold">Keputusan baru</h3>
          <textarea
            className="min-h-24 w-full rounded-lg border p-2"
            placeholder="Isi keputusan, misalnya: Menyusun jadwal sosialisasi pemutakhiran data"
            value={isiM}
            onChange={(e) => setIsiM(e.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Penanggung jawab subbag</label>
              <select className="w-full rounded-lg border p-2" value={subbagM} onChange={(e) => setSubbagM(e.target.value)}>
                <option value="">— pilih subbag —</option>
                {SUBBAG.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Tenggat</label>
              <input className="w-full rounded-lg border p-2" type="date" value={tenggatM} onChange={(e) => setTenggatM(e.target.value)} />
            </div>
          </div>
          <button className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-white" onClick={simpanManual}>
            Simpan keputusan
          </button>
        </section>
      )}
    </div>
  );
}
