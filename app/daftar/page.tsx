'use client';

import { useEffect, useState } from 'react';
import { LBL, STATUS, SUBBAG, isLate, type Decision, type Status } from '@/lib/types';
import { fmt, unduhCSV, tanggalRapat } from '@/lib/format';
import PilihPengubah from '@/components/PilihPengubah';

type Urut = 'tenggat-asc' | 'tenggat-desc' | 'dibuat' | 'subbag';

const URUT_LABEL: Record<Urut, string> = {
  'tenggat-asc': 'Tenggat terdekat',
  'tenggat-desc': 'Tenggat terjauh',
  dibuat: 'Terbaru dibuat',
  subbag: 'Subbag (A-Z)',
};

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

  function cekOleh(): boolean {
    if (!oleh.trim()) {
      setMsg('Pilih nama pengubah dulu.');
      return false;
    }
    return true;
  }

  async function ubahStatus(id: string, status: Status) {
    if (!cekOleh()) return;
    setMsg('Menyimpan…');
    if (await kirim({ id, status })) {
      setMsg('Status diperbarui.');
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
      const cocokCari = !cari || (d.isi + ' ' + d.subbag + ' ' + (d.pic ?? '')).toLowerCase().includes(cari.toLowerCase());
      const cocokStatus = !filter || (filter === 'terlambat' ? isLate(d) : d.status === filter);
      const cocokSubbag = !subbag || d.subbag === subbag;
      return cocokCari && cocokStatus && cocokSubbag;
    })
    .sort(cmp);

  // Dikelompokkan per notula, notula terbaru di atas
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

  const renderBaris = (d: Decision) => {
    const terlambat = isLate(d);
    return (
      <div className={`border-t py-3 ${terlambat ? 'rounded-lg bg-red-50 px-3' : ''}`}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{d.isi}</div>
            <div className="mt-0.5 text-xs text-stone-500">
              {!kelompok && (d.meetings?.judul ?? 'Tanpa notula')}
              {!kelompok && d.meetings?.tanggal ? ` · ${fmt(d.meetings.tanggal)}` : ''}
              {d.pic ? ` · PJ: ${d.pic}` : ''}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-500 md:flex-none">
            <span>{d.subbag}</span>
            <span>{fmt(d.tenggat)}</span>
            {terlambat && <span className="font-semibold text-[#b3261e]">Terlambat</span>}
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
            <button
              onClick={() => (editId === d.id ? setEditId(null) : bukaEdit(d))}
              className="rounded-lg border px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              {editId === d.id ? 'Tutup' : 'Edit'}
            </button>
          </div>
        </div>

        {editId === d.id && (
          <div className="mt-3 grid gap-3 rounded-xl bg-stone-50 p-3 md:grid-cols-2">
            <textarea
              className="rounded-lg border p-2 md:col-span-2"
              rows={2}
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
            />
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Penanggung jawab subbag</label>
              <select
                className="w-full rounded-lg border p-2"
                value={form.subbag}
                onChange={(e) => setForm({ ...form, subbag: e.target.value })}
              >
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
              <input
                type="date"
                className="w-full rounded-lg border p-2"
                value={form.tenggat}
                onChange={(e) => setForm({ ...form, tenggat: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">Status</label>
              <select
                className="w-full rounded-lg border p-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {LBL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-white" onClick={() => simpanEdit(d.id)}>
                Simpan perubahan
              </button>
              <button className="rounded-lg border px-4 py-2" onClick={() => setEditId(null)}>
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
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Daftar Keputusan</h2>
          <button onClick={ekspor} className="rounded-lg border px-3 py-2 text-sm hover:bg-stone-50">
            Ekspor ke Excel (CSV)
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-6">
          <input
            className="rounded-lg border p-2 md:col-span-2"
            placeholder="Cari kata kunci"
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
            <option value="">Semua status</option>
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
            Kelompokkan per notula
          </label>
        </div>

        <div className="mt-3">
          <PilihPengubah value={oleh} onChange={setOleh} className="rounded-lg border p-2 md:w-1/3" />
          <p className="mt-2 text-sm text-stone-500">{msg || 'Pilih nama pengubah sebelum mengubah status atau data.'}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        {memuat && <p className="text-stone-500">Memuat…</p>}
        {!memuat && tampil.length === 0 && <p className="text-stone-500">Tidak ada keputusan yang cocok.</p>}

        {!memuat &&
          (kelompok
            ? kelompokNotula().map((g, i) => (
                <div key={i} className="mt-4 first:mt-0">
                  <div className="mb-1 flex flex-wrap items-baseline gap-2 border-b pb-2">
                    <h3 className="font-semibold">{g.judul}</h3>
                    {g.tanggal && <span className="text-sm text-stone-500">{fmt(g.tanggal)}</span>}
                    <span className="text-sm text-stone-500">· {g.items.length} keputusan</span>
                  </div>
                  {g.items.map((d) => (
                    <div key={d.id}>{renderBaris(d)}</div>
                  ))}
                </div>
              ))
            : tampil.map((d) => <div key={d.id}>{renderBaris(d)}</div>))}
      </section>
    </div>
  );
}
