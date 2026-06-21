-- 랩 미팅
create table lab_meetings (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  presenter text,
  title text not null,
  content text,
  decisions text,
  next_meeting date,
  created_by text,
  created_at timestamptz default now()
);

-- 실험 스케줄
create table experiments (
  id uuid default gen_random_uuid() primary key,
  researcher text not null,
  name text not null,
  description text,
  start_date date,
  end_date date,
  status text default 'planned' check (status in ('planned','in_progress','completed','paused')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 샘플 현황
create table samples (
  id uuid default gen_random_uuid() primary key,
  sample_id text unique not null,
  type text,
  source text,
  collection_date date,
  stage text default 'collected' check (stage in ('collected','dna_extraction','sequencing','analysis','completed')),
  location text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 시약 재고
create table reagents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  quantity numeric,
  unit text,
  expiry_date date,
  location text,
  needs_order boolean default false,
  notes text,
  updated_at timestamptz default now()
);

-- 공용 프로토콜
create table protocols (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null check (category in ('wet', 'dry')),
  subtitle text,
  content text not null,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 비활성화 (앱 레벨에서 비밀번호로 접근 제어)
alter table lab_meetings disable row level security;
alter table experiments disable row level security;
alter table samples disable row level security;
alter table reagents disable row level security;
alter table protocols disable row level security;
grant all privileges on table protocols to anon;
