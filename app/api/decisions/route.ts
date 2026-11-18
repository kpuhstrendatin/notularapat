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

// Simpan keputusan ke notula (nama + tanggal). Notula yang sudah ada dipakai lagi.
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
    const judul = String(body.meeting.judul).trim();
    const tgl: string | null = body.meeting.tanggal || null;
    if (!judul) return bad('Nama notula wajib diisi.');

    let q = db.from('meetings').select('id').eq('judul', judul);
    q = tgl ? q.eq('tanggal', tgl) : q.is('tanggal', null);
    const { data: ada, error: e1 } = await q.limit(1).maybeSingle();
    if (e1) return bad(e1.message);

    if (ada) {
      meetingId = ada.id;
    } else {
      const { data, error } = await db.from('meetings').insert({ judul, tanggal: tgl }).select('id').single();
      if (error) return bad(error.message);
      meetingId = data.id;
    }
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
// Perubahan status dicatat oleh trigger; perubahan isi, PJ, dan tenggat dicatat di sini.
export async function PATCH(req: Request) {
  const b = await req.json();
  if (!b.oleh?.trim()) return bad('Nama pengubah wajib diisi.');
  if (!b.id) return bad('Keputusan tidak ditemukan.');

  const db = supabaseAdmin();
  const { data: lama, error: e0 } = await db
    .from('decisions')
    .select('isi, subbag, pic, tenggat, status')
    .eq('id', b.id)
    .single();
  if (e0 || !lama) return bad('Keputusan tidak ditemukan.');

  const oleh = b.oleh.trim();
  const upd: Record<string, unknown> = { updated_by: oleh };

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

  const { error } = await db.from('decisions').update(upd).eq('id', b.id);
  if (error) return bad(error.message);

  // Catat perubahan isi, penanggung jawab, dan tenggat ke riwayat
  const catatan: string[] = [];
  if (upd.isi !== undefined && upd.isi !== lama.isi) catatan.push('Isi keputusan diubah');
  if (upd.subbag !== undefined && upd.subbag !== lama.subbag) {
    catatan.push(`Penanggung jawab subbag: ${lama.subbag} → ${upd.subbag}`);
  }
  if ('pic' in upd && (upd.pic ?? null) !== (lama.pic ?? null)) {
    catatan.push(`Penanggung jawab orang: ${lama.pic ?? '—'} → ${upd.pic ?? '—'}`);
  }
  if (upd.tenggat !== undefined && upd.tenggat !== lama.tenggat) {
    catatan.push(`Tenggat: ${lama.tenggat} → ${upd.tenggat}`);
  }
  if (catatan.length) {
    await db.from('decision_log').insert(
      catatan.map((k) => ({
        decision_id: b.id,
        status_lama: lama.status,
        status_baru: lama.status,
        oleh,
        jenis: 'edit',
        keterangan: k,
      })),
    );
  }

  return NextResponse.json({ ok: true });
}
