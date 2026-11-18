export type HasilEkstraksi = { isi: string; subbag: string | null; tenggat: string | null };

// Dipanggil hanya dari server. API key tidak pernah sampai ke browser.
export async function extractDecisions(teks: string): Promise<HasilEkstraksi[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY belum diisi di environment.');
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

  const prompt = `Dari notula rapat berikut, ambil HANYA keputusan dan tindak lanjut yang benar-benar disebutkan.
Jangan mengarang. Keluarkan JSON array berisi objek dengan kunci:
- "isi": kalimat keputusan singkat dalam bahasa baku
- "subbag": salah satu dari Subbag Teknis, Subbag Hukum, Subbag Umum, Subbag Keuangan, Subbag Data, Subbag Sosdiklih, atau null jika tidak jelas
- "tenggat": tanggal format YYYY-MM-DD, atau null jika tidak jelas
Tanpa penjelasan lain.

NOTULA:
${teks}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini menolak permintaan (status ${res.status}).`);

  const json = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [];
}
