import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 100 perubahan status terakhir, beserta isi keputusannya.
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from('decision_log')
    .select('id, status_lama, status_baru, oleh, at, decisions(isi)')
    .order('at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
