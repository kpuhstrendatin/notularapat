import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Daftar nama notula yang aktif, urut abjad.
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from('notula_master')
    .select('judul')
    .eq('aktif', true)
    .order('judul');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => r.judul));
}

// Tambah nama notula baru ke daftar (kalau sudah ada, tidak dobel).
export async function POST(req: Request) {
  const { judul } = await req.json();
  const nama = String(judul ?? '').trim();
  if (!nama) return NextResponse.json({ error: 'Nama notula tidak boleh kosong.' }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from('notula_master')
    .upsert({ judul: nama }, { onConflict: 'judul', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, judul: nama });
}
