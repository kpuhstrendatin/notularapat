import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import Ikon from './Ikon';

export const fieldCls =
  'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#7a1f2b] focus:ring-4 focus:ring-[#7a1f2b]/10';

export const kartu = 'rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm';

export function Btn({
  variant = 'utama',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'utama' | 'halus' | 'garis' }) {
  const gaya =
    variant === 'utama'
      ? 'bg-gradient-to-r from-[#7a1f2b] to-[#5c1420] text-white shadow-md shadow-[#7a1f2b]/25 hover:-translate-y-0.5 hover:shadow-lg'
      : variant === 'halus'
        ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
        : 'border border-stone-200 bg-white text-stone-700 shadow-sm hover:border-stone-300 hover:bg-stone-50';
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${gaya} ${className}`}
    >
      {children}
    </button>
  );
}

// Dropdown dengan panah modern
export function Pilih({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select {...rest} className={`${fieldCls} cursor-pointer appearance-none pr-10`}>
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// Kotak pencarian dengan ikon kaca pembesar
export function Cari({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Ikon nama="cari" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${fieldCls} pl-10`}
      />
    </div>
  );
}

export function Label({ children, icon }: { children: ReactNode; icon?: string }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
      {icon && <Ikon nama={icon} className="h-3.5 w-3.5" />}
      {children}
    </label>
  );
}

// Pilihan segmen dengan tanda centang pada yang aktif
export function Segmen<T extends string>({
  value,
  onChange,
  opsi,
}: {
  value: T;
  onChange: (v: T) => void;
  opsi: { nilai: T; label: string; icon: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-stone-100 p-1.5">
      {opsi.map((o) => {
        const aktif = value === o.nilai;
        return (
          <button
            key={o.nilai}
            type="button"
            onClick={() => onChange(o.nilai)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              aktif ? 'bg-white text-[#7a1f2b] shadow-md' : 'text-stone-600 hover:bg-white/70'
            }`}
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-full transition ${
                aktif ? 'bg-[#7a1f2b] text-white' : 'bg-stone-200 text-stone-500'
              }`}
            >
              {aktif ? <Ikon nama="cek" className="h-3 w-3" /> : <Ikon nama={o.icon} className="h-3 w-3" />}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
