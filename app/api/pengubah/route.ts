import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Daftar nama pengubah yang aktif, urut abjad.
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from('pengubah')
    .select('nama')
    .eq('aktif', true)
    .order('nama');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => r.nama));
}
