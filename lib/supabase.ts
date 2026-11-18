import { createClient } from '@supabase/supabase-js';

// Hanya dipakai di server (route handler dan server component).
// SUPABASE_SERVICE_ROLE_KEY bersifat rahasia dan tidak boleh sampai ke browser.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith('https://')) {
    throw new Error('SUPABASE_URL belum diisi dengan benar di .env.local (harus diawali https://).');
  }
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local.');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
