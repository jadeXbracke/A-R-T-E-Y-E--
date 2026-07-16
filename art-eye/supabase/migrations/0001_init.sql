-- ART EYE schema. Users are curators; venue owners submit; admins approve.
-- City lives on venues and exhibitions from day one, so a second city is a
-- data task, not a rebuild. Guides tables are a phase-2 stub (shared,
-- ordered city guides) — present so follows/guides need no migration pain.

create type user_role as enum ('user', 'venue_owner', 'admin');
create type profile_type as enum ('collector', 'enthusiast', 'student', 'artist', 'gallery_professional');
create type venue_type as enum ('museum', 'gallery');
create type exhibition_status as enum ('pending', 'approved', 'rejected');
create type rejection_reason as enum ('outside_sydney', 'incomplete', 'no_image', 'other');

-- profiles ("users" in the product spec): one row per auth user
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'user',
  profile_type profile_type not null default 'enthusiast',
  display_name text not null default '',
  city text not null default 'Sydney',
  created_at timestamptz not null default now()
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type venue_type not null default 'gallery',
  address text,
  city text not null default 'Sydney',
  owner_user_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table exhibitions (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
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
  created_at timestamptz not null default now()
);

create table user_watchlist (
  user_id uuid not null references profiles (id) on delete cascade,
  exhibition_id uuid not null references exhibitions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

create table user_visits (
  user_id uuid not null references profiles (id) on delete cascade,
  exhibition_id uuid not null references exhibitions (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  reflection text not null default '',
  visit_date date not null default current_date,
  primary key (user_id, exhibition_id)
);

-- phase-2 stub: user-curated city guides
create table guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  intro text not null default '',
  created_at timestamptz not null default now()
);

create table guide_items (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides (id) on delete cascade,
  exhibition_id uuid references exhibitions (id) on delete set null,
  venue_id uuid references venues (id) on delete set null,
  note text not null default '',
  position int not null default 0
);

-- helper: is the current user an admin? (security definer avoids RLS recursion)
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- create a profile automatically on signup, honouring app metadata
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, profile_type, display_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'user'),
    coalesce((new.raw_user_meta_data ->> 'profile_type')::profile_type, 'enthusiast'),
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  );
  return new;
exception when others then
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------- RLS
alter table profiles enable row level security;
alter table venues enable row level security;
alter table exhibitions enable row level security;
alter table user_watchlist enable row level security;
alter table user_visits enable row level security;
alter table guides enable row level security;
alter table guide_items enable row level security;

-- profiles: owners see and edit themselves only; individual user rows are
-- never exposed to venue accounts (aggregation happens server-side only).
create policy "profiles: own read" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles: own update" on profiles for update using (id = auth.uid());

-- venues: public directory; anyone (incl. anon) may add one via submission;
-- owners and admins may edit their own.
create policy "venues: public read" on venues for select using (true);
create policy "venues: anyone insert" on venues for insert with check (true);
create policy "venues: owner update" on venues for update
  using (owner_user_id = auth.uid() or is_admin());

-- exhibitions: approved rows are public; owners see their venue's rows;
-- admins see all. Inserts (public or venue) must be pending, never featured.
create policy "exhibitions: approved read" on exhibitions for select
  using (
    status = 'approved'
    or is_admin()
    or exists (select 1 from venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  );
create policy "exhibitions: pending insert" on exhibitions for insert
  with check (status = 'pending' and is_featured = false and rejection_reason is null);
create policy "exhibitions: owner or admin update" on exhibitions for update
  using (
    is_admin()
    or exists (select 1 from venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  )
  with check (
    is_admin()
    or (
      -- owners can only push their edits back into review, never self-approve
      status = 'pending'
      and is_featured = false
      and exists (select 1 from venues v where v.id = venue_id and v.owner_user_id = auth.uid())
    )
  );
create policy "exhibitions: admin delete" on exhibitions for delete using (is_admin());

-- watchlist & visits: strictly private to the user
create policy "watchlist: own" on user_watchlist for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "visits: own" on user_visits for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- guides (phase 2): private to author for now; public sharing arrives with the feature
create policy "guides: own" on guides for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "guide_items: own" on guide_items for all
  using (exists (select 1 from guides g where g.id = guide_id and g.user_id = auth.uid()))
  with check (exists (select 1 from guides g where g.id = guide_id and g.user_id = auth.uid()));

-- storage: public-read bucket for exhibition images; anyone may upload a submission image
insert into storage.buckets (id, name, public) values ('exhibition-images', 'exhibition-images', true);
create policy "exhibition images read" on storage.objects for select
  using (bucket_id = 'exhibition-images');
create policy "exhibition images insert" on storage.objects for insert
  with check (bucket_id = 'exhibition-images');
