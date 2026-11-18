'use client';

import { useEffect, useState } from 'react';

// Dropdown nama pengubah. Daftarnya diambil dari tabel pengubah di Supabase.
export default function PilihPengubah({
  value,
  onChange,
  className = 'rounded-lg border p-2 w-full',
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [daftar, setDaftar] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/pengubah', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setDaftar(Array.isArray(j) ? j : []))
      .catch(() => setDaftar([]));
  }, []);

  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— pilih nama pengubah —</option>
      {daftar.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
