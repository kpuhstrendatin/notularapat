'use client';

import { useEffect, useState } from 'react';
import { Pilih } from './ui';

// Dropdown nama pengubah. Daftarnya diambil dari tabel pengubah di Supabase.
export default function PilihPengubah({
  value,
  onChange,
  className = 'w-full',
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
    <Pilih value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">— pilih nama pengubah —</option>
      {daftar.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </Pilih>
  );
}
