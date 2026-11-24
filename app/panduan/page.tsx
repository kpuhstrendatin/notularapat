import Ikon from '@/components/Ikon';
import { kartu } from '@/components/ui';

export const metadata = { title: 'Panduan · Decision Tracker' };

function Bagian({ ikon, judul, children }: { ikon: string; judul: string; children: React.ReactNode }) {
  return (
    <section className={kartu}>
      <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-stone-900">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7a1f2b]/10 text-[#7a1f2b]">
          <Ikon nama={ikon} className="h-4.5 w-4.5" />
        </span>
        {judul}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700">{children}</div>
    </section>
  );
}

function Langkah({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-stone-900 text-xs font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Tips({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
      <Ikon nama="peringatan" className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
      <div>{children}</div>
    </div>
  );
}

export default function Panduan() {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#7a1f2b] to-[#4a1219] p-6 text-white shadow-md">
        <h1 className="text-2xl font-extrabold">Panduan Decision Tracker</h1>
        <p className="mt-1 text-sm text-white/85">
          Cara menggunakan aplikasi pemantauan tindak lanjut keputusan rapat KPU Kab. Hulu Sungai Tengah.
        </p>
      </section>

      <Bagian ikon="grid" judul="Dashboard">
        <p>Halaman utama yang menampilkan ringkasan progres seluruh keputusan.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><b>Periode:</b> pilih Semua waktu, Bulan ini, Triwulan ini, atau Bulan tertentu. Periode bisa dihitung dari tanggal rapat atau tanggal dibuat.</li>
          <li><b>Penanggung jawab:</b> filter untuk melihat keputusan satu orang saja.</li>
          <li><b>Perhatian Bersama:</b> pesan untuk seluruh pegawai, tampil dengan latar merah. Setelah membaca, tekan <b>Sudah saya baca</b>.</li>
          <li><b>Tenggat 7 hari ke depan:</b> keputusan yang jatuh tempo dalam seminggu, dengan lencana H-3, H-2, dan seterusnya.</li>
        </ul>
        <Tips>
          Pilih <b>nama pengubah</b> di bagian atas dashboard sebelum mengubah progres atau menandai sudah membaca.
        </Tips>
      </Bagian>

      <Bagian ikon="daftar" judul="Daftar Keputusan">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><b>Cari dan saring:</b> berdasarkan kata, subbag, status, atau urutan tenggat.</li>
          <li><b>Per notula:</b> centang untuk melihat keputusan dikelompokkan menurut rapatnya.</li>
          <li><b>Ubah progres:</b> klik ikon pensil, lalu pilih status baru.</li>
          <li><b>Edit keputusan:</b> klik <b>Edit keputusan</b> untuk mengubah isi, penanggung jawab, atau tenggat.</li>
          <li><b>Ekspor:</b> tombol <b>Ekspor ke Excel (CSV)</b> menyimpan daftar yang sedang tampil.</li>
        </ul>
        <p>Keputusan yang melewati tenggat dan belum selesai ditandai <b className="text-red-700">Terlambat</b>.</p>
      </Bagian>

      <Bagian ikon="tambah" judul="Tambah Keputusan">
        <p>Ada dua cara menambah keputusan: <b>impor dari notula</b> atau <b>tambah manual</b>.</p>
        <Langkah n={1}>
          <b>Pilih nama sumber.</b> Pilih dari daftar, atau pilih <i>+ Nama sumber baru</i> (notula, SK, kesepakatan, dan lain-lain).
        </Langkah>
        <Langkah n={2}>
          <b>Isi tanggal pembahasan</b> dan <b>nama pengubah</b>.
        </Langkah>
        <Langkah n={3}>
          <b>Impor:</b> pilih file (.docx, .txt, atau .md) atau tempel teks, lalu klik <i>Cari keputusan</i>. Periksa hasilnya, centang yang ingin disimpan, lalu klik <i>Simpan yang dicentang</i>.
          <br />
          <b>Manual:</b> isi keputusan, pilih subbag penanggung jawab, lalu tenggat, lalu klik <i>Simpan keputusan</i>.
        </Langkah>
        <Langkah n={4}>
          <b>Penanggung jawab orang (opsional)</b> muncul setelah subbag dipilih. Pilihan namanya mengikuti subbag tersebut.
        </Langkah>
      </Bagian>

      <Bagian ikon="riwayat" judul="Riwayat">
        <p>
          Mencatat setiap perubahan: progres, isi, penanggung jawab, dan tenggat, lengkap dengan nama pengubah dan waktunya.
        </p>
      </Bagian>

      <Bagian ikon="notula" judul="Laporan">
        <Langkah n={1}>Pilih jenis periode: triwulan, bulan, atau tahun, lalu pilih triwulan/bulan dan tahunnya.</Langkah>
        <Langkah n={2}>Klik <b>Cetak / Simpan PDF</b>, lalu pilih <i>Simpan sebagai PDF</i> di jendela cetak.</Langkah>
        <p className="text-stone-500">Laporan memuat ringkasan, persentase per subbag, dan daftar keputusan, dengan kolom tanda tangan di bagian bawah.</p>
      </Bagian>

      <Bagian ikon="peringatan" judul="Catatan penting">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Jangan memasukkan data pribadi pegawai atau informasi rahasia.</li>
          <li>Aplikasi ini belum memakai login. Siapa pun yang memiliki alamatnya dapat melihat datanya.</li>
          <li>Jika ada yang tidak berfungsi, catat langkah yang dilakukan dan pesan yang muncul, lalu sampaikan ke admin.</li>
        </ul>
      </Bagian>
    </div>
  );
}
