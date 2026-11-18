'use client';

import { useEffect, useState } from 'react';
import { LBL, STATUS, SUBBAG, isLate, hariIni, type Decision, type Status } from '@/lib/types';
import { fmt, tanggalRapat } from '@/lib/format';
import { Btn, Pilih, fieldCls, kartu, Label } from '@/components/ui';
import Ikon from '@/components/Ikon';

type Jenis = 'triwulan' | 'bulan' | 'tahun';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const WARNA: Record<Status, string> = { belum: '#8c8587', sedang: '#2f5fa8', menunggu: '#c0702a', selesai: '#3a7a5a' };

export default function Laporan() {
  const bulanIni = hariIni().slice(5, 7);
  const [rows, setRows] = useState<Decision[]>([]);
  const [jenis, setJenis] = useState<Jenis>('triwulan');
  const [tahun, setTahun] = useState(hariIni().slice(0, 4));
  const [nilai, setNilai] = useState(String(Math.floor((+bulanIni - 1) / 3) + 1));

  useEffect(() => {
    fetch('/api/decisions', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setRows(Array.isArray(j) ? j : []));
  }, []);

  function gantiJenis(j: Jenis) {
    setJenis(j);
    setNilai(j === 'triwulan' ? '1' : j === 'bulan' ? bulanIni : '');
  }

  // Keputusan dengan tanggal rapat dalam periode yang dipilih
  const masuk = (d: Decision) => {
    const t = tanggalRapat(d);
    if (t.slice(0, 4) !== tahun) return false;
    if (jenis === 'tahun') return true;
    if (jenis === 'bulan') return t.slice(5, 7) === nilai.padStart(2, '0');
    return String(Math.floor((+t.slice(5, 7) - 1) / 3) + 1) === nilai;
  };

  const dipilih = rows.filter(masuk).sort((a, b) => tanggalRapat(a).localeCompare(tanggalRapat(b)));
  const cnt = (s: Status) => dipilih.filter((d) => d.status === s).length;
  const total = dipilih.length;
  const selesai = cnt('selesai');
  const pct = total ? Math.round((selesai / total) * 100) : 0;
  const nLate = dipilih.filter(isLate).length;

  const judulPeriode =
    jenis === 'tahun'
      ? `Tahun ${tahun}`
      : jenis === 'bulan'
        ? `${BULAN[+nilai - 1]} ${tahun}`
        : `Triwulan ${nilai} Tahun ${tahun}`;

  return (
    <div className="space-y-5">
      <section className={`${kartu} print:hidden`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Laporan</h2>
            <p className="mt-1 text-sm text-stone-500">Pilih periode, lalu cetak atau simpan sebagai PDF.</p>
          </div>
          <Btn onClick={() => window.print()}>
            <Ikon nama="unduh" className="h-4 w-4" /> Cetak / Simpan PDF
          </Btn>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <Label icon="kalender">Jenis periode</Label>
            <Pilih value={jenis} onChange={(e) => gantiJenis(e.target.value as Jenis)}>
              <option value="triwulan">Triwulan</option>
              <option value="bulan">Bulan</option>
              <option value="tahun">Tahun</option>
            </Pilih>
          </div>
          {jenis !== 'tahun' && (
            <div>
              <Label icon="kalender">{jenis === 'triwulan' ? 'Triwulan' : 'Bulan'}</Label>
              <Pilih value={nilai} onChange={(e) => setNilai(e.target.value)}>
                {jenis === 'triwulan'
                  ? ['1', '2', '3', '4'].map((q) => (
                      <option key={q} value={q}>
                        Triwulan {q}
                      </option>
                    ))
                  : BULAN.map((b, i) => (
                      <option key={b} value={String(i + 1)}>
                        {b}
                      </option>
                    ))}
              </Pilih>
            </div>
          )}
          <div>
            <Label icon="kalender">Tahun</Label>
            <input className={fieldCls} type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} />
          </div>
        </div>
      </section>

      <article id="laporan" className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="border-b-2 border-[#7a1f2b] pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">KPU Kabupaten Hulu Sungai Tengah</p>
          <h1 className="mt-1 text-2xl font-extrabold text-stone-900">Laporan Tindak Lanjut Keputusan Rapat</h1>
          <p className="mt-1 text-sm font-semibold text-[#7a1f2b]">{judulPeriode}</p>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
          {[
            ['Total', total],
            ['Selesai', selesai],
            ['Sedang', cnt('sedang')],
            ['Belum', cnt('belum')],
            ['Menunggu', cnt('menunggu')],
            ['Terlambat', nLate],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-xl border border-stone-200 p-3">
              <div className="text-xs text-stone-500">{l}</div>
              <div className="text-2xl font-extrabold text-stone-900">{v}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-stone-700">
          Penyelesaian periode ini: <b>{pct}%</b> ({selesai} dari {total} keputusan).
        </p>

        <h3 className="mt-6 font-bold text-stone-900">Per subbag</h3>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-stone-500">
              <th className="py-2">Subbag</th>
              <th className="py-2 text-right">Jumlah</th>
              <th className="py-2 text-right">Selesai</th>
              <th className="py-2 text-right">Persen</th>
            </tr>
          </thead>
          <tbody>
            {SUBBAG.map((s) => {
              const items = dipilih.filter((d) => d.subbag === s);
              if (!items.length) return null;
              const sel = items.filter((d) => d.status === 'selesai').length;
              return (
                <tr key={s} className="border-b">
                  <td className="py-2">{s}</td>
                  <td className="py-2 text-right">{items.length}</td>
                  <td className="py-2 text-right">{sel}</td>
                  <td className="py-2 text-right font-semibold">{Math.round((sel / items.length) * 100)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h3 className="mt-6 font-bold text-stone-900">Daftar keputusan</h3>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-stone-500">
              <th className="py-2">No</th>
              <th className="py-2">Keputusan</th>
              <th className="py-2">Sumber / tanggal</th>
              <th className="py-2">PJ subbag</th>
              <th className="py-2">Tenggat</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {dipilih.map((d, i) => (
              <tr key={d.id} className="border-b align-top">
                <td className="py-2">{i + 1}</td>
                <td className="py-2 pr-3">
                  {d.isi}
                  {d.pic && <div className="text-xs text-stone-500">PJ: {d.pic}</div>}
                </td>
                <td className="py-2 pr-3 text-xs text-stone-600">
                  {d.meetings?.judul ?? '—'}
                  {d.meetings?.tanggal ? <div>{fmt(d.meetings.tanggal)}</div> : null}
                </td>
                <td className="py-2 pr-3">{d.subbag}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{fmt(d.tenggat)}</td>
                <td className="py-2">
                  <span className="font-semibold" style={{ color: isLate(d) ? '#b3261e' : WARNA[d.status] }}>
                    {isLate(d) ? 'Terlambat' : LBL[d.status]}
                  </span>
                </td>
              </tr>
            ))}
            {dipilih.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-stone-500">
                  Tidak ada keputusan pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          <div />
          <div className="text-center">
            <p>Hulu Sungai Tengah, {fmt(hariIni())}</p>
            <p className="mt-1">Mengetahui,</p>
            <div className="h-20" />
            <p className="font-bold">(…………………………………)</p>
          </div>
        </div>
      </article>
    </div>
  );
}
