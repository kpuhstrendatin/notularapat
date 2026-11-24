'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { SUBBAG, type Draft } from '@/lib/types';
import PilihPengubah from '@/components/PilihPengubah';
import PilihPJ from '@/components/PilihPJ';
import Ikon from '@/components/Ikon';
import { Btn, Pilih, Label, Segmen, fieldCls, kartu } from '@/components/ui';
import { tampilkanPesan, tampilkanToast } from '@/components/Popup';

type Mode = 'notula' | 'manual';
const BARU = '__baru__';

export default function TambahKeputusan() {
  const [mode, setMode] = useState<Mode>('notula');

  // Nama sumber: dari daftar, atau nama baru (notula, SK, kesepakatan, dll.)
  const [daftarSumber, setDaftarSumber] = useState<string[]>([]);
  const [pilihSumber, setPilihSumber] = useState<string>('');
  const [namaBaru, setNamaBaru] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [oleh, setOleh] = useState('');

  // Mode impor
  const [teks, setTeks] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Mode manual
  const [isiM, setIsiM] = useState('');
  const [subbagM, setSubbagM] = useState('');
  const [picM, setPicM] = useState('');
  const [tenggatM, setTenggatM] = useState('');

  const [msg, setMsg] = useState('');
  const sukses = (t: string) => {
    setMsg(t);
    tampilkanToast(t);
  };
  const [busy, setBusy] = useState(false);

  async function muatSumber(pilihKan?: string) {
    try {
      const r = await fetch('/api/notula', { cache: 'no-store' });
      const j = await r.json();
      const daftar: string[] = Array.isArray(j) ? j : [];
      setDaftarSumber(daftar);
      if (pilihKan !== undefined) setPilihSumber(pilihKan);
      else setPilihSumber('');
    } catch {
      setPilihSumber(BARU);
    }
  }

  useEffect(() => {
    muatSumber();
  }, []);

  // Nama sumber yang dipakai. Nama baru disimpan ke daftar dulu.
  async function ambilNamaSumber(): Promise<string | null> {
    if (pilihSumber === '') {
      tampilkanPesan('Pilih nama sumber terlebih dahulu.');
      return null;
    }
    if (pilihSumber !== BARU) return pilihSumber;
    const nama = namaBaru.trim();
    if (!nama) {
      tampilkanPesan('Isi nama sumber baru terlebih dahulu.');
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
    setMsg('Memproses teks…');
    const r = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teks }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return tampilkanPesan(j.error);
    setDrafts(j.drafts.map((x: Omit<Draft, 'on'>) => ({ ...x, on: true })));
    sukses(`${j.drafts.length} draf ditemukan. Periksa sebelum disimpan.`);
  }

  function ubahDraf(i: number, p: Partial<Draft>) {
    setDrafts((ds) => ds.map((d, k) => (k === i ? { ...d, ...p } : d)));
  }

  // Cek bagian atas. Mengembalikan nama sumber kalau lengkap.
  async function cekAtas(): Promise<string | null> {
    if (!oleh.trim()) {
      tampilkanPesan('Pilih nama pengubah terlebih dahulu.');
      return null;
    }
    if (!tanggal) {
      tampilkanPesan('Isi tanggal pembahasan terlebih dahulu.');
      return null;
    }
    return ambilNamaSumber();
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

  async function simpanImpor() {
    const judul = await cekAtas();
    if (!judul) return;
    const items = drafts.filter((d) => d.on);
    if (!items.length) return tampilkanPesan('Belum ada draf yang dicentang untuk disimpan.');
    if (items.some((d) => !d.subbag || !d.tenggat)) {
      return tampilkanPesan('Ada draf yang belum lengkap. Isi penanggung jawab dan tenggat.');
    }

    const j = await kirim(judul, items);
    if (!j) return;
    setDrafts([]);
    setTeks('');
    setNamaBaru('');
    sukses(`${j.jumlah} keputusan tersimpan ke "${judul}".`);
    await muatSumber(judul);
  }

  async function simpanManual() {
    const judul = await cekAtas();
    if (!judul) return;
    if (!isiM.trim()) return tampilkanPesan('Isi keputusannya terlebih dahulu.');
    if (!subbagM) return tampilkanPesan('Pilih penanggung jawab subbag.');
    if (!tenggatM) return tampilkanPesan('Isi tenggat terlebih dahulu.');

    const j = await kirim(judul, [{ isi: isiM.trim(), subbag: subbagM, pic: picM || null, tenggat: tenggatM, status: 'belum' }]);
    if (!j) return;
    setIsiM('');
    setSubbagM('');
    setPicM('');
    setTenggatM('');
    setNamaBaru('');
    sukses(`Keputusan tersimpan ke "${judul}".`);
    await muatSumber(judul);
  }

  return (
    <div className="space-y-5">
      <section className={kartu}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Tambah keputusan</h2>
            <p className="mt-1 text-sm text-stone-600">Pilih cara menambahkan keputusan, lalu lengkapi data di bawah.</p>
          </div>
          <Segmen<Mode>
            value={mode}
            onChange={(m) => {
              setMode(m);
              setMsg('');
            }}
            opsi={[
              { nilai: 'notula', label: 'Impor dari notula', icon: 'dokumen' },
              { nilai: 'manual', label: 'Tambah manual', icon: 'pensil' },
            ]}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label icon="dokumen">Nama sumber</Label>
            <Pilih value={pilihSumber} onChange={(e) => setPilihSumber(e.target.value)}>
              <option value="">— pilih nama sumber —</option>
              {daftarSumber.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value={BARU}>+ Nama sumber baru</option>
            </Pilih>
          </div>

          {pilihSumber === BARU ? (
            <div>
              <Label icon="tambah">Nama sumber baru</Label>
              <input
                className={fieldCls}
                placeholder="Contoh: Notula rapat mingguan, SK, Hasil kesepakatan"
                value={namaBaru}
                onChange={(e) => setNamaBaru(e.target.value)}
              />
            </div>
          ) : (
            <div className="hidden md:block" />
          )}

          <div>
            <Label icon="kalender">Tanggal pembahasan</Label>
            <input className={fieldCls} type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>

          <div>
            <Label icon="orang">Nama pengubah</Label>
            <PilihPengubah value={oleh} onChange={setOleh} />
          </div>
        </div>
        {msg && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
            <Ikon nama="cek" className="h-4 w-4" /> {msg}
          </p>
        )}
      </section>

      {mode === 'notula' && (
        <>
          <section className={`${kartu} space-y-4`}>
            <h3 className="flex items-center gap-2 font-bold text-stone-900">
              <Ikon nama="dokumen" className="h-4 w-4 text-[#7a1f2b]" /> Dari file atau teks
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-[#7a1f2b] hover:bg-[#7a1f2b]/5">
                <Ikon nama="unduh" className="h-4 w-4" /> Pilih file (.docx, .txt, .md)
                <input type="file" accept=".docx,.txt,.md" onChange={unggah} className="hidden" />
              </label>
              <span className="text-sm text-stone-600">atau tempel teks di bawah</span>
            </div>
            <textarea
              className={`${fieldCls} min-h-40`}
              placeholder="Tempel teks notula atau kesepakatan di sini"
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
            />
            <Btn onClick={cari} disabled={busy}>
              <Ikon nama="cari" className="h-4 w-4" /> Cari keputusan
            </Btn>
          </section>

          {drafts.length > 0 && (
            <section className={`${kartu} space-y-3`}>
              <h3 className="font-bold text-stone-900">Draf keputusan</h3>
              {drafts.map((d, i) => (
                <div
                  key={i}
                  className={`grid gap-3 rounded-xl border p-3 md:grid-cols-[28px_1fr_200px_170px] ${
                    d.on ? 'border-[#7a1f2b]/20 bg-[#7a1f2b]/[0.03]' : 'border-stone-200 opacity-60'
                  }`}
                >
                  <label className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={d.on}
                      onChange={(e) => ubahDraf(i, { on: e.target.checked })}
                      className="h-4 w-4 accent-[#7a1f2b]"
                    />
                  </label>
                  <input className={fieldCls} value={d.isi} onChange={(e) => ubahDraf(i, { isi: e.target.value })} />
                  <div className="space-y-2">
                    <Pilih value={d.subbag} onChange={(e) => ubahDraf(i, { subbag: e.target.value, pic: '' })}>
                      <option value="">— penanggung jawab —</option>
                      {SUBBAG.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Pilih>
                    {d.subbag && (
                      <PilihPJ subbag={d.subbag} value={d.pic ?? ''} onChange={(v) => ubahDraf(i, { pic: v })} />
                    )}
                  </div>
                  <input className={fieldCls} type="date" value={d.tenggat} onChange={(e) => ubahDraf(i, { tenggat: e.target.value })} />
                </div>
              ))}
              <Btn onClick={simpanImpor}>
                <Ikon nama="cek" className="h-4 w-4" /> Simpan yang dicentang
              </Btn>
            </section>
          )}
        </>
      )}

      {mode === 'manual' && (
        <section className={`${kartu} space-y-4`}>
          <h3 className="flex items-center gap-2 font-bold text-stone-900">
            <Ikon nama="pensil" className="h-4 w-4 text-[#7a1f2b]" /> Keputusan baru
          </h3>
          <textarea
            className={`${fieldCls} min-h-24`}
            placeholder="Isi keputusan, misalnya: Menyusun jadwal sosialisasi pemutakhiran data"
            value={isiM}
            onChange={(e) => setIsiM(e.target.value)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label icon="gedung">Penanggung jawab subbag</Label>
              <Pilih value={subbagM} onChange={(e) => {
                  setSubbagM(e.target.value);
                  setPicM('');
                }}>
                <option value="">— pilih subbag —</option>
                {SUBBAG.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Pilih>
            </div>
            {subbagM && (
              <div>
                <Label icon="orang">Penanggung jawab orang (opsional)</Label>
                <PilihPJ subbag={subbagM} value={picM} onChange={setPicM} />
              </div>
            )}
            <div>
              <Label icon="kalender">Tenggat</Label>
              <input className={fieldCls} type="date" value={tenggatM} onChange={(e) => setTenggatM(e.target.value)} />
            </div>
          </div>
          <Btn onClick={simpanManual}>
            <Ikon nama="cek" className="h-4 w-4" /> Simpan keputusan
          </Btn>
        </section>
      )}
    </div>
  );
}
