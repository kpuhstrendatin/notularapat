'use client';

import { useEffect, useState } from 'react';
import { tampilkanPesan } from '@/components/Popup';
import { SUBBAG, LBL, STATUS, hariIni, isLate, type Decision, type Status } from '@/lib/types';
import { fmt, tambahHari, tanggalRapat, dalamPeriode, type Periode } from '@/lib/format';
import PilihPengubah from '@/components/PilihPengubah';
import Ikon from '@/components/Ikon';
import { StatusChip, StatusEdit } from '@/components/Status';

type Log = {
  id: number;
  isi: string;
  status_lama: Status | null;
  status_baru: Status;
  oleh: string | null;
  at: string;
};

const WARNA: Record<Status, string> = {
  belum: '#8c8587',
  sedang: '#2f5fa8',
  menunggu: '#c0702a',
  selesai: '#3a7a5a',
};

const kartu = 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm';

export default function Dashboard() {
  const [rows, setRows] = useState<Decision[] | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logErr, setLogErr] = useState('');
  const [periode, setPeriode] = useState<Periode>('semua');
  const [oleh, setOleh] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function muat() {
    try {
      const [a, b] = await Promise.all([
        fetch('/api/decisions', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/riwayat', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      if (!Array.isArray(a)) throw new Error(a.error ?? 'Gagal memuat keputusan');
      setRows(a);
      if (Array.isArray(b)) {
        setLogs(b.slice(0, 6));
        setLogErr('');
      } else {
        setLogs([]);
        setLogErr(b.error ?? 'Gagal memuat aktivitas');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kesalahan tidak diketahui');
    }
  }

  useEffect(() => {
    muat();
  }, []);

  async function ubahProgres(id: string, status: Status) {
    if (!oleh.trim()) return tampilkanPesan('Pilih nama pengubah dulu di bagian atas halaman.');
    setMsg('Menyimpan…');
    const r = await fetch('/api/decisions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, oleh }),
    });
    const j = await r.json();
    if (!r.ok) return tampilkanPesan(j.error);
    setMsg('Progres diperbarui.');
    muat();
  }

  if (err) return <p className="rounded-2xl bg-red-50 p-4 text-red-700">Gagal memuat data: {err}</p>;
  if (!rows) return <p className="rounded-2xl bg-white p-4 text-stone-500 shadow-sm">Memuat data…</p>;

  const dipilih = rows.filter((d) => dalamPeriode(tanggalRapat(d), periode));
  const total = dipilih.length;
  const cnt = (s: Status) => dipilih.filter((d) => d.status === s).length;
  const nLate = dipilih.filter(isLate).length;
  const selesai = cnt('selesai');
  const pct = total ? Math.round((selesai / total) * 100) : 0;

  const kpi = [
    { label: 'Total keputusan', nilai: total, warna: 'text-stone-900', ikon: 'daftar' },
    { label: 'Belum dikerjakan', nilai: cnt('belum'), warna: 'text-stone-600', ikon: 'jam' },
    { label: 'Sedang dikerjakan', nilai: cnt('sedang'), warna: 'text-[#2f5fa8]', ikon: 'pensil' },
    { label: 'Selesai', nilai: selesai, warna: 'text-[#3a7a5a]', ikon: 'cek' },
    { label: 'Terlambat', nilai: nLate, warna: 'text-[#b3261e]', ikon: 'peringatan' },
    { label: 'Penyelesaian', nilai: `${pct}%`, warna: 'text-[#7a1f2b]', ikon: 'riwayat' },
  ];

  const grup = new Map<string, { judul: string; tanggal: string | null; items: Decision[] }>();
  dipilih.forEach((d) => {
    const k = d.meeting_id ?? 'tanpa';
    if (!grup.has(k)) grup.set(k, { judul: d.meetings?.judul ?? 'Tanpa notula', tanggal: d.meetings?.tanggal ?? null, items: [] });
    grup.get(k)!.items.push(d);
  });
  const perNotula = Array.from(grup.values())
    .sort((a, b) => (b.tanggal ?? '').localeCompare(a.tanggal ?? ''))
    .slice(0, 6);

  const hariIniStr = hariIni();
  const batas7 = tambahHari(7);
  const tenggat7 = dipilih
    .filter((d) => d.status !== 'selesai' && d.tenggat >= hariIniStr && d.tenggat <= batas7)
    .sort((a, b) => a.tenggat.localeCompare(b.tenggat));
  const terlambatList = dipilih.filter(isLate).sort((a, b) => a.tenggat.localeCompare(b.tenggat)).slice(0, 5);
  const terbaru = [...dipilih].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  // Perhatian Bersama: tanpa status. Tenggat dipakai sebagai tanggal sampai kapan pesan ditampilkan.
  const bersama = rows
    .filter((d) => d.subbag === 'Semua Subbag' && d.tenggat >= hariIni())
    .sort((a, b) => a.tenggat.localeCompare(b.tenggat));

  const perSubbag = SUBBAG.filter((s) => s !== 'Semua Subbag').map((s) => {
    const items = dipilih.filter((d) => d.subbag === s);
    return { s, n: items.length, seg: STATUS.map((st) => ({ st, n: items.filter((d) => d.status === st).length })) };
  }).filter((x) => x.n > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-stone-500">
            <Ikon nama="kalender" className="h-4 w-4" /> Periode (tanggal rapat):
          </span>
          <select className="rounded-lg border p-2 text-sm" value={periode} onChange={(e) => setPeriode(e.target.value as Periode)}>
            <option value="semua">Semua</option>
            <option value="bulan">Bulan ini</option>
            <option value="triwulan">Triwulan ini</option>
          </select>
        </div>
        <div className="w-full md:w-80">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
            <Ikon nama="orang" className="h-3.5 w-3.5" /> Nama pengubah (wajib untuk mengubah progres)
          </label>
          <PilihPengubah value={oleh} onChange={setOleh} className="w-full rounded-lg border p-2 text-sm" />
        </div>
      </div>
      {msg && <p className="text-sm text-stone-600">{msg}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {kpi.map((k) => (
          <div key={k.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-stone-500">
              <p className="text-sm">{k.label}</p>
              <Ikon nama={k.ikon} className="h-4 w-4" />
            </div>
            <p className={`mt-1 text-3xl font-extrabold ${k.warna}`}>{k.nilai}</p>
          </div>
        ))}
      </div>

      <section className={kartu}>
        <h2 className="font-bold">Progres tindak lanjut</h2>
        <div className="mt-3 flex h-3.5 overflow-hidden rounded-full bg-stone-200">
          {STATUS.map((s) => (
            <div key={s} style={{ width: `${total ? (cnt(s) / total) * 100 : 0}%`, background: WARNA[s] }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
          {STATUS.map((s) => (
            <span key={s} className="flex items-center gap-2">
              <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: WARNA[s] }} />
              {LBL[s]} {cnt(s)}
            </span>
          ))}
        </div>
      </section>

      <section className={kartu}>
        <h2 className="font-bold">Per subbag</h2>
        <div className="mt-3 space-y-3">
          {perSubbag.map((x) => (
            <div key={x.s}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{x.s}</span>
                <span className="text-stone-500">
                  {x.seg.find((g) => g.st === 'selesai')?.n ?? 0} dari {x.n} selesai
                </span>
              </div>
              <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-stone-200">
                {x.seg.map((g) =>
                  g.n ? <div key={g.st} style={{ width: `${(g.n / x.n) * 100}%`, background: WARNA[g.st] }} title={`${LBL[g.st]}: ${g.n}`} /> : null,
                )}
              </div>
            </div>
          ))}
          {perSubbag.length === 0 && <p className="text-sm text-stone-500">Belum ada data pada periode ini.</p>}
        </div>
      </section>

      <section className={kartu}>
        <h2 className="flex items-center gap-2 font-bold">
          <Ikon nama="peringatan" className="h-4 w-4 text-[#7a1f2b]" /> Perhatian Bersama
          <span className="text-sm font-normal text-stone-500">(untuk Semua Subbag, tampil sampai tanggal yang ditentukan)</span>
        </h2>
        <div className="mt-3 divide-y">
          {bersama.map((d) => (
            <div key={d.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{d.isi}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-stone-500">
                  {d.pic && (
                    <span className="flex items-center gap-1">
                      <Ikon nama="orang" className="h-3.5 w-3.5" /> {d.pic}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Ikon nama="kalender" className="h-3.5 w-3.5" /> Tampil sampai {fmt(d.tenggat)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {bersama.length === 0 && <p className="py-2 text-sm text-stone-500">Tidak ada pesan bersama yang sedang ditampilkan.</p>}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={kartu}>
          <h2 className="font-bold">Ringkasan per notula</h2>
          <div className="mt-3 space-y-4">
            {perNotula.map((g, i) => {
              const sel = g.items.filter((d) => d.status === 'selesai').length;
              const p = Math.round((sel / g.items.length) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium">{g.judul}</span>
                    <span className="text-stone-500">
                      {g.tanggal ? fmt(g.tanggal) + ' · ' : ''}
                      {sel} dari {g.items.length} selesai
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-[#7a1f2b]" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
            {perNotula.length === 0 && <p className="text-sm text-stone-500">Belum ada notula pada periode ini.</p>}
          </div>
        </section>

        <section className={kartu}>
          <h2 className="font-bold">Perlu perhatian</h2>
          <div className="mt-3 space-y-4 text-sm">
            {terlambatList.map((d) => (
              <div key={d.id} className="rounded-xl border-l-4 border-red-600 bg-red-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                  <Ikon nama="peringatan" className="h-3.5 w-3.5" /> Terlambat · {fmt(d.tenggat)}
                </div>
                <div className="mt-1 font-medium">{d.isi}</div>
                <div className="mt-2">
                  <StatusEdit value={d.status} onChange={(s) => ubahProgres(d.id, s)} />
                </div>
              </div>
            ))}
            {terlambatList.length === 0 && <p className="text-stone-500">Tidak ada keputusan yang terlambat.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={kartu}>
          <h2 className="font-bold">Tenggat 7 hari ke depan</h2>
          <div className="mt-3 space-y-4 text-sm">
            {tenggat7.map((d) => (
              <div key={d.id} className="border-b pb-3 last:border-0">
                <div className="font-medium">{d.isi}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1"><Ikon nama="gedung" className="h-3.5 w-3.5" />{d.subbag}</span>
                  {d.pic && <span className="flex items-center gap-1"><Ikon nama="orang" className="h-3.5 w-3.5" />{d.pic}</span>}
                  <span className="flex items-center gap-1"><Ikon nama="kalender" className="h-3.5 w-3.5" />{fmt(d.tenggat)}</span>
                </div>
                <div className="mt-2">
                  <StatusEdit value={d.status} onChange={(s) => ubahProgres(d.id, s)} />
                </div>
              </div>
            ))}
            {tenggat7.length === 0 && <p className="text-stone-500">Tidak ada tenggat dalam 7 hari ke depan.</p>}
          </div>
        </section>

        <section className={kartu}>
          <h2 className="font-bold">Aktivitas terbaru</h2>
          {logErr && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{logErr}</p>}
          <div className="mt-3 space-y-3 text-sm">
            {logs.map((l) => (
              <div key={l.id} className="border-b pb-3 last:border-0">
                <div className="font-medium">{l.isi}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  {l.status_lama ? <StatusChip status={l.status_lama} /> : null}
                  <span>→</span>
                  <StatusChip status={l.status_baru} />
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {l.oleh ?? '—'} ·{' '}
                  {new Date(l.at).toLocaleString('id-ID', { timeZone: 'Asia/Makassar', dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            ))}
            {!logErr && logs.length === 0 && <p className="text-stone-500">Belum ada perubahan progres.</p>}
          </div>
        </section>
      </div>

      <section className={kartu}>
        <h2 className="font-bold">Keputusan terbaru</h2>
        <div className="mt-2 divide-y">
          {terbaru.map((d) => (
            <div key={d.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:gap-4">
              <div className="min-w-0 flex-1 text-sm font-medium">{d.isi}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500 md:flex-none">
                <span>{d.subbag}</span>
                <span>{fmt(d.tenggat)}</span>
                {isLate(d) ? (
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Terlambat</span>
                ) : (
                  <StatusChip status={d.status} />
                )}
              </div>
            </div>
          ))}
          {terbaru.length === 0 && <p className="py-2 text-stone-500">Belum ada keputusan pada periode ini.</p>}
        </div>
      </section>
    </div>
  );
}
