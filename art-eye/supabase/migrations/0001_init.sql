-- ART EYE — schema, row-level security and helpers.
-- Run with: supabase db push   (or paste into the SQL editor)

create type user_role as enum ('user', 'venue_owner', 'admin');
create type profile_type as enum ('collector', 'enthusiast', 'student', 'artist', 'gallery_professional');
create type venue_type as enum ('museum', 'gallery');
create type exhibition_status as enum ('pending', 'approved', 'rejected');
create type rejection_reason as enum ('outside_sydney', 'incomplete', 'no_image', 'other');

-- ---------------------------------------------------------------- users

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'user',
  profile_type profile_type not null default 'enthusiast',
  display_name text not null default 'Curator',
  city text not null default 'Sydney',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users read own profile" on public.users
  for select using (auth.uid() = id);

create policy "users update own profile (not role)" on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.users where id = auth.uid()));

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

create policy "admins read all profiles" on public.users
  for select using (public.is_admin());

-- Created on sign-up from auth metadata. The seeded admin email becomes admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, role, profile_type, display_name)
  values (
    new.id,
    case
      when new.email = 'jadebrack@gmail.com' then 'admin'::user_role
      when coalesce(new.raw_user_meta_data ->> 'requested_role', 'user') = 'venue_owner' then 'venue_owner'::user_role
      else 'user'::user_role
    end,
    coalesce((new.raw_user_meta_data ->> 'profile_type')::profile_type, 'enthusiast'),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Curator')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- venues

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type venue_type not null default 'gallery',
  address text not null default '',
  city text not null default 'Sydney',
  owner_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.venues enable row level security;

create policy "venues are public" on public.venues for select using (true);
create policy "anyone may add a venue with a submission" on public.venues
  for insert with check (true);
create policy "owners edit their venue" on public.venues
  for update using (owner_user_id = auth.uid() or public.is_admin());

-- A venue-owner sign-up claims (or creates) their venue by name.
create or replace function public.claim_or_create_venue(p_venue_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  select id into v_id from public.venues
    where lower(name) = lower(trim(p_venue_name)) limit 1;
  if v_id is null then
    insert into public.venues (name, owner_user_id)
      values (trim(p_venue_name), auth.uid()) returning id into v_id;
  else
    update public.venues set owner_user_id = auth.uid()
      where id = v_id and owner_user_id is null;
  end if;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------- exhibitions

create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  title text not null,
  artists text not null,
  start_date date not null,
  end_date date not null,
  opening_datetime timestamptz,
  description text not null default '',
  image_url text,
  status exhibition_status not null default 'pending',
  rejection_reason rejection_reason,
  is_featured boolean not null default false,
  city text not null default 'Sydney',
  submitted_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index exhibitions_status_idx on public.exhibitions (status);
create index exhibitions_city_dates_idx on public.exhibitions (city, start_date, end_date);

alter table public.exhibitions enable row level security;

create policy "approved exhibitions are public" on public.exhibitions
  for select using (status = 'approved');

create policy "submitters and owners see their own" on public.exhibitions
  for select using (
    submitted_by = auth.uid()
    or exists (select 1 from public.venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  );

create policy "admins see everything" on public.exhibitions
  for select using (public.is_admin());

-- All submissions (public form included) go through submit_exhibition(),
-- which forces status = 'pending'. No direct inserts.
create policy "owners edit their submissions back to pending" on public.exhibitions
  for update using (
    submitted_by = auth.uid()
    or exists (select 1 from public.venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  )
  with check (status = 'pending' and is_featured = false);

create policy "admins update everything" on public.exhibitions
  for update using (public.is_admin());

-- Public submission entry point: creates the venue if needed, always pending.
create or replace function public.submit_exhibition(
  p_venue_name text,
  p_venue_type venue_type,
  p_venue_address text,
  p_title text,
  p_artists text,
  p_start_date date,
  p_end_date date,
  p_opening_datetime timestamptz,
  p_description text,
  p_image_url text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  e_id uuid;
begin
  select id into v_id from public.venues
    where lower(name) = lower(trim(p_venue_name)) limit 1;
  if v_id is null then
    insert into public.venues (name, type, address)
      values (trim(p_venue_name), p_venue_type, trim(p_venue_address))
      returning id into v_id;
  end if;
  insert into public.exhibitions
    (venue_id, title, artists, start_date, end_date, opening_datetime,
     description, image_url, status, submitted_by)
  values
    (v_id, trim(p_title), trim(p_artists), p_start_date, p_end_date,
     p_opening_datetime, trim(p_description), p_image_url, 'pending', auth.uid())
  returning id into e_id;
  return e_id;
end;
$$;

grant execute on function public.submit_exhibition to anon, authenticated;
grant execute on function public.claim_or_create_venue to authenticated;

-- ---------------------------------------------------------------- curation

create table public.user_watchlist (
  user_id uuid not null references public.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

alter table public.user_watchlist enable row level security;

-- Individual rows are visible to their owner only — venue accounts never see
-- who wants to see what; any venue-facing analytics must aggregate.
create policy "own watchlist only" on public.user_watchlist
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.user_visits (
  user_id uuid not null references public.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  reflection text not null default '',
  visit_date date not null default current_date,
  primary key (user_id, exhibition_id)
);

alter table public.user_visits enable row level security;

create policy "own visits only" on public.user_visits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- guides (phase 2 stub)
-- Schema-ready for shared profiles, follows and user-curated city guides;
-- no UI in v1.

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  intro text not null default '',
  created_at timestamptz not null default now()
);

create table public.guide_items (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides (id) on delete cascade,
  exhibition_id uuid references public.exhibitions (id) on delete set null,
  venue_id uuid references public.venues (id) on delete set null,
  note text not null default '',
  position integer not null default 0
);

alter table public.guides enable row level security;
alter table public.guide_items enable row level security;

create policy "own guides only" on public.guides
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own guide items only" on public.guide_items
  for all using (exists (select 1 from public.guides g where g.id = guide_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.guides g where g.id = guide_id and g.user_id = auth.uid()));

-- ---------------------------------------------------------------- storage

insert into storage.buckets (id, name, public) values ('exhibition-images', 'exhibition-images', true);

create policy "public read exhibition images" on storage.objects
  for select using (bucket_id = 'exhibition-images');

create policy "anyone may upload a submission image" on storage.objects
  for insert with check (bucket_id = 'exhibition-images');
