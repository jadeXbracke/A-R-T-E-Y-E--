-- ART EYE — initial schema
-- Roles: user / venue_owner / admin. Submissions are pending until an admin approves.
-- city lives on venues and exhibitions from day one: a second city is a data task.

create type public.user_role as enum ('user', 'venue_owner', 'admin');
create type public.profile_type as enum ('collector', 'enthusiast', 'student', 'artist', 'gallery_professional');
create type public.venue_type as enum ('museum', 'gallery');
create type public.exhibition_status as enum ('pending', 'approved', 'rejected');
create type public.rejection_reason as enum ('outside_sydney', 'incomplete', 'no_image', 'other');

-- ---------- users ----------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'user',
  profile_type public.profile_type not null default 'enthusiast',
  display_name text not null default '',
  city text not null default 'Sydney',
  created_at timestamptz not null default now()
);

-- ---------- venues ----------
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.venue_type not null default 'gallery',
  address text not null default '',
  city text not null default 'Sydney',
  owner_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- exhibitions ----------
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
  status public.exhibition_status not null default 'pending',
  rejection_reason public.rejection_reason,
  is_featured boolean not null default false,
  city text not null default 'Sydney',
  submitted_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index exhibitions_status_idx on public.exhibitions (status, city, end_date);

-- ---------- want to see ----------
create table public.user_watchlist (
  user_id uuid not null references public.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

-- ---------- visits (seen + rating + reflection) ----------
create table public.user_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  exhibition_id uuid not null references public.exhibitions (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  reflection text not null default '',
  visit_date date not null default current_date,
  unique (user_id, exhibition_id)
);

-- ---------- guides (phase-2 stub: user-curated city guides) ----------
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
  position int not null default 0
);

-- ---------- auth trigger: create profile row on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, role, profile_type, display_name)
  values (
    new.id,
    -- 'admin' can never be self-assigned at signup
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'user') = 'venue_owner' then 'venue_owner'::public.user_role
      else 'user'::public.user_role
    end,
    coalesce((new.raw_user_meta_data ->> 'profile_type')::public.profile_type, 'enthusiast'),
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- helpers ----------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- ---------- row level security ----------
alter table public.users enable row level security;
alter table public.venues enable row level security;
alter table public.exhibitions enable row level security;
alter table public.user_watchlist enable row level security;
alter table public.user_visits enable row level security;
alter table public.guides enable row level security;
alter table public.guide_items enable row level security;

-- users: each user reads/updates only their own row (never exposed to venues);
-- role changes are blocked client-side by column omission and here by trigger below.
create policy users_select_own on public.users for select using (id = auth.uid() or public.is_admin());
create policy users_update_own on public.users for update using (id = auth.uid());

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins may change roles.';
  end if;
  return new;
end;
$$;
create trigger users_role_guard before update on public.users
  for each row execute function public.prevent_role_escalation();

-- venues: public read; anyone (incl. anonymous submitters) may create;
-- owners and admins may update.
create policy venues_select_all on public.venues for select using (true);
create policy venues_insert_any on public.venues for insert with check (true);
create policy venues_update_own on public.venues for update
  using (owner_user_id = auth.uid() or public.is_admin());

-- exhibitions: approved rows are public; submitters/venue owners see their own;
-- admins see everything. Inserts are always pending and never featured.
create policy exhibitions_select_public on public.exhibitions for select
  using (
    status = 'approved'
    or public.is_admin()
    or submitted_by = auth.uid()
    or exists (select 1 from public.venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  );
create policy exhibitions_insert_pending on public.exhibitions for insert
  with check (status = 'pending' and is_featured = false);
create policy exhibitions_update_owner on public.exhibitions for update
  using (
    public.is_admin()
    or submitted_by = auth.uid()
    or exists (select 1 from public.venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  )
  with check (
    public.is_admin()
    -- non-admin edits always return to review, never self-publish or self-feature
    or (status = 'pending' and is_featured = false)
  );

-- watchlist & visits: strictly private to the user. Venue accounts can never
-- read individual user rows — any venue-facing analytics must be aggregated
-- server-side (e.g. via security-definer functions returning counts only).
create policy watchlist_all_own on public.user_watchlist for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy visits_all_own on public.user_visits for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- guides (phase 2): private to their author for now.
create policy guides_all_own on public.guides for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy guide_items_all_own on public.guide_items for all
  using (exists (select 1 from public.guides g where g.id = guide_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.guides g where g.id = guide_id and g.user_id = auth.uid()));

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('exhibition-images', 'exhibition-images', true)
on conflict (id) do nothing;

create policy exhibition_images_read on storage.objects for select
  using (bucket_id = 'exhibition-images');
create policy exhibition_images_insert on storage.objects for insert
  with check (bucket_id = 'exhibition-images');
