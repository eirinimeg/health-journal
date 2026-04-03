-- Run this in your Supabase SQL editor to set up the database schema.

-- Daily log (one row per day)
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  mood smallint check (mood between 1 and 3),
  water_ml integer default 0,
  coffee_count integer default 0,
  bowel_movement boolean default false,
  period boolean default false,
  migraine boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Meals (multiple per day)
create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  log_date date not null references daily_logs(date) on delete cascade,
  description text not null,
  meal_type text not null default 'snack', -- breakfast | lunch | dinner | snack
  is_outside boolean default false,
  logged_at time not null default localtime,
  created_at timestamptz default now()
);

-- Alcohol entries (multiple per day)
create table if not exists alcohol_entries (
  id uuid primary key default gen_random_uuid(),
  log_date date not null references daily_logs(date) on delete cascade,
  description text not null,
  logged_at time not null default localtime,
  created_at timestamptz default now()
);

-- Dessert entries (multiple per day)
create table if not exists dessert_entries (
  id uuid primary key default gen_random_uuid(),
  log_date date not null references daily_logs(date) on delete cascade,
  description text not null,
  logged_at time not null default localtime,
  created_at timestamptz default now()
);

-- Vitamins & Medicine list (managed in Settings page)
create table if not exists vitamins (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean default true,
  sort_order integer default 0,
  category text not null default 'vitamin', -- 'vitamin' | 'medicine'
  created_at timestamptz default now()
);

-- Daily vitamin log (one row per vitamin per day)
create table if not exists vitamin_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null references daily_logs(date) on delete cascade,
  vitamin_id uuid not null references vitamins(id) on delete cascade,
  taken boolean default false,
  unique(log_date, vitamin_id)
);

-- Trigger to keep updated_at fresh on daily_logs
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger daily_logs_updated_at
  before update on daily_logs
  for each row execute function update_updated_at();

-- Disable RLS (this is a personal single-user app protected by PIN only)
alter table daily_logs disable row level security;
alter table meals disable row level security;
alter table alcohol_entries disable row level security;
alter table dessert_entries disable row level security;
alter table vitamins disable row level security;
alter table vitamin_logs disable row level security;
