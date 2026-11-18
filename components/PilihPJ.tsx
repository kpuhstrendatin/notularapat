'use client';

import { Pilih } from './ui';
import { PJ_SUBBAG } from '@/lib/penanggungjawab';

// Dropdown penanggung jawab orang. Isinya menyesuaikan subbag yang dipilih.
export default function PilihPJ({
  subbag,
  value,
  onChange,
  className = 'w-full',
}: {
  subbag: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const daftar = [...(PJ_SUBBAG[subbag] ?? [])].sort((a, b) => a.localeCompare(b));
  return (
    <Pilih value={value} onChange={(e) => onChange(e.target.value)} className={className} disabled={!subbag}>
      <option value="">{subbag ? '— opsional —' : '— pilih subbag dulu —'}</option>
      {daftar.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </Pilih>
  );
}
