'use client';

import { useEffect, useState } from 'react';
import { LBL, STATUS, SUBBAG, isLate, type Decision, type Status } from '@/lib/types';
import { fmt, unduhCSV } from '@/lib/format';
import PilihPengubah from '@/components/PilihPengubah';
import Ikon from '@/components/Ikon';
import { StatusPilih, StatusChip, STATUS_STYLE } from '@/components/Status';

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
  const [oleh, setOleh] = useState('');
  const [msg, setMsg] = useState('');
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
      setMsg('Pilih nama pengubah dulu di bagian atas halaman.');
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
      setMsg(j.error);
      return false;
    }
    return true;
  }

  async function ubahProgres(id: string, status: Status) {
    if (!cekOleh()) return;
    setMsg('Menyimpan…');
    if (await kirim({ id, status })) {
      setMsg('Progres diperbarui.');
      muat();
    }
  }

  function bukaEdit(d: Decision) {
    setEditId(d.id);
    setForm({ isi: d.isi, subbag: d.subbag, pic: d.pic ?? '', tenggat: d.tenggat, status: d.status });
    setMsg('');
  }

  async function simpanEdit(id: string) {
    if (!cekOleh()) return;
    if (!form.isi.trim()) return setMsg('Isi keputusan tidak boleh kosong.');
    setMsg('Menyimpan…');
    if (await kirim({ id, ...form })) {
      setEditId(null);
      setMsg('Perubahan disimpan.');
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
    const garis = terlambat ? 'border-red-600' : STATUS_STYLE[d.status].garis;
    return (
      <div
        className={`rounded-xl border border-l-4 bg-white p-4 shadow-sm ${garis} ${terlambat ? 'bg-red-50/60' : ''}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5">
          <div className="min-w-0 flex-1">
            <div className="font-semibold leading-snug text-stone-900">{d.isi}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600">
              {tampilNotula && (
                <span className="flex items-center gap-1.5">
                  <Ikon nama="notula" className="h-3.5 w-3.5 text-stone-400" />
                  {d.meetings?.judul ?? 'Tanpa notula'}
                  {d.meetings?.tanggal ? ` · ${fmt(d.meetings.tanggal)}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Ikon nama="gedung" className="h-3.5 w-3.5 text-stone-400" /> {d.subbag}
              </span>
              {d.pic && (
                <span className="flex items-center gap-1.5">
                  <Ikon nama="orang" className="h-3.5 w-3.5 text-stone-400" /> {d.pic}
                </span>
              )}
              <span
                className={`flex items-center gap-1.5 ${terlambat ? 'font-semibold text-red-700' : ''}`}
              >
                <Ikon nama="kalender" className="h-3.5 w-3.5" /> Tenggat {fmt(d.tenggat)}
                {terlambat && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] text-white">TERLAMBAT</span>}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <StatusPilih kecil value={d.status} onChange={(s) => ubahProgres(d.id, s)} />
            <button
              onClick={() => (editId === d.id ? setEditId(null) : bukaEdit(d))}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              <Ikon nama="pensil" className="h-3.5 w-3.5" /> {editId === d.id ? 'Tutup edit' : 'Edit keputusan'}
            </button>
          </div>
        </div>

        {editId === d.id && (
          <div className="mt-4 grid gap-3 rounded-xl bg-stone-50 p-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-stone-500">Isi keputusan</label>
              <textarea
                className="w-full rounded-lg border p-2"
                rows={2}
                value={form.isi}
                onChange={(e) => setForm({ ...form, isi: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Penanggung jawab subbag</label>
              <select className="w-full rounded-lg border p-2" value={form.subbag} onChange={(e) => setForm({ ...form, subbag: e.target.value })}>
                {SUBBAG.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Penanggung jawab orang (opsional)</label>
              <PilihPengubah value={form.pic} onChange={(v) => setForm({ ...form, pic: v })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Tenggat</label>
              <input type="date" className="w-full rounded-lg border p-2" value={form.tenggat} onChange={(e) => setForm({ ...form, tenggat: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Progres</label>
              <StatusPilih value={form.status} onChange={(s) => setForm({ ...form, status: s })} />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-sm font-semibold text-white" onClick={() => simpanEdit(d.id)}>
                Simpan perubahan
              </button>
              <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setEditId(null)}>
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
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
          <button onClick={ekspor} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-stone-50">
            <Ikon nama="unduh" className="h-4 w-4" /> Ekspor ke Excel (CSV)
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <input
            className="rounded-lg border p-2 md:col-span-2"
            placeholder="Cari keputusan, notula, subbag, atau nama"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
          <select className="rounded-lg border p-2" value={subbag} onChange={(e) => setSubbag(e.target.value)}>
            <option value="">Semua subbag</option>
            {SUBBAG.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="rounded-lg border p-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Semua progres</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {LBL[s]}
              </option>
            ))}
            <option value="terlambat">Terlambat</option>
          </select>
          <select className="rounded-lg border p-2" value={urut} onChange={(e) => setUrut(e.target.value as Urut)}>
            {(Object.keys(URUT_LABEL) as Urut[]).map((u) => (
              <option key={u} value={u}>
                Urut: {URUT_LABEL[u]}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-lg border p-2 text-sm">
            <input type="checkbox" checked={kelompok} onChange={(e) => setKelompok(e.target.checked)} />
            Per notula
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <Ikon nama="orang" className="h-3.5 w-3.5" /> Nama pengubah (wajib untuk mengubah)
            </label>
            <PilihPengubah value={oleh} onChange={setOleh} />
          </div>
          {msg && <p className="self-end text-sm text-stone-600 md:col-span-2">{msg}</p>}
        </div>
      </section>

      {memuat && <p className="rounded-2xl bg-white p-4 text-stone-500 shadow-sm">Memuat…</p>}
      {!memuat && tampil.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-stone-500 shadow-sm">Tidak ada keputusan yang cocok dengan filter.</p>
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
