'use client';

import { useEffect, useState } from 'react';
import { tampilkanPesan, tampilkanToast } from '@/components/Popup';
import { LBL, STATUS, SUBBAG, isLate, type Decision, type Status } from '@/lib/types';
import { fmt, unduhCSV } from '@/lib/format';
import PilihPengubah from '@/components/PilihPengubah';
import PilihPJ from '@/components/PilihPJ';
import { Btn, Cari, Label, Pilih } from '@/components/ui';
import Ikon from '@/components/Ikon';
import { StatusPilih, StatusEdit, STATUS_STYLE } from '@/components/Status';

type Urut = 'tenggat-asc' | 'tenggat-desc' | 'dibuat' | 'subbag';

const URUT_LABEL: Record<Urut, string> = {
  'tenggat-asc': 'Tenggat terdekat',
  'tenggat-desc': 'Tenggat terjauh',
  dibuat: 'Terbaru dibuat',
  subbag: 'Subbag (A-Z)',
};

const kartu = 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm';

export default function Daftar() {
  const [rows, setRows] = useState<Decision[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState('');
  const [subbag, setSubbag] = useState('');
  const [urut, setUrut] = useState<Urut>('tenggat-asc');
  const [kelompok, setKelompok] = useState(false);
  const [bukaFilter, setBukaFilter] = useState(false);
  const [oleh, setOleh] = useState('');
  const [msg, setMsg] = useState('');
  const sukses = (t: string) => {
    setMsg(t);
    tampilkanToast(t);
  };
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ isi: '', subbag: '', pic: '', tenggat: '', status: 'belum' as Status });

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

  function cekOleh(): boolean {
    if (!oleh.trim()) {
      tampilkanPesan('Pilih nama pengubah dulu di bagian atas halaman.');
      return false;
    }
    return true;
  }

  async function kirim(body: object): Promise<boolean> {
    const r = await fetch('/api/decisions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, oleh }),
    });
    const j = await r.json();
    if (!r.ok) {
      tampilkanPesan(j.error);
      return false;
    }
    return true;
  }

  async function ubahProgres(id: string, status: Status) {
    if (!cekOleh()) return;
    setMsg('Menyimpan…');
    if (await kirim({ id, status })) {
      sukses('Progres diperbarui.');
      muat();
    }
  }

  function bukaEdit(d: Decision) {
    setEditId(d.id);
    setForm({ isi: d.isi, subbag: d.subbag, pic: d.pic ?? '', tenggat: d.tenggat, status: d.status });
    tampilkanPesan('');
  }

  async function simpanEdit(id: string) {
    if (!cekOleh()) return;
    if (!form.isi.trim()) return tampilkanPesan('Isi keputusan tidak boleh kosong.');
    setMsg('Menyimpan…');
    if (await kirim({ id, ...form })) {
      setEditId(null);
      sukses('Perubahan disimpan.');
      muat();
    }
  }

  const cmp = (a: Decision, b: Decision) => {
    switch (urut) {
      case 'tenggat-asc':
        return a.tenggat.localeCompare(b.tenggat);
      case 'tenggat-desc':
        return b.tenggat.localeCompare(a.tenggat);
      case 'dibuat':
        return b.created_at.localeCompare(a.created_at);
      case 'subbag':
        return a.subbag.localeCompare(b.subbag) || a.tenggat.localeCompare(b.tenggat);
    }
  };

  const tampil = rows
    .filter((d) => {
      const teks = (d.isi + ' ' + d.subbag + ' ' + (d.pic ?? '') + ' ' + (d.meetings?.judul ?? '')).toLowerCase();
      const cocokCari = !cari || teks.includes(cari.toLowerCase());
      const cocokStatus = !filter || (filter === 'terlambat' ? isLate(d) : d.status === filter);
      const cocokSubbag = !subbag || d.subbag === subbag;
      return cocokCari && cocokStatus && cocokSubbag;
    })
    .sort(cmp);

  const kelompokNotula = () => {
    const map = new Map<string, { judul: string; tanggal: string | null; items: Decision[] }>();
    tampil.forEach((d) => {
      const k = d.meeting_id ?? 'tanpa';
      if (!map.has(k)) map.set(k, { judul: d.meetings?.judul ?? 'Tanpa notula', tanggal: d.meetings?.tanggal ?? null, items: [] });
      map.get(k)!.items.push(d);
    });
    return Array.from(map.values()).sort((a, b) => (b.tanggal ?? '').localeCompare(a.tanggal ?? ''));
  };

  function ekspor() {
    unduhCSV(
      'daftar-keputusan.csv',
      ['Notula', 'Tanggal rapat', 'Keputusan', 'Penanggung jawab subbag', 'Penanggung jawab orang', 'Tenggat', 'Status', 'Terlambat'],
      tampil.map((d) => [
        d.meetings?.judul ?? '',
        d.meetings?.tanggal ? fmt(d.meetings.tanggal) : '',
        d.isi,
        d.subbag,
        d.pic ?? '',
        fmt(d.tenggat),
        LBL[d.status],
        isLate(d) ? 'Ya' : 'Tidak',
      ]),
    );
  }

  const renderBaris = (d: Decision, tampilNotula: boolean) => {
    const terlambat = isLate(d);
    const buka = editId === d.id;
    const garis = STATUS_STYLE[d.status].garis.replace('border-', 'border-l-');
    return (
      <article
        className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ring-1 ring-stone-200/80 ${
          terlambat ? 'border-l-red-600 bg-red-50/40' : garis
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusEdit value={d.status} onChange={(st) => ubahProgres(d.id, st)} />
          {terlambat && (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold tracking-wide text-white">TERLAMBAT</span>
          )}
          <span
            className={`ml-auto inline-flex items-center gap-1.5 text-sm font-semibold ${
              terlambat ? 'text-red-700' : 'text-stone-700'
            }`}
          >
            <Ikon nama="kalender" className="h-4 w-4" />
            Tenggat {fmt(d.tenggat)}
          </span>
        </div>

        <h3 className="mt-3 text-base font-bold leading-relaxed text-stone-900">{d.isi}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-stone-600">
          {tampilNotula && d.meetings?.judul && (
            <>
              <span className="text-stone-800">{d.meetings.judul}</span>
              {d.meetings.tanggal && <span className="text-stone-600">({fmt(d.meetings.tanggal)})</span>}
              <span className="text-stone-300">•</span>
            </>
          )}
          <span>{d.subbag}</span>
          {d.pic && (
            <>
              <span className="text-stone-300">•</span>
              <span>PJ: {d.pic}</span>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end border-t border-stone-100 pt-3">
          <button
            onClick={() => (buka ? setEditId(null) : bukaEdit(d))}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7a1f2b] hover:underline"
          >
            <Ikon nama="pensil" className="h-3.5 w-3.5" /> {buka ? 'Tutup' : 'Edit keputusan'}
          </button>
        </div>

        {buka && (
          <div className="mt-4 grid gap-4 rounded-xl bg-stone-50 p-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-600">Isi keputusan</label>
              <textarea
                className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-stone-900"
                rows={2}
                value={form.isi}
                onChange={(e) => setForm({ ...form, isi: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-600">Penanggung jawab subbag</label>
              <select
                className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-stone-900"
                value={form.subbag}
                onChange={(e) => setForm({ ...form, subbag: e.target.value, pic: '' })}
              >
                {SUBBAG.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-600">Penanggung jawab orang (opsional)</label>
              <PilihPJ subbag={form.subbag} value={form.pic} onChange={(v) => setForm({ ...form, pic: v })} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-600">Tenggat</label>
              <input
                type="date"
                className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-stone-900"
                value={form.tenggat}
                onChange={(e) => setForm({ ...form, tenggat: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-600">Progres</label>
              <StatusPilih value={form.status} onChange={(st) => setForm({ ...form, status: st })} />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button
                className="rounded-xl bg-[#7a1f2b] px-4 py-2.5 text-sm font-bold text-white shadow-sm"
                onClick={() => simpanEdit(d.id)}
              >
                Simpan perubahan
              </button>
              <button
                className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800"
                onClick={() => setEditId(null)}
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-4">
      <section className={kartu}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Ikon nama="daftar" className="h-5 w-5 text-[#7a1f2b]" /> Daftar Keputusan
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-sm font-semibold text-stone-600">{tampil.length}</span>
          </h2>
          <Btn variant="garis" onClick={ekspor} className="px-3"><Ikon nama="unduh" className="h-4 w-4" /><span className="hidden sm:inline">Ekspor ke Excel (CSV)</span><span className="sm:hidden">CSV</span></Btn>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Cari value={cari} onChange={setCari} placeholder="Cari keputusan, notula, subbag, atau nama" className="flex-1" />
          <button
            type="button"
            onClick={() => setBukaFilter(!bukaFilter)}
            className={`inline-flex flex-none items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold shadow-sm md:hidden ${
              bukaFilter || jumlahFilter > 0
                ? 'border-[#7a1f2b] bg-[#7a1f2b]/5 text-[#7a1f2b]'
                : 'border-stone-200 bg-white text-stone-700'
            }`}
          >
            <Ikon nama="daftar" className="h-4 w-4" />
            Filter
            {jumlahFilter > 0 && (
              <span className="rounded-full bg-[#7a1f2b] px-1.5 text-[11px] text-white">{jumlahFilter}</span>
            )}
          </button>
        </div>

        <div className={`mt-3 gap-3 md:grid md:grid-cols-4 ${bukaFilter ? 'grid' : 'hidden md:grid'}`}>
          <Pilih value={subbag} onChange={(e) => setSubbag(e.target.value)}>
            <option value="">Semua subbag</option>
            {SUBBAG.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Pilih>
          <Pilih value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Semua progres</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {LBL[s]}
              </option>
            ))}
            <option value="terlambat">Terlambat</option>
          </Pilih>
          <Pilih value={urut} onChange={(e) => setUrut(e.target.value as Urut)}>
            {(Object.keys(URUT_LABEL) as Urut[]).map((u) => (
              <option key={u} value={u}>
                Urut: {URUT_LABEL[u]}
              </option>
            ))}
          </Pilih>
          <button
            type="button"
            onClick={() => setKelompok(!kelompok)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              kelompok
                ? 'border-[#7a1f2b] bg-[#7a1f2b]/5 text-[#7a1f2b]'
                : 'border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-50'
            }`}
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-md border ${
                kelompok ? 'border-[#7a1f2b] bg-[#7a1f2b] text-white' : 'border-stone-300'
              }`}
            >
              {kelompok && <Ikon nama="cek" className="h-3 w-3" />}
            </span>
            Per notula
          </button>
        </div>

        <div className="mt-3">
          <Label icon="orang">Nama Anda (wajib untuk mengubah)</Label>
          <PilihPengubah value={oleh} onChange={setOleh} />
        </div>
        {msg && <p className="mt-3 text-sm text-stone-600">{msg}</p>}
      </section>

      {memuat && <p className="rounded-2xl bg-white p-4 text-stone-600 shadow-sm">Memuat…</p>}
      {!memuat && tampil.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-stone-600 shadow-sm">Tidak ada keputusan yang cocok dengan filter.</p>
      )}

      {!memuat && tampil.length > 0 && !kelompok && (
        <div className="space-y-3">{tampil.map((d) => <div key={d.id}>{renderBaris(d, true)}</div>)}</div>
      )}

      {!memuat && tampil.length > 0 && kelompok && (
        <div className="space-y-6">
          {kelompokNotula().map((g, i) => (
            <section key={i}>
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-[#7a1f2b] px-4 py-3 text-white">
                <Ikon nama="notula" className="h-5 w-5" />
                <h3 className="font-semibold">{g.judul}</h3>
                {g.tanggal && (
                  <span className="flex items-center gap-1 text-sm opacity-90">
                    <Ikon nama="kalender" className="h-3.5 w-3.5" /> {fmt(g.tanggal)}
                  </span>
                )}
                <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{g.items.length} keputusan</span>
              </div>
              <div className="space-y-3">
                {g.items.map((d) => (
                  <div key={d.id}>{renderBaris(d, false)}</div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
