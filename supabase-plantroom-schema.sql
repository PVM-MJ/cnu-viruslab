create table plant_records (
  id uuid default gen_random_uuid() primary key,
  shelf_id text not null,        -- e.g., 'LU-1-1', 'LL-3-2', 'R-5-4'
  plant_name text not null,
  experiment text,
  stage text,                    -- 파종, 발아, 생육, 접종, 관찰 중, 완료
  notes text,
  start_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table plant_records disable row level security;
