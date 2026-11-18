import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Daftar rapat, diurutkan dari yang terakhir diupdate.
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from('meetings')
    .select('id, judul, tanggal, updated_at')
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
