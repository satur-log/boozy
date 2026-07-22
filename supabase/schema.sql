-- Boozy Phase 2 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

-- 1) 방
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  title text not null default '이름 없는 술자리',
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- 2) 참가자
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null,
  drinks_count integer not null default 0,
  soju_equiv real not null default 0,
  start_time timestamptz,
  last_updated timestamptz not null default now(),
  is_retired boolean not null default false,
  current_speed real not null default 0
);

create index if not exists participants_room_id_idx on public.participants(room_id);
create index if not exists rooms_room_code_idx on public.rooms(room_code);

-- 3) Realtime 발행 대상에 추가 (라이브 리더보드용)
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.rooms;

-- 4) RLS: 비회원(anon)이 읽고 쓸 수 있게 개방 (MVP 용 — 운영 시 강화 권장)
alter table public.rooms enable row level security;
alter table public.participants enable row level security;

drop policy if exists "rooms open" on public.rooms;
create policy "rooms open" on public.rooms
  for all using (true) with check (true);

drop policy if exists "participants open" on public.participants;
create policy "participants open" on public.participants
  for all using (true) with check (true);
