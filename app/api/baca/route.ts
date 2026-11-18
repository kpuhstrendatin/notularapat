import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET ?ids=a,b,c -> { [decision_id]: [{ nama, at }] }
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',').filter(Boolean);
  if (!ids.length) return NextResponse.json({});

  const { data, error } = await supabaseAdmin()
    .from('tanda_baca')
    .select('decision_id, nama, at')
    .in('decision_id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasil: Record<string, { nama: string; at: string }[]> = {};
  (data ?? []).forEach((r) => {
    if (!hasil[r.decision_id]) hasil[r.decision_id] = [];
    hasil[r.decision_id].push({ nama: r.nama, at: r.at });
  });
  return NextResponse.json(hasil);
}

// POST { decision_id, nama } -> tandai sudah dibaca
export async function POST(req: Request) {
  const { decision_id, nama } = await req.json();
  const n = String(nama ?? '').trim();
  if (!decision_id || !n) return NextResponse.json({ error: 'Pilih nama pengubah terlebih dahulu.' }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from('tanda_baca')
    .upsert({ decision_id, nama: n }, { onConflict: 'decision_id,nama', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
