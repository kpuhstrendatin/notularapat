import { hariIni, type Decision } from '@/lib/types';

export type Periode = 'semua' | 'bulan' | 'triwulan' | 'bulanTertentu';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// 2026-11-18 -> 18 Nov 2026
export function fmt(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d} ${MON[+m - 1]} ${y}`;
}

export function tambahHari(n: number): string {
  const d = new Date(hariIni() + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
}

// Tanggal rapat keputusan; kalau tidak ada notula, pakai tanggal dibuat.
export function tanggalRapat(d: Decision): string {
  return d.meetings?.tanggal ?? d.created_at.slice(0, 10);
}

// Cek apakah tanggal (YYYY-MM-DD) masuk periode. bulanTertentu format YYYY-MM.
export function dalamPeriode(tgl: string, mode: Periode, bulanTertentu = ''): boolean {
  if (mode === 'semua') return true;
  const today = hariIni();
  if (mode === 'bulan') return tgl.slice(0, 7) === today.slice(0, 7);
  if (mode === 'bulanTertentu') return !!bulanTertentu && tgl.slice(0, 7) === bulanTertentu;
  const kuartal = (m: string) => Math.floor((+m - 1) / 3);
  return tgl.slice(0, 4) === today.slice(0, 4) && kuartal(tgl.slice(5, 7)) === kuartal(today.slice(5, 7));
}

// Unduh CSV. Pakai ';' supaya Excel versi Indonesia membukanya dengan benar.
export function unduhCSV(nama: string, header: string[], baris: string[][]): void {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const isi = [header, ...baris].map((r) => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob(['\uFEFF' + isi], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}
