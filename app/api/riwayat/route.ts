import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 100 perubahan status terakhir, lengkap dengan isi keputusannya.
export async function GET() {
  const db = supabaseAdmin();

  const { data: log, error } = await db
    .from('decision_log')
    .select('id, decision_id, status_lama, status_baru, oleh, at')
    .order('at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Gagal membaca riwayat: ' + error.message }, { status: 500 });

  const ids = Array.from(new Set((log ?? []).map((l) => l.decision_id)));
  const isi: Record<string, string> = {};
  if (ids.length) {
    const { data: ds, error: e2 } = await db.from('decisions').select('id, isi').in('id', ids);
    if (e2) return NextResponse.json({ error: 'Gagal membaca keputusan: ' + e2.message }, { status: 500 });
    (ds ?? []).forEach((d) => (isi[d.id] = d.isi));
  }

  return NextResponse.json(
    (log ?? []).map((l) => ({ ...l, isi: isi[l.decision_id] ?? '(keputusan sudah dihapus)' })),
  );
}
