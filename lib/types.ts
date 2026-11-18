export const SUBBAG: string[] = [
  'Subbag Teknis',
  'Subbag Hukum',
  'Subbag Umum',
  'Subbag Keuangan',
  'Subbag Data',
  'Subbag Sosdiklih',
];

export const STATUS = ['belum', 'sedang', 'menunggu', 'selesai'] as const;
export type Status = (typeof STATUS)[number];

export const LBL: Record<Status, string> = {
  belum: 'Belum dikerjakan',
  sedang: 'Sedang dikerjakan',
  menunggu: 'Menunggu pihak lain',
  selesai: 'Selesai',
};

export type Decision = {
  id: string;
  nomor: number | null;
  isi: string;
  subbag: string;
  pic: string | null;
  tenggat: string; // YYYY-MM-DD
  status: Status;
  meeting_id: string | null;
};

export type Draft = { isi: string; subbag: string; tenggat: string; on: boolean };

// Tanggal hari ini menurut zona WITA, supaya "terlambat" tidak bergeser di dini hari.
export function hariIni(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
}

export function isLate(d: { tenggat: string; status: string }): boolean {
  return d.status !== 'selesai' && d.tenggat < hariIni();
}
