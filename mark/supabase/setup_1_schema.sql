-- MARK schema. Run once in the Supabase SQL editor.
-- Every table is per-user with row-level security: you only ever see your own
-- rows. Cycle data never reaches these tables — it stays on the device.

create extension if not exists "pgcrypto";

create table if not exists public.pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  identity text not null default '',
  position int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pillar_id uuid not null references public.pillars (id) on delete cascade,
  name text not null,
  -- How this habit keeps time: fixed weekdays, x per week, or x per month.
  rhythm text not null default 'days' check (rhythm in ('days', 'weekly', 'monthly')),
  -- Weekdays for the 'days' rhythm: 0 = Monday … 6 = Sunday.
  days int[] not null default '{0,1,2,3,4,5,6}',
  -- Times per period for the flexible rhythms.
  times int not null default 3 check (times > 0),
  -- Nothing before this counts as missed.
  start_date date not null default current_date,
  paused boolean not null default false,
  position int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('movement', 'nutrition', 'sleep')),
  date date not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('book', 'course', 'article', 'podcast')),
  title text not null,
  rating int not null default 0 check (rating between 0 and 5),
  note text not null default '',
  created_at timestamptz not null default now()
);

-- One row per night; date = the morning you woke up. Times as 'HH:MM'.
create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  bed_time text not null,
  wake_time text not null,
  quality int not null default 0 check (quality between 0 and 5),
  source text not null default 'manual' check (source in ('manual', 'health')),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Read-only mirror of health platform data (steps etc.), or manual entries.
create table if not exists public.health_sync (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  steps int,
  resting_hr int,
  active_energy int,
  source text not null default 'manual' check (source in ('manual', 'health')),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- RevenueCat webhook target. The app only ever reads its own row.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'free' check (status in ('free', 'active', 'expired')),
  product_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- NOTE deliberately absent: cycle_periods / cycle_entries. Cycle data never
-- reaches Supabase — it lives only on the device (src/lib/cycle-store.ts),
-- which is the strongest privacy guarantee we can give. See PROJECTPLAN.md.

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('book', 'idea', 'task', 'watch', 'note')),
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  source text not null default 'mark' check (source in ('mark', 'google')),
  external_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('week', 'month', 'quarter', 'intention')),
  period_start date not null,
  answers jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (user_id, kind, period_start)
);

-- Row-level security: owner-only on every table.
do $$
declare t text;
begin
  foreach t in array array['pillars','habits','marks','health_logs','sleep_logs','health_sync','subscriptions','knowledge_entries','inbox_items','calendar_events','checkins']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

create index if not exists marks_user_date on public.marks (user_id, date);
create index if not exists health_logs_user_kind_date on public.health_logs (user_id, kind, date);
create index if not exists calendar_events_user_start on public.calendar_events (user_id, start_at);
