-- ART EYE — schema
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- users
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'venue_owner', 'admin')),
  profile_type text not null default 'enthusiast' check (
    profile_type in ('collector', 'enthusiast', 'student', 'artist', 'gallery_professional')
  ),
  display_name text not null default '',
  city text not null default 'Sydney',
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- venues
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('museum', 'gallery')),
  address text not null default '',
  city text not null default 'Sydney',
  owner_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------- exhibitions
create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  title text not null,
  artists text not null default '',
  start_date date not null,
  end_date date not null,
  opening_datetime timestamptz,
  description text not null default '',
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text check (
    rejection_reason in ('outside_sydney', 'incomplete', 'no_image', 'other')
  ),
  is_featured boolean not null default false,
  city text not null default 'Sydney',
  submitted_by uuid references public.users (id) on delete set null,
  submitter_contact text,
  created_at timestamptz not null default now()
);

create index exhibitions_agenda_idx on public.exhibitions (city, status, end_date);

-- ------------------------------------------------------------ watchlist
create table public.user_watchlist (
  user_id uuid not null references public.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

-- --------------------------------------------------------------- visits
create table public.user_visits (
  user_id uuid not null references public.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  reflection text not null default '',
  visit_date date not null default current_date,
  primary key (user_id, exhibition_id)
);

-- ------------------------------------------- guides (phase-2 stub only)
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  intro text not null default '',
  created_at timestamptz not null default now()
);

create table public.guide_items (
  guide_id uuid not null references public.guides (id) on delete cascade,
  exhibition_id uuid references public.exhibitions (id) on delete cascade,
  venue_id uuid references public.venues (id) on delete cascade,
  note text not null default '',
  position int not null default 0,
  primary key (guide_id, position),
  check (exhibition_id is not null or venue_id is not null)
);

-- ------------------------------------------------------------- helpers
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- ------------------------------------------------------------------ RLS
alter table public.users enable row level security;
alter table public.venues enable row level security;
alter table public.exhibitions enable row level security;
alter table public.user_watchlist enable row level security;
alter table public.user_visits enable row level security;
alter table public.guides enable row level security;
alter table public.guide_items enable row level security;

-- users: each account sees and edits only its own row (role changes are
-- blocked client-side and by the with-check below); admins may read all.
-- Individual user rows are never exposed to venue accounts.
create policy users_select_own on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy users_insert_own on public.users
  for insert with check (id = auth.uid() and role in ('user', 'venue_owner'));
create policy users_update_own on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid() and (role = (select role from public.users u where u.id = auth.uid()) or public.is_admin()));

-- venues: public read; anyone (incl. anonymous) may create a venue as part
-- of a submission; only the owner or an admin may edit.
create policy venues_select_all on public.venues for select using (true);
create policy venues_insert_any on public.venues for insert with check (true);
create policy venues_update_owner on public.venues
  for update using (owner_user_id = auth.uid() or public.is_admin());

-- exhibitions: approved rows are public; submitters see their own; admins
-- see everything. Inserts are always pending and never featured
-- (no auto-publishing, ever). Submitters may edit their own pending or
-- rejected rows but the row returns to pending; admins may edit anything.
create policy exhibitions_select_public on public.exhibitions
  for select using (status = 'approved' or submitted_by = auth.uid() or public.is_admin());
create policy exhibitions_insert_pending on public.exhibitions
  for insert with check (
    status = 'pending' and is_featured = false
    and (submitted_by is null or submitted_by = auth.uid())
  );
create policy exhibitions_update_own on public.exhibitions
  for update using (submitted_by = auth.uid() and status in ('pending', 'rejected'))
  with check (status = 'pending' and is_featured = false);
create policy exhibitions_update_admin on public.exhibitions
  for update using (public.is_admin());

-- watchlist & visits: strictly private to the account. Venue accounts can
-- never read individual rows — any venue-facing analytics must be built on
-- aggregated views only.
create policy watchlist_own on public.user_watchlist
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy visits_own on public.user_visits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- guides: private in v1 (public sharing arrives in phase 2).
create policy guides_own on public.guides
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy guide_items_own on public.guide_items
  for all using (exists (select 1 from public.guides g where g.id = guide_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.guides g where g.id = guide_id and g.user_id = auth.uid()));

-- -------------------------------------------------------------- storage
insert into storage.buckets (id, name, public) values ('exhibition-images', 'exhibition-images', true)
on conflict (id) do nothing;

create policy exhibition_images_read on storage.objects
  for select using (bucket_id = 'exhibition-images');
create policy exhibition_images_write on storage.objects
  for insert with check (bucket_id = 'exhibition-images');
