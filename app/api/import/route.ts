import { NextResponse } from 'next/server';
import { extractDecisions } from '@/lib/gemini';
import { SUBBAG } from '@/lib/types';

// Mengembalikan draf saja. Tidak menyimpan apa pun ke database.
export async function POST(req: Request) {
  const { teks } = await req.json();
  if (typeof teks !== 'string' || teks.trim().length < 50) {
    return NextResponse.json({ error: 'Teks notula terlalu pendek.' }, { status: 400 });
  }
  if (teks.length > 60000) {
    return NextResponse.json({ error: 'Teks terlalu panjang. Pecah notula menjadi beberapa bagian.' }, { status: 400 });
  }
  try {
    const raw = await extractDecisions(teks);
    const drafts = raw
      .filter((x) => x.isi)
      .map((x) => ({
        isi: x.isi.trim(),
        subbag: x.subbag && SUBBAG.includes(x.subbag) ? x.subbag : '',
        tenggat: x.tenggat && /^\d{4}-\d{2}-\d{2}$/.test(x.tenggat) ? x.tenggat : '',
      }));
    return NextResponse.json({ drafts });
  } catch (e) {
    const pesan = e instanceof Error ? e.message : 'Kesalahan tidak diketahui';
    return NextResponse.json({ error: pesan }, { status: 502 });
  }
}
