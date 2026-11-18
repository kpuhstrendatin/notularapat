import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { STATUS, SUBBAG } from '@/lib/types';

export const dynamic = 'force-dynamic';

const bad = (m: string) => NextResponse.json({ error: m }, { status: 400 });
const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

// Semua keputusan, beserta judul dan tanggal notula asalnya.
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from('decisions')
    .select('*, meetings(judul, tanggal)')
    .order('tenggat');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Simpan rapat (opsional) dan keputusan-keputusannya.
export async function POST(req: Request) {
  const body = await req.json();
  const items: any[] = body.items ?? [];
  if (!body.oleh?.trim()) return bad('Nama pengubah wajib diisi.');
  if (!Array.isArray(items) || items.length === 0) return bad('Tidak ada keputusan.');

  for (const it of items) {
    if (!it.isi?.trim() || !SUBBAG.includes(it.subbag) || !TANGGAL.test(it.tenggat)) {
      return bad('Data keputusan tidak lengkap.');
    }
  }

  const db = supabaseAdmin();
  let meetingId: string | null = body.meeting_id ?? null;

  if (!meetingId && body.meeting?.judul) {
    const { data, error } = await db
      .from('meetings')
      .insert({ judul: body.meeting.judul, tanggal: body.meeting.tanggal || null })
      .select('id')
      .single();
    if (error) return bad(error.message);
    meetingId = data.id;
  }

  const rows = items.map((it, i) => ({
    meeting_id: meetingId,
    nomor: i + 1,
    isi: it.isi.trim(),
    subbag: it.subbag,
    pic: it.pic || null,
    tenggat: it.tenggat,
    status: STATUS.includes(it.status) ? it.status : 'belum',
    updated_by: body.oleh.trim(),
  }));

  const { error } = await db.from('decisions').insert(rows);
  if (error) return bad(error.message);
  return NextResponse.json({ ok: true, jumlah: rows.length, meeting_id: meetingId });
}

// Ubah satu keputusan. Hanya field yang dikirim yang diubah.
// Perubahan status otomatis dicatat di riwayat oleh trigger.
export async function PATCH(req: Request) {
  const b = await req.json();
  if (!b.oleh?.trim()) return bad('Nama pengubah wajib diisi.');
  if (!b.id) return bad('Keputusan tidak ditemukan.');

  const upd: Record<string, unknown> = { updated_by: b.oleh.trim() };

  if (b.isi !== undefined) {
    if (!String(b.isi).trim()) return bad('Isi keputusan tidak boleh kosong.');
    upd.isi = String(b.isi).trim();
  }
  if (b.subbag !== undefined) {
    if (!SUBBAG.includes(b.subbag)) return bad('Penanggung jawab subbag tidak valid.');
    upd.subbag = b.subbag;
  }
  if (b.tenggat !== undefined) {
    if (!TANGGAL.test(b.tenggat)) return bad('Tenggat tidak valid.');
    upd.tenggat = b.tenggat;
  }
  if (b.pic !== undefined) upd.pic = b.pic || null;
  if (b.status !== undefined) {
    if (!STATUS.includes(b.status)) return bad('Status tidak valid.');
    upd.status = b.status;
  }

  const { error } = await supabaseAdmin().from('decisions').update(upd).eq('id', b.id);
  if (error) return bad(error.message);
  return NextResponse.json({ ok: true });
}
