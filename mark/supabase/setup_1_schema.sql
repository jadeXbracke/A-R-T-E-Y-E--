-- MARK schema. Run once in the Supabase SQL editor.
-- Every table is per-user with row-level security: you only ever see your own
-- rows. Cycle data never reaches these tables — it stays on the device.

create extension if not exists "pgcrypto";

create table if not exists public.pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  position int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pillar_id uuid not null references public.pillars (id) on delete cascade,
  name text not null,
  target_per_week int not null default 5,
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
  insight text not null default '',
  created_at timestamptz not null default now()
);

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
  foreach t in array array['pillars','habits','marks','health_logs','knowledge_entries','inbox_items','calendar_events','checkins']
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
