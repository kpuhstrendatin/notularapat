import Ikon from './Ikon';
import { LBL, STATUS, type Status } from '@/lib/types';

export const STATUS_STYLE: Record<Status, { aktif: string; pasif: string; ikon: string; garis: string }> = {
  belum: {
    aktif: 'bg-stone-600 text-white border-stone-600',
    pasif: 'text-stone-600 border-stone-300 hover:bg-stone-100',
    ikon: 'jam',
    garis: 'border-stone-400',
  },
  sedang: {
    aktif: 'bg-blue-600 text-white border-blue-600',
    pasif: 'text-blue-700 border-blue-300 hover:bg-blue-50',
    ikon: 'pensil',
    garis: 'border-blue-500',
  },
  menunggu: {
    aktif: 'bg-orange-500 text-white border-orange-500',
    pasif: 'text-orange-700 border-orange-300 hover:bg-orange-50',
    ikon: 'panah',
    garis: 'border-orange-500',
  },
  selesai: {
    aktif: 'bg-green-600 text-white border-green-600',
    pasif: 'text-green-700 border-green-300 hover:bg-green-50',
    ikon: 'cek',
    garis: 'border-green-600',
  },
};

// Lencana status (tidak bisa diklik)
export function StatusChip({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.aktif}`}>
      <Ikon nama={s.ikon} className="h-3.5 w-3.5" />
      {LBL[status]}
    </span>
  );
}

// Pilihan progres: empat tombol berwarna, yang aktif terisi penuh
export function StatusPilih({
  value,
  onChange,
  disabled,
  kecil,
}: {
  value: Status;
  onChange: (s: Status) => void;
  disabled?: boolean;
  kecil?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS.map((s) => {
        const st = STATUS_STYLE[s];
        const aktif = value === s;
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition disabled:opacity-50 ${
              kecil ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
            } ${aktif ? st.aktif : st.pasif}`}
          >
            <Ikon nama={st.ikon} className="h-3.5 w-3.5" />
            {LBL[s]}
          </button>
        );
      })}
    </div>
  );
}
