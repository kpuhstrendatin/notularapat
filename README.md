# Decision Tracker KPU Kab. Hulu Sungai Tengah

## 1. Buat proyek Supabase
1. Daftar di supabase.com, lalu buat project baru. Catat password database.
2. Buka SQL Editor, tempel seluruh isi `supabase/schema.sql`, lalu klik Run.
3. Buka Project Settings > API. Salin "Project URL" ke `SUPABASE_URL` dan "service_role" key ke `SUPABASE_SERVICE_ROLE_KEY`.
   Service role key bersifat rahasia. Jangan pernah dimasukkan ke kode atau diberi awalan NEXT_PUBLIC.

## 2. Siapkan API key Gemini
Buat key di Google AI Studio, lalu isi `GEMINI_API_KEY`.

## 3. Jalankan di komputer
```
cp .env.example .env.local     # isi nilainya
npm install
npm run dev
```
Buka http://localhost:3000.

## 4. Simpan ke GitHub
Salin isi folder ini ke repo GitHub yang sudah ada, lalu commit dan push.
`.env.local` sudah diabaikan oleh `.gitignore`, jadi tidak ikut terunggah.

## 5. Deploy ke Vercel
1. Di Vercel, pilih Add New > Project, lalu impor repo GitHub tersebut.
2. Di Settings > Environment Variables, isi empat variabel dari `.env.example`.
3. Deploy. Setiap push ke GitHub akan otomatis memperbarui situs.

## Catatan keamanan fase awal
- Halaman bisa diakses tanpa login. Route `/api/import` memanggil Gemini dan berbiaya, jadi perlu pembatasan akses sebelum dipakai luas.
- Kolom "Nama pengubah" dicatat tetapi tidak diverifikasi, sesuai desain.

## Pembaruan: urutan rapat berdasarkan terakhir diupdate
Jika project Supabase sudah dibuat sebelum pembaruan ini, jalankan sekali isi
`supabase/migration_updated_at.sql` di SQL Editor. Tidak perlu menjalankan ulang `schema.sql`.
