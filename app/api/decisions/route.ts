import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { STATUS, SUBBAG } from '@/lib/types';

const bad = (m: string) => NextResponse.json({ error: m }, { status: 400 });

export async function GET() {
  const { data, error } = await supabaseAdmin().from('decisions').select('*').order('tenggat');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Simpan keputusan ke rapat yang dipilih (meeting_id) atau ke rapat baru (meeting).
export async function POST(req: Request) {
  const body = await req.json();
  const items: any[] = body.items ?? [];
  if (!body.oleh?.trim()) return bad('Nama pengubah wajib diisi.');
  if (!Array.isArray(items) || items.length === 0) return bad('Tidak ada keputusan.');

  for (const it of items) {
    if (!it.isi?.trim() || !SUBBAG.includes(it.subbag) || !/^\d{4}-\d{2}-\d{2}$/.test(it.tenggat)) {
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

// Ubah status satu keputusan. Perubahan dicatat oleh trigger.
export async function PATCH(req: Request) {
  const { id, status, oleh } = await req.json();
  if (!oleh?.trim()) return bad('Nama pengubah wajib diisi.');
  if (!id || !STATUS.includes(status)) return bad('Permintaan tidak valid.');

  const { error } = await supabaseAdmin()
    .from('decisions')
    .update({ status, updated_by: oleh.trim() })
    .eq('id', id);
  if (error) return bad(error.message);
  return NextResponse.json({ ok: true });
}
