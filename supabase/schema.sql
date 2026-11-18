-- Jalankan seluruh isi file ini di Supabase > SQL Editor.

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  tanggal date,
  jenis text,
  sumber_notula text,
  created_at timestamptz not null default now()
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete set null,
  nomor int,
  isi text not null,
  subbag text not null,
  pic text,
  tenggat date not null,
  status text not null default 'belum'
    check (status in ('belum', 'sedang', 'menunggu', 'selesai')),
  bukti text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists decision_log (
  id bigserial primary key,
  decision_id uuid not null references decisions(id) on delete cascade,
  status_lama text,
  status_baru text,
  oleh text,
  at timestamptz not null default now()
);

-- Setiap perubahan status otomatis dicatat di decision_log (untuk halaman Riwayat).
create or replace function log_status_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into decision_log (decision_id, status_lama, status_baru, oleh)
    values (new.id, old.status, new.status, new.updated_by);
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_status_change on decisions;
create trigger trg_status_change
  before update on decisions
  for each row execute function log_status_change();

-- Row Level Security: fase awal tanpa login, data boleh dibaca publik.
-- Penulisan tidak diberi policy untuk anon, sehingga hanya lewat server
-- (service role) yang bisa mengubah data.
alter table meetings enable row level security;
alter table decisions enable row level security;
alter table decision_log enable row level security;

create policy "baca publik meetings" on meetings for select using (true);
create policy "baca publik decisions" on decisions for select using (true);
create policy "baca publik log" on decision_log for select using (true);
