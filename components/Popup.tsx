'use client';

import { useEffect, useState } from 'react';
import Ikon from './Ikon';

// Kirim pesan peringatan ke pop-up dari mana saja.
export function tampilkanPesan(teks: string) {
  window.dispatchEvent(new CustomEvent('popup-pesan', { detail: teks }));
}

// Pasang sekali di layout. Menampilkan pesan dalam kotak pop-up.
export default function PopupHost() {
  const [teks, setTeks] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: Event) => setTeks((e as CustomEvent<string>).detail);
    window.addEventListener('popup-pesan', h);
    return () => window.removeEventListener('popup-pesan', h);
  }, []);

  useEffect(() => {
    if (!teks) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') setTeks(null);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [teks]);

  if (!teks) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setTeks(null)}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-amber-100 text-amber-700">
            <Ikon nama="peringatan" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold">Perhatian</h3>
            <p className="mt-1 text-sm text-stone-700">{teks}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            autoFocus
            className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => setTeks(null)}
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

// Notifikasi singkat untuk pesan keberhasilan (hilang otomatis)
export function tampilkanToast(teks: string) {
  window.dispatchEvent(new CustomEvent('toast-pesan', { detail: teks }));
}

export function ToastHost() {
  const [teks, setTeks] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const h = (e: Event) => {
      setTeks((e as CustomEvent<string>).detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setTeks(null), 3000);
    };
    window.addEventListener('toast-pesan', h);
    return () => {
      window.removeEventListener('toast-pesan', h);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!teks) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl md:bottom-6"
    >
      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-white/20">
        <Ikon nama="cek" className="h-4 w-4" />
      </span>
      {teks}
    </div>
  );
}
