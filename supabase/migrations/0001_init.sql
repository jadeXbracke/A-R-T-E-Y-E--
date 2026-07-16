-- ART EYE — initial schema
-- Runs on Supabase (expects the auth schema). See supabase/README.md.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('user', 'venue_owner', 'admin');
create type public.profile_type as enum
  ('collector', 'enthusiast', 'student', 'artist', 'gallery_professional');
create type public.venue_type as enum ('museum', 'gallery');
create type public.exhibition_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'user',
  profile_type public.profile_type not null default 'enthusiast',
  display_name text not null,
  city text not null default 'Sydney',
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.venue_type not null,
  address text,
  city text not null default 'Sydney',
  owner_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  title text not null,
  artists text not null,
  start_date date not null,
  end_date date not null,
  opening_datetime timestamptz,
  description text,
  image_url text,
  status public.exhibition_status not null default 'pending',
  rejection_reason text,
  is_featured boolean not null default false,
  city text not null default 'Sydney',
  -- who submitted it: a venue owner (edit-own) or null for public/no-account
  submitted_by uuid references public.users (id) on delete set null,
  submitter_email text,
  created_at timestamptz not null default now(),
  constraint dates_ordered check (end_date >= start_date)
);

create index exhibitions_status_city_idx on public.exhibitions (status, city);
create index exhibitions_venue_idx on public.exhibitions (venue_id);

create table public.user_watchlist (
  user_id uuid not null references public.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

create table public.user_visits (
  user_id uuid not null references public.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  reflection text,
  visit_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

-- Phase-2 stub: user-curated city guides. No UI in v1; exists so follows /
-- shared profiles / guides can ship later without a migration rewrite.
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  intro text,
  created_at timestamptz not null default now()
);

create table public.guide_items (
  guide_id uuid not null references public.guides (id) on delete cascade,
  exhibition_id uuid references public.exhibitions (id) on delete cascade,
  venue_id uuid references public.venues (id) on delete cascade,
  note text,
  position int not null,
  primary key (guide_id, position),
  constraint guide_item_target check (exhibition_id is not null or venue_id is not null)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- security definer so RLS policies on other tables can consult users.role
-- without recursive policy evaluation.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- Create the profile row on signup, reading role / profile_type / name from
-- the signup metadata. Role from the client is capped at venue_owner — admin
-- is only granted server-side (see the email allowlist below).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'user');
  granted_role public.user_role;
begin
  if new.email = 'jadebrack@gmail.com' then
    granted_role := 'admin';
  elsif requested_role = 'venue_owner' then
    granted_role := 'venue_owner';
  else
    granted_role := 'user';
  end if;

  insert into public.users (id, role, profile_type, display_name, city)
  values (
    new.id,
    granted_role,
    coalesce(new.raw_user_meta_data ->> 'profile_type', 'enthusiast')::public.profile_type,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'Sydney'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own profile but never their own role.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role can only be changed by an admin';
  end if;
  return new;
end;
$$;

create trigger users_role_guard
  before update on public.users
  for each row execute function public.prevent_role_escalation();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.venues enable row level security;
alter table public.exhibitions enable row level security;
alter table public.user_watchlist enable row level security;
alter table public.user_visits enable row level security;
alter table public.guides enable row level security;
alter table public.guide_items enable row level security;

-- users: you see and edit yourself; admins see everyone. Venue accounts can
-- never read other users' rows — analytics must use aggregates only.
create policy users_select_own on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy users_update_own on public.users
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- venues: public directory. Anyone (incl. anon public submissions) may create
-- a venue row; only its owner or an admin may edit it.
create policy venues_select_all on public.venues
  for select using (true);
create policy venues_insert_any on public.venues
  for insert with check (owner_user_id is null or owner_user_id = auth.uid());
create policy venues_update_own on public.venues
  for update using (owner_user_id = auth.uid() or public.is_admin())
  with check (owner_user_id = auth.uid() or public.is_admin());

-- exhibitions: the public agenda only ever shows approved rows. Submitters
-- see their own pending/rejected rows; admins see everything.
create policy exhibitions_select_public on public.exhibitions
  for select using (
    status = 'approved'
    or submitted_by = auth.uid()
    or public.is_admin()
  );
-- Any submission (venue owner or anonymous public form) enters as pending and
-- can never self-feature. Nothing auto-publishes.
create policy exhibitions_insert_pending on public.exhibitions
  for insert with check (
    status = 'pending'
    and is_featured = false
    and (submitted_by is null or submitted_by = auth.uid())
  );
-- Owners may edit their own not-yet-approved submissions (still pending after
-- the edit); admins may edit anything (including approving / featuring).
create policy exhibitions_update_own_pending on public.exhibitions
  for update using (
    public.is_admin()
    or (submitted_by = auth.uid() and status = 'pending')
  )
  with check (
    public.is_admin()
    or (submitted_by = auth.uid() and status = 'pending' and is_featured = false)
  );
create policy exhibitions_delete_admin on public.exhibitions
  for delete using (public.is_admin());

-- watchlist + visits: strictly private to the owning user.
create policy watchlist_all_own on public.user_watchlist
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy visits_all_own on public.user_visits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- guides (phase-2 stub): private to the author for now.
create policy guides_all_own on public.guides
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy guide_items_all_own on public.guide_items
  for all using (
    exists (select 1 from public.guides g where g.id = guide_id and g.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.guides g where g.id = guide_id and g.user_id = auth.uid())
  );
