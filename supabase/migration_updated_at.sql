-- Jalankan sekali di Supabase > SQL Editor (setelah schema.sql).
-- Menambahkan updated_at pada rapat agar dropdown bisa mengurutkan
-- rapat dari yang terakhir diupdate.

alter table meetings add column if not exists updated_at timestamptz not null default now();
update meetings set updated_at = created_at;

create or replace function bump_meeting()
returns trigger language plpgsql as $$
begin
  update meetings set updated_at = now() where id = new.meeting_id;
  return new;
end $$;

drop trigger if exists trg_bump_meeting on decisions;
create trigger trg_bump_meeting
  after insert or update on decisions
  for each row execute function bump_meeting();
