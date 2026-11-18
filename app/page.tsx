import { supabaseAdmin } from '@/lib/supabase';
import { LBL, isLate, type Decision } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const { data, error } = await supabaseAdmin()
    .from('decisions')
    .select('id, nomor, isi, subbag, pic, tenggat, status, meeting_id')
    .order('tenggat');

  if (error) return <p className="card text-red-700">Gagal memuat data: {error.message}</p>;

  const rows = (data ?? []) as Decision[];
  const hitung = (f: (d: Decision) => boolean) => rows.filter(f).length;
  const total = rows.length;
  const selesai = hitung((d) => d.status === 'selesai');
  const pct = total ? Math.round((selesai / total) * 100) : 0;

  const kpi: [string, string | number][] = [
    ['Total', total],
    ['Belum', hitung((d) => d.status === 'belum')],
    ['Sedang', hitung((d) => d.status === 'sedang')],
    ['Selesai', selesai],
    ['Terlambat', hitung(isLate)],
    ['Penyelesaian', `${pct}%`],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {kpi.map(([label, nilai]) => (
          <div key={label} className="card">
            <p className="text-sm text-stone-500">{label}</p>
            <p className="text-3xl font-extrabold">{nilai}</p>
          </div>
        ))}
      </div>

      <section className="card">
        <h2 className="mb-2 font-bold">Daftar keputusan (tenggat terdekat)</h2>
        {rows.length === 0 && <p className="text-stone-500">Belum ada keputusan.</p>}
        {rows.map((d) => (
          <div key={d.id} className="flex flex-wrap justify-between gap-2 border-t py-2 text-sm first:border-t-0">
            <span>{d.isi}</span>
            <span className="whitespace-nowrap text-stone-500">
              {d.subbag} · {d.tenggat} · {isLate(d) ? 'Terlambat' : LBL[d.status]}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
