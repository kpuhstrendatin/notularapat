import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 });
  }

  const nama = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    let teks = '';
    if (nama.endsWith('.docx')) {
      const hasil = await mammoth.extractRawText({ buffer: buf });
      teks = hasil.value;
    } else if (nama.endsWith('.txt') || nama.endsWith('.md')) {
      teks = buf.toString('utf8');
    } else {
      return NextResponse.json({ error: 'Format harus .docx, .txt, atau .md.' }, { status: 400 });
    }
    return NextResponse.json({ teks });
  } catch {
    return NextResponse.json({ error: 'File tidak bisa dibaca.' }, { status: 422 });
  }
}