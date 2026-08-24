-- ART EYE — COMPLETE DATABASE SETUP IN ONE FILE.
-- Paste this ENTIRE file into the Supabase SQL Editor and press Run once.
-- Safe to run more than once on the same project — every statement skips
-- work that's already been done, so re-running after a partial failure
-- (or just to double-check) is fine.
-- Contains: the full schema (every migration), 160 published Sydney venues,
-- and the 67 verified exhibitions.
-- Afterwards: sign up in the app with jadebrack@gmail.com, then run
-- make_owner.sql to promote that one account to admin.

-- ART EYE — SETUP STEP 1 of 2: DATABASE SCHEMA.
-- Paste this ENTIRE file into the Supabase SQL Editor and press Run.
-- Then run setup_2_venues.sql. Safe to run repeatedly on the same project
-- (every statement is written to skip work that's already been done).
-- (Contains every migration except the optional auto-scheduler 0006.)

-- ============================================================
-- migrations/0001_init.sql
-- ============================================================
-- ART EYE schema. Users are curators; venue owners submit; admins approve.
-- City lives on venues and exhibitions from day one, so a second city is a
-- data task, not a rebuild. Guides tables are a phase-2 stub (shared,
-- ordered city guides) — present so follows/guides need no migration pain.
--
-- Every statement below is written to be safe to paste and run more than
-- once on the same project (e.g. after a run that failed partway through).

-- CREATE TYPE has no IF NOT EXISTS in Postgres, so each is wrapped.
do $$ begin
  create type user_role as enum ('user', 'venue_owner', 'admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type profile_type as enum ('collector', 'enthusiast', 'student', 'artist', 'gallery_professional');
exception when duplicate_object then null; end $$;
do $$ begin
  create type venue_type as enum ('museum', 'gallery');
exception when duplicate_object then null; end $$;
do $$ begin
  create type exhibition_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type rejection_reason as enum ('outside_sydney', 'incomplete', 'no_image', 'other');
exception when duplicate_object then null; end $$;

-- profiles ("users" in the product spec): one row per auth user
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'user',
  profile_type profile_type not null default 'enthusiast',
  display_name text not null default '',
  city text not null default 'Sydney',
  created_at timestamptz not null default now()
);

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type venue_type not null default 'gallery',
  address text,
  city text not null default 'Sydney',
  owner_user_id uuid references profiles (id) on delete set null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists exhibitions (
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

create table if not exists user_watchlist (
  user_id uuid not null references profiles (id) on delete cascade,
  exhibition_id uuid not null references exhibitions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exhibition_id)
);

create table if not exists user_visits (
  user_id uuid not null references profiles (id) on delete cascade,
  exhibition_id uuid not null references exhibitions (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  reflection text not null default '',
  visit_date date not null default current_date,
  primary key (user_id, exhibition_id)
);

-- phase-2 stub: user-curated city guides
create table if not exists guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  intro text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists guide_items (
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

drop trigger if exists on_auth_user_created on auth.users;
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
drop policy if exists "profiles: own read" on profiles;
create policy "profiles: own read" on profiles for select using (id = auth.uid() or is_admin());
drop policy if exists "profiles: own update" on profiles;
create policy "profiles: own update" on profiles for update using (id = auth.uid());

-- venues: public directory; anyone (incl. anon) may add one via submission;
-- owners and admins may edit their own.
drop policy if exists "venues: public read" on venues;
create policy "venues: public read" on venues for select using (true);
drop policy if exists "venues: anyone insert" on venues;
create policy "venues: anyone insert" on venues for insert with check (true);
drop policy if exists "venues: owner update" on venues;
create policy "venues: owner update" on venues for update
  using (owner_user_id = auth.uid() or is_admin());

-- exhibitions: approved rows are public; owners see their venue's rows;
-- admins see all. Inserts (public or venue) must be pending, never featured.
drop policy if exists "exhibitions: approved read" on exhibitions;
create policy "exhibitions: approved read" on exhibitions for select
  using (
    status = 'approved'
    or is_admin()
    or exists (select 1 from venues v where v.id = venue_id and v.owner_user_id = auth.uid())
  );
drop policy if exists "exhibitions: pending insert" on exhibitions;
create policy "exhibitions: pending insert" on exhibitions for insert
  with check (status = 'pending' and is_featured = false and rejection_reason is null);
drop policy if exists "exhibitions: owner or admin update" on exhibitions;
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
drop policy if exists "exhibitions: admin delete" on exhibitions;
create policy "exhibitions: admin delete" on exhibitions for delete using (is_admin());

-- watchlist & visits: strictly private to the user
drop policy if exists "watchlist: own" on user_watchlist;
create policy "watchlist: own" on user_watchlist for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "visits: own" on user_visits;
create policy "visits: own" on user_visits for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- guides (phase 2): private to author for now; public sharing arrives with the feature
drop policy if exists "guides: own" on guides;
create policy "guides: own" on guides for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "guide_items: own" on guide_items;
create policy "guide_items: own" on guide_items for all
  using (exists (select 1 from guides g where g.id = guide_id and g.user_id = auth.uid()))
  with check (exists (select 1 from guides g where g.id = guide_id and g.user_id = auth.uid()));

-- storage: public-read bucket for exhibition images; anyone may upload a submission image
insert into storage.buckets (id, name, public) values ('exhibition-images', 'exhibition-images', true)
  on conflict (id) do nothing;
drop policy if exists "exhibition images read" on storage.objects;
create policy "exhibition images read" on storage.objects for select
  using (bucket_id = 'exhibition-images');
drop policy if exists "exhibition images insert" on storage.objects;
create policy "exhibition images insert" on storage.objects for insert
  with check (bucket_id = 'exhibition-images');

-- ============================================================
-- migrations/0002_venue_type_ari.sql
-- ============================================================
-- Add "ari" (artist-run initiative) to the venue_type enum.
-- Kept in its own migration: Postgres forbids using a freshly added enum
-- value in the same transaction that adds it, so nothing else lives here.
alter type venue_type add value if not exists 'ari';

-- ============================================================
-- migrations/0003_venue_register.sql
-- ============================================================
-- Venue register: turn the thin venues table into a managed Sydney register.
-- Adds slug / suburb / website / instagram / lat-long / is_claimed / is_fixture,
-- auto-generates slugs, and guarantees fixture/test data can never reach the
-- public feed (enforced in RLS, so it holds regardless of the client query).
--
-- exhibitions.venue_id already exists as a NOT NULL foreign key (see 0001),
-- so there is no exhibition→venue migration to run here — only the fixture flag.

-- ---------------------------------------------------------------- columns
alter table venues
  add column if not exists slug       text,
  add column if not exists suburb     text,
  add column if not exists website    text,
  add column if not exists instagram  text,
  add column if not exists latitude   double precision,
  add column if not exists longitude  double precision,
  add column if not exists is_claimed boolean not null default false,
  add column if not exists is_fixture boolean not null default false;

-- test/fixture exhibitions (e.g. rows created while trying the app) can be
-- hidden even when they sit at a real venue.
alter table exhibitions
  add column if not exists is_fixture boolean not null default false;

-- a claimed venue is one an owner account is attached to
update venues set is_claimed = true where owner_user_id is not null;

-- ---------------------------------------------------------------- slugs
-- lower-case, hyphenated, ascii-only handle used in urls and for seed upserts.
create or replace function slugify(txt text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- new venues (incl. those created from a submission) get a unique slug for free.
create or replace function venue_set_slug() returns trigger
language plpgsql as $$
declare base text; candidate text; n int := 0;
begin
  if new.slug is null or new.slug = '' then
    base := slugify(new.name);
    if base = '' then base := 'venue'; end if;
    candidate := base;
    while exists (select 1 from venues where slug = candidate and id <> new.id) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists venue_slug_before_write on venues;
create trigger venue_slug_before_write
  before insert or update of name, slug on venues
  for each row execute function venue_set_slug();

-- backfill slugs for every existing venue, resolving any collisions.
do $$
declare r record; base text; candidate text; n int;
begin
  for r in select id, name from venues where slug is null or slug = '' loop
    base := slugify(r.name);
    if base = '' then base := 'venue'; end if;
    candidate := base; n := 0;
    while exists (select 1 from venues where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    update venues set slug = candidate where id = r.id;
  end loop;
end $$;

alter table venues alter column slug set not null;
create unique index if not exists venues_slug_key on venues (slug);

-- ---------------------------------------------------------------- public feed guard
-- Fixtures are invisible to the public directory and agenda. Owners still see
-- their own venue; admins see everything. Because this lives in RLS, a fixture
-- row cannot leak into the feed even if a client forgets to filter it.
drop policy if exists "venues: public read" on venues;
create policy "venues: public read" on venues for select using (
  is_fixture = false
  or owner_user_id = auth.uid()
  or is_admin()
);

drop policy if exists "exhibitions: approved read" on exhibitions;
create policy "exhibitions: approved read" on exhibitions for select using (
  (status = 'approved' and is_fixture = false)
  or is_admin()
  or exists (select 1 from venues v where v.id = venue_id and v.owner_user_id = auth.uid())
);

-- ============================================================
-- migrations/0004_host_controls.sql
-- ============================================================
-- Host controls: give the admin (the host account) full ownership of what is
-- in the app, and make sure nobody else can reach these powers.
--
-- "Host" == the account whose profile.role = 'admin'. That role can only be
-- granted directly in the database (signup metadata is limited to 'user' /
-- 'venue_owner'), so admin rights cannot be self-assigned from the app.
--
-- Every policy below is gated on is_admin(); the matching app screens are gated
-- on profile.role === 'admin'. Both layers must agree before anything happens.

-- venues: the host may create, edit and delete any venue.
-- (public/anon insert of a submitted venue and owner self-edit already exist.)
drop policy if exists "venues: admin delete" on venues;
create policy "venues: admin delete" on venues for delete using (is_admin());

drop policy if exists "venues: admin insert" on venues;
create policy "venues: admin insert" on venues for insert with check (is_admin());

-- exhibitions: the host may publish directly (any status, may feature) and
-- delete anything. The existing public "pending insert" policy stays for
-- ordinary submissions; this adds an unrestricted admin path alongside it.
drop policy if exists "exhibitions: admin insert" on exhibitions;
create policy "exhibitions: admin insert" on exhibitions for insert with check (is_admin());

-- ("exhibitions: owner or admin update" and "exhibitions: admin delete" already
--  grant the host edit + delete rights — see 0001_init.sql.)

-- ============================================================
-- migrations/0005_venue_pipeline.sql
-- ============================================================
-- ============================================================================
-- 0005 — Venue freshness pipeline: schema + RLS
-- ============================================================================
-- Core principle: the pipeline proposes, the owner applies. Nothing here lets
-- an automated job change user-facing venue data; the review queue is the only
-- path, and only the owner (profiles.role = 'admin', via is_admin()) can read
-- or act on it. Edge Functions write with the service-role key, which bypasses
-- RLS by design — client apps never can.
--
-- Adapted to the existing schema (0001–0004): we keep the existing column
-- names `website`, `instagram`, `latitude`, `longitude` (spec: website_url /
-- instagram_handle / lat / lng) and keep the existing coarse `type` enum
-- (museum / gallery / ari) that drives the app's filters. The spec's richer
-- venue_type taxonomy lands in a NEW column `category`, so nothing breaks.

-- ---------------------------------------------------------------- venues
do $$ begin
  if not exists (select 1 from pg_type where typname = 'venue_status') then
    create type venue_status as enum ('active', 'archived', 'pending');
  end if;
end $$;

alter table venues
  add column if not exists status              venue_status not null default 'active',
  add column if not exists verified_date       date,
  add column if not exists verification_source text,
  add column if not exists tier                text,
  add column if not exists category            text,
  add column if not exists free_entry          boolean,
  add column if not exists editorial_note      text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'venues_category_check') then
    alter table venues add constraint venues_category_check check (
      category is null or category in
        ('institution','public','commercial','ari','first_nations','event','day_trip','auction')
    );
  end if;
end $$;

create index if not exists venues_status_idx        on venues (status);
create index if not exists venues_verified_date_idx on venues (verified_date nulls first);

-- Archived and pending venues leave the public feed. (Fixture rule from 0003
-- stays; owners still see their own venue; the owner sees everything.)
drop policy if exists "venues: public read" on venues;
create policy "venues: public read" on venues for select using (
  (is_fixture = false and status = 'active')
  or owner_user_id = auth.uid()
  or is_admin()
);

-- ---------------------------------------------------- venue_review_queue
do $$ begin
  if not exists (select 1 from pg_type where typname = 'proposal_action') then
    create type proposal_action as enum ('add', 'archive', 'update');
  end if;
  if not exists (select 1 from pg_type where typname = 'proposal_status') then
    create type proposal_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists venue_review_queue (
  id               uuid primary key default gen_random_uuid(),
  venue_id         uuid references venues (id) on delete cascade, -- null = new-venue suggestion
  action_type      proposal_action not null,
  proposed_payload jsonb not null default '{}'::jsonb,
  evidence         jsonb not null,
  confidence       double precision check (confidence >= 0 and confidence <= 1),
  reason           text not null default '',
  status           proposal_status not null default 'pending',
  review_note      text,
  snooze_until     date,
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz,
  -- no evidence → no proposal (spec guardrail, enforced at the database)
  constraint evidence_required check (
    jsonb_typeof(evidence) = 'array' and jsonb_array_length(evidence) >= 1
  ),
  -- add-proposals must know what they propose to add
  constraint add_needs_payload check (
    action_type <> 'add' or proposed_payload <> '{}'::jsonb
  )
);

-- Idempotency: at most ONE pending proposal per venue + action. New-venue
-- suggestions (venue_id null) dedupe on the proposed slug instead.
create unique index if not exists review_queue_pending_unique
  on venue_review_queue (
    coalesce(venue_id::text, proposed_payload->>'slug'),
    action_type
  )
  where status = 'pending';

create index if not exists review_queue_status_idx on venue_review_queue (status, created_at);

-- ------------------------------------------------------- validation_runs
do $$ begin
  if not exists (select 1 from pg_type where typname = 'run_type') then
    create type run_type as enum ('validate', 'discover');
  end if;
end $$;

create table if not exists validation_runs (
  id                uuid primary key default gen_random_uuid(),
  run_type          run_type not null,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  venues_checked    int not null default 0,
  proposals_created int not null default 0,
  errors            jsonb not null default '[]'::jsonb,
  cost_estimate     numeric(8,4) not null default 0
);

-- ------------------------------------------------------------------- RLS
-- Owner-only, on every verb. Pipeline jobs use the service-role key (bypasses
-- RLS); no client other than the owner can see queue or logs.
alter table venue_review_queue enable row level security;
alter table validation_runs enable row level security;

drop policy if exists "review queue: owner only" on venue_review_queue;
create policy "review queue: owner only" on venue_review_queue
  for all using (is_admin()) with check (is_admin());

drop policy if exists "validation runs: owner only" on validation_runs;
create policy "validation runs: owner only" on validation_runs
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- migrations/0007_curated_lists.sql
-- ============================================================
-- 0007 — public curated lists on top of the guides tables.
-- A guide can now be published as a curated list by an artist, gallerist or
-- the editors: flag it is_public and it appears in the app's CURATED strip.
-- Private guides keep their existing owner-only policies.

alter table guides
  add column if not exists is_public    boolean not null default false,
  add column if not exists curator_name text,
  add column if not exists curator_role text not null default 'curator';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'guides_curator_role_check') then
    alter table guides add constraint guides_curator_role_check
      check (curator_role in ('artist', 'gallerist', 'curator'));
  end if;
end $$;

drop policy if exists "guides: public read" on guides;
create policy "guides: public read" on guides for select using (is_public = true);

drop policy if exists "guide_items: public read" on guide_items;
create policy "guide_items: public read" on guide_items for select using (
  exists (select 1 from guides g where g.id = guide_id and g.is_public = true)
);

-- The host publishes/curates lists (venue owners' and artists' picks are
-- entered via their own guides and flagged public by the host).
drop policy if exists "guides: admin all" on guides;
create policy "guides: admin all" on guides for all using (is_admin()) with check (is_admin());
drop policy if exists "guide_items: admin all" on guide_items;
create policy "guide_items: admin all" on guide_items for all using (is_admin()) with check (is_admin());

-- ============================================================
-- migrations/0008_video_urls.sql
-- ============================================================
-- 0008 — moving backgrounds: optional short video clips on venues and
-- exhibitions. Supplied by the host or a claimed venue account; the app plays
-- them as muted, looping backdrops (hero carousel, venue page, exhibition
-- page). Where no clip exists the app animates the editorial photo instead,
-- so nothing here is required.

alter table public.venues
  add column if not exists video_url text;

alter table public.exhibitions
  add column if not exists video_url text;

-- ============================================================
-- migrations/0009_opening_hours.sql
-- ============================================================
-- 0009 — opening hours on the venue register.
-- opening_hours holds the compact human line shown on the venue page
-- (e.g. "Tue–Sat 10:00–17:00"); hours_checked records when it was last
-- verified against the venue's own website, so stale hours are visible.
-- Kept as text on purpose: gallery hours are irregular (appointment-only,
-- seasonal closures) and a structured schema would lie more than it helps.

alter table public.venues
  add column if not exists opening_hours text,
  add column if not exists hours_checked date;

-- ============================================================
-- migrations/0010_press_images.sql
-- ============================================================
-- 0010 — press images for exhibitions (enrich-images pipeline).
-- image_source records the page the image came from (the venue's own
-- exhibition page or a listing), so every automatically fetched press image
-- is auditable and the host can clear or replace it in the admin editor.

alter type run_type add value if not exists 'enrich';

alter table public.exhibitions
  add column if not exists image_source text;

-- The weekly cron schedule for this pipeline (Tuesdays 02:30) lives in
-- 0006_pipeline_cron.sql alongside the other pipeline jobs — it needs
-- pg_cron/pg_net enabled and the call_pipeline_function() helper that only
-- exists once that (optional, manual-setup) migration has been run.

-- ============================================================
-- migrations/0011_reel_links.sql
-- ============================================================
-- 0011 — Instagram Reel / TikTok links on venues and exhibitions.
-- reel_url is just a link to a post the venue or gallery already published —
-- tapping it opens the Reel/TikTok itself (Linking.openURL), never an
-- embedded scrape. Kept deliberately separate from video_url (a direct .mp4
-- used as a moving background) since a social post and a raw clip serve
-- different purposes in the app.

alter table public.venues
  add column if not exists reel_url text;

alter table public.exhibitions
  add column if not exists reel_url text;

-- ============================================================
-- migrations/0012_social.sql
-- ============================================================
-- 0012 — social layer: follow graph, profile privacy and a friends activity feed.
-- Users can follow each other (Strava-style). Public profiles are followed
-- instantly; private profiles gate the follow on the owner's approval. A
-- follower can read the visits (activity) of anyone they follow, plus anyone
-- with a public profile.

alter table profiles
  add column if not exists is_private boolean not null default false;

create table if not exists follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'accepted' check (status in ('accepted', 'pending')),
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists follows_followee_idx on follows (followee_id);

alter table follows enable row level security;

-- A follow row is visible to the two parties it concerns.
drop policy if exists "follows: involved read" on follows;
create policy "follows: involved read" on follows for select
  using (follower_id = auth.uid() or followee_id = auth.uid() or is_admin());

-- You create your own follow edges. Following a private profile inserts a
-- 'pending' row; following a public profile inserts 'accepted' (enforced in the
-- API, which reads the target's is_private before inserting).
drop policy if exists "follows: own insert" on follows;
create policy "follows: own insert" on follows for insert
  with check (follower_id = auth.uid());

-- You can unfollow (delete your own edge); the followee can remove a follower.
drop policy if exists "follows: own delete" on follows;
create policy "follows: own delete" on follows for delete
  using (follower_id = auth.uid() or followee_id = auth.uid());

-- The followee approves/rejects a pending request by updating status.
drop policy if exists "follows: followee update" on follows;
create policy "follows: followee update" on follows for update
  using (followee_id = auth.uid()) with check (followee_id = auth.uid());

-- Profiles become discoverable: any authenticated user can read profile rows
-- (display name, type, city, privacy flag). Email never lives here — it stays
-- in auth.users — so this exposes no contact details.
drop policy if exists "profiles: own read" on profiles;
drop policy if exists "profiles: discoverable read" on profiles;
create policy "profiles: discoverable read" on profiles for select
  using (auth.uid() is not null);

-- Activity visibility: you can read a user's visits if it's you, if their
-- profile is public, or if you're an accepted follower.
drop policy if exists "visits: own" on user_visits;
drop policy if exists "visits: own write" on user_visits;
create policy "visits: own write" on user_visits for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "visits: followers read" on user_visits;
create policy "visits: followers read" on user_visits for select using (
  user_id = auth.uid()
  or exists (select 1 from profiles p where p.id = user_id and p.is_private = false)
  or exists (
    select 1 from follows f
    where f.followee_id = user_id and f.follower_id = auth.uid() and f.status = 'accepted'
  )
  or is_admin()
);

-- ============================================================
-- migrations/0013_post_video.sql
-- ============================================================
-- 0013 — short video clips on user posts (visit logs).
-- Reuses the existing exhibition-images storage bucket and the app's expo-video
-- player; only a nullable url column is needed on the visits table.

alter table user_visits
  add column if not exists video_url text;

-- ============================================================
-- migrations/0014_reactions.sql
-- ============================================================
-- 0014 — Letterboxd-style reactions: likes and comments on posts.
-- A "post" is a user's visit, keyed by (post_user_id, exhibition_id).

create table if not exists post_likes (
  user_id uuid not null references profiles (id) on delete cascade,       -- who liked
  post_user_id uuid not null references profiles (id) on delete cascade,  -- whose post
  exhibition_id uuid not null references exhibitions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_user_id, exhibition_id)
);
create index if not exists post_likes_post_idx on post_likes (post_user_id, exhibition_id);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_user_id uuid not null references profiles (id) on delete cascade,
  exhibition_id uuid not null references exhibitions (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on post_comments (post_user_id, exhibition_id);

alter table post_likes enable row level security;
alter table post_comments enable row level security;

-- You can read reactions on a post you can see (the post owner is public, or you
-- follow them, or it's your own). Mirrors the user_visits visibility rule.
create or replace function can_see_post(owner uuid) returns boolean language sql stable as $$
  select owner = auth.uid()
      or exists (select 1 from profiles p where p.id = owner and p.is_private = false)
      or exists (select 1 from follows f where f.followee_id = owner and f.follower_id = auth.uid() and f.status = 'accepted')
      or is_admin();
$$;

drop policy if exists "post_likes: read" on post_likes;
create policy "post_likes: read" on post_likes for select using (can_see_post(post_user_id));
drop policy if exists "post_likes: own write" on post_likes;
create policy "post_likes: own write" on post_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and can_see_post(post_user_id));

drop policy if exists "post_comments: read" on post_comments;
create policy "post_comments: read" on post_comments for select using (can_see_post(post_user_id));
drop policy if exists "post_comments: author write" on post_comments;
create policy "post_comments: author write" on post_comments for all
  using (author_id = auth.uid()) with check (author_id = auth.uid() and can_see_post(post_user_id));

-- ============================================================
-- migrations/0015_exhibition_pipeline.sql
-- ============================================================
-- 0015 — exhibition discovery pipeline.
-- The discover-exhibitions Edge Function reads each venue's own website (plus
-- aggregators) via Claude web_search and files CURRENT/UPCOMING shows here.
-- Nothing publishes automatically: an admin approves a row, which inserts the
-- real exhibition. Same "propose, never apply" principle as the venue pipeline.

create table if not exists exhibition_review_queue (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  title text not null,
  artists text not null default '',
  start_date date,
  end_date date,
  description text not null default '',
  source_url text,                 -- where it was found (the venue's page)
  confidence numeric not null default 0.5 check (confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists exq_status_idx on exhibition_review_queue (status);
create index if not exists exq_venue_idx on exhibition_review_queue (venue_id);

alter table exhibition_review_queue enable row level security;
drop policy if exists "exq: admin all" on exhibition_review_queue;
create policy "exq: admin all" on exhibition_review_queue for all
  using (is_admin()) with check (is_admin());

-- Approve a queued exhibition: insert the real show and mark the row approved.
-- SECURITY DEFINER so an admin can call it via RPC; guarded by is_admin().
create or replace function approve_exhibition_proposal(qid uuid)
returns uuid language plpgsql security definer as $$
declare q exhibition_review_queue;
        new_id uuid;
begin
  if not is_admin() then raise exception 'not authorised'; end if;
  select * into q from exhibition_review_queue where id = qid and status = 'pending';
  if not found then raise exception 'proposal not found or already handled'; end if;

  insert into exhibitions (venue_id, title, artists, start_date, end_date, description, image_source, status, is_featured, city)
  values (q.venue_id, q.title, q.artists,
          coalesce(q.start_date, current_date), coalesce(q.end_date, current_date),
          q.description, q.source_url, 'approved', false, 'Sydney')
  returning id into new_id;

  update exhibition_review_queue set status = 'approved', reviewed_at = now() where id = qid;
  return new_id;
end $$;

-- ============================================================
-- migrations/0016_direct_messages.sql
-- ============================================================
-- 0016 — Direct messages between mutual follows.
-- A thread is the pair (sender, recipient) in both directions; messaging is
-- only possible when both directions of the follow are accepted, enforced by
-- RLS so the client cannot bypass the rule.

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);
create index if not exists direct_messages_pair_idx
  on direct_messages (sender_id, recipient_id, created_at);
create index if not exists direct_messages_unread_idx
  on direct_messages (recipient_id) where read_at is null;

alter table direct_messages enable row level security;

-- Both directions of the follow accepted — the mutual-follow gate.
create or replace function follows_each_other(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from follows f
    where f.follower_id = a and f.followee_id = b and f.status = 'accepted'
  ) and exists (
    select 1 from follows f
    where f.follower_id = b and f.followee_id = a and f.status = 'accepted'
  );
$$;

-- Only the two participants can read a thread.
drop policy if exists "dm: participants read" on direct_messages;
create policy "dm: participants read" on direct_messages for select
  using (auth.uid() in (sender_id, recipient_id));

-- You send as yourself, and only to someone who follows you back.
drop policy if exists "dm: send to mutuals" on direct_messages;
create policy "dm: send to mutuals" on direct_messages for insert
  with check (sender_id = auth.uid() and follows_each_other(sender_id, recipient_id));

-- The recipient may update (used to set read_at when opening the thread).
drop policy if exists "dm: recipient marks read" on direct_messages;
create policy "dm: recipient marks read" on direct_messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ============================================================
-- migrations/0017_feedback.sql
-- ============================================================
-- 0017 — Feedback to the app owner.
-- Anyone (signed in or not) can write a note to the owner: general feedback,
-- or a "something is missing/wrong" report attached to a venue or exhibition.
-- Only the admin reads the inbox and marks items handled.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('general', 'venue', 'exhibition')),
  subject_id uuid,          -- venue/exhibition id; no FK so reports survive deletes
  subject_name text,        -- denormalised label for the inbox
  text text not null check (char_length(text) between 1 and 4000),
  sender_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'done'))
);
create index if not exists feedback_status_idx on feedback (status, created_at desc);

alter table feedback enable row level security;

-- Anyone may submit; you can only sign it as yourself (or leave it unsigned).
drop policy if exists "feedback: anyone submits" on feedback;
create policy "feedback: anyone submits" on feedback for insert
  with check (sender_id is null or sender_id = auth.uid());

-- Only the owner reads and updates the inbox.
drop policy if exists "feedback: admin reads" on feedback;
create policy "feedback: admin reads" on feedback for select using (is_admin());
drop policy if exists "feedback: admin updates" on feedback;
create policy "feedback: admin updates" on feedback for update
  using (is_admin()) with check (is_admin());

-- ============================================================
-- migrations/0018_blocking_and_deletion.sql
-- ============================================================
-- 0018 — blocking, reports (reuses feedback), account deletion, push tokens.
-- App Store readiness: guideline 1.2 (block + report for user-generated
-- content) and 5.1.1(v) (in-app, self-service account deletion).

create table if not exists blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on blocks (blocked_id);

alter table blocks enable row level security;

-- You can see (and therefore only manage) your own blocklist.
drop policy if exists "blocks: own read" on blocks;
create policy "blocks: own read" on blocks for select using (blocker_id = auth.uid());
drop policy if exists "blocks: own write" on blocks;
create policy "blocks: own write" on blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Bidirectional check used by RLS on posts/messages/etc: true if either side
-- has blocked the other.
create or replace function is_blocked(a uuid, b uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Reports reuse the feedback table (kind: 'profile' | 'post') — widen the
-- check constraint rather than add a parallel moderation table.
alter table feedback drop constraint if exists feedback_kind_check;
alter table feedback add constraint feedback_kind_check
  check (kind in ('general', 'venue', 'exhibition', 'profile', 'post'));

-- A block also ends any existing follow, in either direction.
create or replace function block_user(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if target = auth.uid() then
    raise exception 'cannot block yourself';
  end if;
  insert into blocks (blocker_id, blocked_id) values (auth.uid(), target)
    on conflict (blocker_id, blocked_id) do nothing;
  delete from follows
    where (follower_id = auth.uid() and followee_id = target)
       or (follower_id = target and followee_id = auth.uid());
end;
$$;

-- Fold the block into direct-message visibility: a blocked pair can no
-- longer read or send to each other, on top of the existing mutual-follow
-- gate from 0016.
drop policy if exists "dm: participants read" on direct_messages;
create policy "dm: participants read" on direct_messages for select
  using (auth.uid() in (sender_id, recipient_id) and not is_blocked(sender_id, recipient_id));
drop policy if exists "dm: send to mutuals" on direct_messages;
create policy "dm: send to mutuals" on direct_messages for insert
  with check (
    sender_id = auth.uid()
    and follows_each_other(sender_id, recipient_id)
    and not is_blocked(sender_id, recipient_id)
  );

-- Push notification device tokens: one row per (user, token) so a person
-- signed in on several devices gets pushes on all of them.
create table if not exists push_tokens (
  user_id uuid not null references profiles (id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table push_tokens enable row level security;
drop policy if exists "push_tokens: own" on push_tokens;
create policy "push_tokens: own" on push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Self-service account deletion. SECURITY DEFINER so it can reach
-- auth.users, which the client's anon/authenticated role cannot touch
-- directly; every profiles-referencing table already cascades from
-- profiles.id, which cascades from auth.users.id (0001_init.sql).
create or replace function delete_own_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;

revoke all on function block_user(uuid) from public;
grant execute on function block_user(uuid) to authenticated;

-- ============================================================
-- migrations/0019_engagement_plus.sql
-- ============================================================
-- 0019 — notification center, comment replies + comment likes, DM media.
-- Adds the schema for the second round of social features: an in-app
-- notification feed, threaded comment replies, likes on comments, and
-- optional images attached to direct messages. "Friends who also saw this",
-- streaks and the yearly wrap-up need no schema — they're derived client-side
-- from user_visits/follows that already exist.

-- ---- comment threading -------------------------------------------------
-- null parent_comment_id = a top-level comment; otherwise a reply to it.
-- One level deep by design (a reply's parent is always a top-level comment) —
-- the UI never lets you reply to a reply, so nothing enforces that in SQL.
alter table post_comments add column if not exists parent_comment_id uuid
  references post_comments (id) on delete cascade;
create index if not exists post_comments_parent_idx on post_comments (parent_comment_id);

-- ---- comment likes ------------------------------------------------------
create table if not exists comment_likes (
  user_id uuid not null references profiles (id) on delete cascade,
  comment_id uuid not null references post_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);
create index if not exists comment_likes_comment_idx on comment_likes (comment_id);

alter table comment_likes enable row level security;

drop policy if exists "comment_likes: read" on comment_likes;
create policy "comment_likes: read" on comment_likes for select using (
  exists (select 1 from post_comments c where c.id = comment_id and can_see_post(c.post_user_id))
);
drop policy if exists "comment_likes: own write" on comment_likes;
create policy "comment_likes: own write" on comment_likes for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from post_comments c where c.id = comment_id and can_see_post(c.post_user_id))
  );

-- ---- direct message media -------------------------------------------------
-- A message can now carry an image with or instead of text.
alter table direct_messages add column if not exists image_url text;
alter table direct_messages alter column text set default '';
alter table direct_messages drop constraint if exists direct_messages_text_check;
alter table direct_messages add constraint direct_messages_text_check
  check (image_url is not null or char_length(text) between 1 and 2000);

-- ---- notification center ---------------------------------------------------
-- One row per event a user should see in their in-app inbox (likes, comments,
-- replies, comment likes, new/accepted follows, mentions, messages). Kept
-- separate from push (push is fire-and-forget and unread state doesn't
-- matter there; this is the durable, readable record).
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade, -- recipient
  kind text not null check (
    kind in ('like', 'comment', 'reply', 'comment_like', 'follow', 'follow_request', 'message', 'mention')
  ),
  actor_id uuid references profiles (id) on delete set null,
  exhibition_id uuid references exhibitions (id) on delete cascade,
  post_user_id uuid references profiles (id) on delete cascade, -- the post this refers to, when relevant
  comment_id uuid references post_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on notifications (user_id) where read_at is null;

alter table notifications enable row level security;

drop policy if exists "notifications: own read" on notifications;
create policy "notifications: own read" on notifications for select using (user_id = auth.uid());
-- The actor writes the notification at the moment they act (liking, commenting,
-- following, messaging) — same trust level the existing push helper already
-- uses (see send-push), just durable and readable in-app.
drop policy if exists "notifications: actor write" on notifications;
create policy "notifications: actor write" on notifications for insert
  with check (actor_id = auth.uid());
drop policy if exists "notifications: recipient marks read" on notifications;
create policy "notifications: recipient marks read" on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- migrations/0020_post_photo_and_feed_media.sql
-- ============================================================
-- 0020 — a still photo alternative to the existing video clip on a post
-- (0013_post_video.sql). A post carries one or the other, never both.

alter table user_visits
  add column if not exists photo_url text;

-- ============================================================
-- migrations/0021_venue_facts.sql
-- ============================================================
-- 0021 — the two venue facts the app already renders but the database never had.
--
-- venue-meta.ts builds the description block from type, founding year and entry
-- price. `free_entry` arrived with the register, but `founded_year` and
-- `entry_checked` existed only in the bundled demo seed — so in live mode the
-- founding year silently disappeared and the "checked on" date with it.

alter table venues
  add column if not exists founded_year  int,
  add column if not exists entry_checked date;

comment on column venues.founded_year is
  'Year the venue was established — verified, else null.';
comment on column venues.entry_checked is
  'Date the type / founded / entry facts were last verified.';

-- ============================================================
-- migrations/0022_exhibitions_follow_venue_status.sql
-- ============================================================
-- 0022 — a show is only public while its venue is.
--
-- The venues policy (0005) drops archived and pending venues from the public
-- feed, but the exhibitions policy never looked at the venue at all. So a show
-- left over from an earlier seed run, or approved before a venue closed, stayed
-- readable while its venue row was hidden — the card renders with no venue
-- behind it. Archiving a venue now takes its shows with it.
--
-- The owner and admin branches are unchanged: an owner still sees everything at
-- their own venue, whatever its status.

drop policy if exists "exhibitions: approved read" on exhibitions;
create policy "exhibitions: approved read" on exhibitions for select using (
  (
    status = 'approved'
    and is_fixture = false
    and exists (
      select 1 from venues v
      where v.id = venue_id and v.is_fixture = false and v.status = 'active'
    )
  )
  or is_admin()
  or exists (select 1 from venues v where v.id = venue_id and v.owner_user_id = auth.uid())
);

-- ============================================================
-- migrations/0023_pipeline_autopilot.sql
-- ============================================================
-- 0023 — let the engine finish its own work.
--
-- The discovery pipeline files proposals and stops there: every show needs a
-- human tap before it goes live. That is the right default for anything the AI
-- fallback interpreted, but it also means the register ages the moment nobody
-- is reviewing. Two helpers close the loop:
--
--   auto_approve_exhibition_proposals()  publishes only what was copied
--                                        verbatim from a venue's own
--                                        schema.org data (confidence >= 0.9).
--   expire_exhibition_proposals()        clears out proposals for shows that
--                                        have already finished.
--
-- Anything the Gemini fallback interpreted (confidence 0.65) still waits for
-- you in the Owner Inbox. "Propose, never apply" holds where it matters.

alter type run_type add value if not exists 'auto_approve';

-- ---------------------------------------------------------------- approve
create or replace function auto_approve_exhibition_proposals(min_confidence numeric default 0.9)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  q          exhibition_review_queue;
  approved   int := 0;
  run        uuid;
begin
  insert into validation_runs (run_type, venues_checked) values ('auto_approve', 0)
    returning id into run;

  for q in
    select eq.* from exhibition_review_queue eq
    join venues v on v.id = eq.venue_id
    where eq.status = 'pending'
      and eq.confidence >= min_confidence
      -- never publish at a venue the register does not publish
      and v.status = 'active' and v.is_fixture = false
      -- a show needs real, sane, still-running dates
      and eq.start_date is not null and eq.end_date is not null
      and eq.end_date >= eq.start_date
      and eq.end_date >= current_date
      -- and must not already be on the wall
      and not exists (
        select 1 from exhibitions e
        where e.venue_id = eq.venue_id and lower(e.title) = lower(eq.title)
      )
    order by eq.created_at
  loop
    insert into exhibitions (venue_id, title, artists, start_date, end_date,
                             description, image_source, status, is_featured, city)
    values (q.venue_id, q.title, q.artists, q.start_date, q.end_date,
            q.description, q.source_url, 'approved', false, 'Sydney');
    update exhibition_review_queue
      set status = 'approved', reviewed_at = now() where id = q.id;
    approved := approved + 1;
  end loop;

  update validation_runs
    set finished_at = now(), proposals_created = approved where id = run;
  return approved;
end $$;

-- ----------------------------------------------------------------- expire
-- Proposals for shows that have already closed are noise in the inbox.
create or replace function expire_exhibition_proposals()
returns integer
language plpgsql security definer set search_path = public as $$
declare expired int;
begin
  update exhibition_review_queue
    set status = 'rejected', reviewed_at = now()
    where status = 'pending' and end_date is not null and end_date < current_date;
  get diagnostics expired = row_count;
  return expired;
end $$;

-- Both run as the scheduler or the service role, never from a browser.
revoke all on function auto_approve_exhibition_proposals(numeric) from public, anon, authenticated;
revoke all on function expire_exhibition_proposals() from public, anon, authenticated;
grant execute on function auto_approve_exhibition_proposals(numeric) to service_role;
grant execute on function expire_exhibition_proposals() to service_role;

-- ----------------------------------------------------------------- health
-- One row per job: when it last ran and what it did. A job that stops working
-- shows up here as a stale last_run instead of as silence.
create or replace view pipeline_health as
  select
    r.run_type::text                              as job,
    max(r.started_at)                             as last_run,
    (now() - max(r.started_at))                   as ago,
    sum(r.proposals_created)                      as proposals_total
  from validation_runs r
  group by r.run_type;

alter view pipeline_health set (security_invoker = on);

-- ART EYE — SETUP STEP 2 of 2: DE SYDNEY VENUES.
-- Run setup_1_schema.sql FIRST, then paste this file and press Run.
-- Safe to run repeatedly (venues are matched on slug).

-- ============================================================================
--  ART EYE — SYDNEY VENUE REGISTER  (seed / upsert)
-- ============================================================================
--  GENERATED FILE — do not edit by hand.
--  Source: art-eye/src/lib/seed.ts. Regenerate with `npm run seed:sql`.
--
--  167 venues, 160 of them published. Rows are matched on `slug`, so
--  running this again updates the register instead of creating duplicates.
--
--  Run AFTER the migrations in ./migrations (needs the register columns).
--
--  Venues that have closed or left their space keep their row with
--  status = 'archived' (or 'pending' where a closure is unconfirmed): the app
--  and the live view publish only status = 'active', and keeping the row stops
--  the discovery pipeline from proposing the venue all over again.
-- ============================================================================

insert into venues (slug, name, type, category, tier, editorial_note, address, suburb, website, instagram, latitude, longitude, city, founded_year, free_entry, entry_checked, opening_hours, hours_checked, status) values
  ('art-gallery-of-new-south-wales', 'Art Gallery of New South Wales', 'museum', null, null, null, 'Art Gallery Road, The Domain, Sydney NSW 2000', 'The Domain', 'https://www.artgallery.nsw.gov.au', '@artgalleryofnsw', -33.8688, 151.2173, 'Sydney', 1871, true, '2026-07-22', 'Daily 10:00–17:00, Wed until 22:00', '2026-07-21', 'active'),
  ('mca-australia', 'MCA Australia', 'museum', null, null, null, '140 George Street, The Rocks, Sydney NSW 2000', 'The Rocks', 'https://www.mca.com.au', '@mca_australia', -33.8599, 151.2088, 'Sydney', 1991, false, '2026-07-22', 'Wed–Mon 10:00–17:00, closed Tue', '2026-07-21', 'active'),
  ('roslyn-oxley9-gallery', 'Roslyn Oxley9 Gallery', 'gallery', null, null, null, '8 Soudan Lane, Paddington NSW 2021', 'Paddington', 'https://www.roslynoxley9.com.au', '@roslynoxley9', null, null, 'Sydney', null, null, null, 'Tue–Fri 10:00–18:00, Sat 11:00–18:00', '2026-07-21', 'active'),
  ('cassandra-bird', 'Cassandra Bird', 'gallery', null, null, null, '54 Kellett Street, Potts Point NSW 2011', 'Potts Point', 'https://www.cassandrabird.com/', '@cassandrabird.gallery', null, null, 'Sydney', null, null, null, 'Tue–Fri 10:00–17:00, Sat 11:00–17:00', '2026-07-21', 'active'),
  ('1301sw', '1301SW', 'gallery', null, null, null, '3 Hiles Street, Alexandria NSW 2015', 'Alexandria', 'https://www.1301sw.com/', '@1301sw_au', null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('ames-yavuz', 'Ames Yavuz', 'gallery', null, null, null, '114 Commonwealth Street, Surry Hills NSW 2010', 'Surry Hills', 'https://amesyavuz.com/', '@amesyavuz', null, null, 'Sydney', null, null, null, 'Tue–Sat 10:00–18:00', '2026-07-21', 'active'),
  ('olsen-annexe', 'OLSEN Annexe', 'gallery', null, null, null, '74 Queen Street, Woollahra NSW 2025', 'Woollahra', 'https://www.olsengallery.com/', '@olsen_annexe', null, null, 'Sydney', null, null, null, 'Tue–Fri 10:00–18:00, Sat 10:00–17:00', '2026-07-21', 'active'),
  ('grace-cossington-smith-gallery', 'Grace Cossington Smith Gallery', 'gallery', null, null, null, 'Gate 7, 1666 Pacific Highway, Wahroonga NSW 2076', 'Wahroonga', null, '@gcsgallery', null, null, 'Sydney', null, null, null, 'Tue–Sat 10:00–17:00 (during exhibitions)', '2026-07-21', 'active'),
  ('articulate-project-space', 'Articulate Project Space', 'ari', null, null, null, '497 Parramatta Road, Leichhardt NSW', 'Leichhardt', 'https://www.articulateprojectspace.org', '@articulateprojectspace', -33.8776, 151.1552, 'Sydney', null, null, null, null, null, 'active'),
  ('boomalli', 'Boomalli Aboriginal Artists Co-operative', 'ari', null, null, null, '55–59 Flood Street, Leichhardt NSW', 'Leichhardt', 'https://boomalli.com.au', '@boomalli_aboriginal_art', -33.8858, 151.1504, 'Sydney', null, null, null, null, null, 'active'),
  ('firstdraft', 'Firstdraft', 'ari', null, null, null, '13–17 Riley Street, Woolloomooloo NSW', 'Woolloomooloo', 'https://firstdraft.org.au', '@firstdraft_', -33.8725, 151.2155, 'Sydney', null, null, null, 'Wed 11:00–20:00, Thu–Sat 11:00–17:00', '2026-07-21', 'active'),
  ('frontyard-projects', 'Frontyard Projects', 'ari', null, null, null, '228 Illawarra Road, Marrickville NSW', 'Marrickville', 'https://www.frontyardprojects.org', '@frontyardorg', -33.9107, 151.1549, 'Sydney', null, null, null, null, null, 'active'),
  ('pari', 'Pari', 'ari', null, null, null, 'Shop 7, 14 Hunter Street, Parramatta NSW', 'Parramatta', 'https://pariari.org', '@pari_ari_', -33.813, 150.9987, 'Sydney', null, null, null, null, null, 'active'),
  ('scratch-art-space', 'Scratch Art Space', 'ari', null, null, null, '67 Sydenham Road, Marrickville NSW', 'Marrickville', 'https://www.scratchartspace.com', '@scratchartspace', -33.9065, 151.1614, 'Sydney', null, null, null, null, null, 'active'),
  ('tortuga-studios', 'Tortuga Studios', 'ari', null, null, null, '31 Princes Highway, St Peters NSW', 'St Peters', 'https://tortugastudios.org.au', '@tortuga.studios', -33.91, 151.1808, 'Sydney', null, null, null, null, null, 'active'),
  ('4a-centre', '4A Centre for Contemporary Asian Art', 'gallery', null, null, null, '181–187 Hay Street, Haymarket NSW', 'Haymarket', 'https://4a.com.au', '@4a_aus', -33.879, 151.2037, 'Sydney', 1996, true, '2026-07-22', null, null, 'active'),
  ('arthouse-gallery', 'Arthouse Gallery', 'gallery', null, null, null, '66 McLachlan Avenue, Rushcutters Bay NSW', 'Rushcutters Bay', 'https://arthousegallery.com.au', '@arthousegallery', -33.8781, 151.2236, 'Sydney', null, null, null, null, null, 'active'),
  ('artspace', 'Artspace', 'gallery', null, null, null, '43–51 Cowper Wharf Roadway (The Gunnery), Woolloomooloo NSW', 'Woolloomooloo', 'https://www.artspace.org.au', '@artspacesydney', -33.8696, 151.2205, 'Sydney', 1983, true, '2026-07-22', 'Tue–Sun 11:00–17:00', '2026-07-21', 'active'),
  ('australian-galleries-sydney', 'Australian Galleries', 'gallery', null, null, null, '15 Roylston Street, Paddington NSW', 'Paddington', 'https://australiangalleries.com.au', '@australiangalleries', -33.881, 151.2246, 'Sydney', null, null, null, null, null, 'active'),
  ('bankstown-arts-centre', 'Bankstown Arts Centre', 'gallery', null, null, null, '5 Olympic Parade, Bankstown NSW', 'Bankstown', 'https://www.bankstownartscentre.com.au', '@bankstownartscentre', -33.9185, 151.0342, 'Sydney', null, null, null, null, null, 'active'),
  ('coma-gallery', 'COMA Gallery', 'gallery', null, null, null, '37 Chapel Street, Marrickville NSW', 'Marrickville', 'https://www.comagallery.com', '@comagallery', -33.9078, 151.164, 'Sydney', null, null, null, null, null, 'active'),
  ('campbelltown-arts-centre', 'Campbelltown Arts Centre', 'gallery', null, null, null, '1 Art Gallery Road, Campbelltown NSW', 'Campbelltown', 'https://c-a-c.com.au', '@campbelltownartscentre', -34.0728, 150.809, 'Sydney', null, null, null, 'Daily 10:00–16:00', '2026-07-21', 'active'),
  ('carriageworks', 'Carriageworks', 'gallery', null, null, null, '245 Wilson Street, Eveleigh NSW', 'Eveleigh', 'https://carriageworks.com.au', '@carriageworks', -33.8946, 151.1935, 'Sydney', 2007, true, '2026-07-22', null, null, 'active'),
  ('chalk-horse', 'Chalk Horse', 'gallery', null, null, null, '167 William Street (lower ground), Darlinghurst NSW', 'Darlinghurst', 'https://www.chalkhorse.com.au', '@chalkhorsegallery', -33.875, 151.2189, 'Sydney', null, null, null, null, null, 'active'),
  ('china-heights', 'China Heights Gallery', 'gallery', null, null, null, 'Level 3, 16–28 Foster Street, Surry Hills NSW', 'Surry Hills', 'https://chinaheights.com', '@chinaheights', -33.8797, 151.2103, 'Sydney', null, null, null, null, null, 'active'),
  ('darren-knight-gallery', 'Darren Knight Gallery', 'gallery', null, null, null, '840 Elizabeth Street, Waterloo NSW', 'Waterloo', 'https://darrenknightgallery.com', '@darrenknightgallery', -33.907, 151.2072, 'Sydney', null, null, null, null, null, 'active'),
  ('dominik-mersch-gallery', 'Dominik Mersch Gallery', 'gallery', null, null, null, '1/75 McLachlan Avenue, Rushcutters Bay NSW', 'Rushcutters Bay', 'https://dominikmerschgallery.com', '@dominikmerschgallery', -33.8783, 151.2238, 'Sydney', null, null, null, null, null, 'active'),
  ('fine-arts-sydney', 'Fine Arts, Sydney', 'gallery', null, null, null, '23 Hampden Street, Paddington NSW', 'Paddington', 'https://www.finearts.sydney', '@fineartssydney', -33.8828, 151.2211, 'Sydney', null, null, null, null, null, 'active'),
  ('gallery-lane-cove', 'Gallery Lane Cove', 'gallery', null, null, null, 'Level 3, 164 Longueville Road, Lane Cove NSW', 'Lane Cove', 'https://www.gallerylanecove.com.au', '@gallerylanecove', -33.816, 151.1697, 'Sydney', null, null, null, null, null, 'active'),
  ('granville-centre-art-gallery', 'Granville Centre Art Gallery', 'gallery', null, null, null, '1 Memorial Drive, Granville NSW', 'Granville', 'https://www.cumberland.nsw.gov.au/granville-centre-art-gallery', '@granvillecentreartgallery', -33.831, 151.014, 'Sydney', null, null, null, null, null, 'active'),
  ('hazelhurst-arts-centre', 'Hazelhurst Arts Centre', 'gallery', null, null, null, '782 Kingsway, Gymea NSW', 'Gymea', 'https://hazelhurst.sutherlandshire.nsw.gov.au', '@hazelhurstartscentre', -34.0329, 151.0874, 'Sydney', null, null, null, null, null, 'active'),
  ('king-street-gallery', 'King Street Gallery on William', 'gallery', null, null, null, '177 William Street, Darlinghurst NSW', 'Darlinghurst', 'https://kingstreetgallery.com.au', '@kingstreetgallery', -33.8747, 151.2184, 'Sydney', null, null, null, 'Tue–Sat 10:00–18:00', '2026-07-21', 'active'),
  ('liverpool-powerhouse', 'Casula Powerhouse Arts Centre', 'gallery', null, null, null, '1 Powerhouse Road, Casula NSW', 'Casula', 'https://www.liverpoolpowerhouse.com.au', '@liverpoolpowerhouse', -33.9493, 150.9129, 'Sydney', null, null, null, null, null, 'active'),
  ('manly-art-gallery-museum', 'Manly Art Gallery & Museum', 'gallery', null, null, null, '1a West Esplanade, Manly NSW', 'Manly', 'https://www.northernbeaches.nsw.gov.au/things-to-do/arts-and-culture/manly-art-gallery-museum', '@magamnsw', -33.7986, 151.2814, 'Sydney', null, null, null, 'Tue–Sun 10:00–17:00', '2026-07-21', 'active'),
  ('martin-browne-contemporary', 'Martin Browne Contemporary', 'gallery', null, null, null, '15 Hampden Street, Paddington NSW', 'Paddington', 'https://martinbrownecontemporary.com', '@martinbrownecontemporary', -33.8825, 151.2338, 'Sydney', null, null, null, null, null, 'active'),
  ('michael-reid-sydney', 'Michael Reid Sydney', 'gallery', null, null, null, '109 Shepherd Street, Chippendale NSW', 'Chippendale', 'https://michaelreid.com.au', '@michaelreidsydney', -33.8877, 151.1951, 'Sydney', null, null, null, null, null, 'active'),
  ('mosman-art-gallery', 'Mosman Art Gallery', 'gallery', null, null, null, '1 Art Gallery Way, Mosman NSW', 'Mosman', 'https://mosmanartgallery.org.au', '@mosmanart', -33.8279, 151.2406, 'Sydney', null, null, null, 'Daily 10:00–17:00', '2026-07-21', 'active'),
  ('n-smith-gallery', 'N.Smith Gallery', 'gallery', null, null, null, '15 Foster Street, Surry Hills NSW', 'Surry Hills', 'https://www.nsmithgallery.com', '@n.smithgallery', -33.88, 151.2097, 'Sydney', null, null, null, null, null, 'active'),
  ('nanda-hobbs', 'Nanda\Hobbs', 'gallery', null, null, null, '12–14 Meagher Street, Chippendale NSW', 'Chippendale', 'https://nandahobbs.com', '@nandahobbs', -33.8867, 151.1986, 'Sydney', null, null, null, null, null, 'active'),
  ('nas-gallery', 'National Art School Gallery', 'gallery', null, null, null, '156 Forbes Street, Darlinghurst NSW', 'Darlinghurst', 'https://nas.edu.au', '@nas_au', -33.8788, 151.2172, 'Sydney', null, null, null, null, null, 'active'),
  ('olsen-gallery', 'Olsen Gallery', 'gallery', null, null, null, '63 Jersey Road, Woollahra NSW', 'Woollahra', 'https://www.olsengallery.com', '@olsen_gallery', -33.8875, 151.2337, 'Sydney', null, null, null, null, null, 'active'),
  ('penrith-regional-gallery', 'Penrith Regional Gallery', 'gallery', null, null, null, '86 River Road, Emu Plains NSW', 'Emu Plains', 'https://www.penrithregionalgallery.com.au', '@penrithregionalgallery', -33.7458, 150.6669, 'Sydney', null, null, null, null, null, 'active'),
  ('phoenix-central-park', 'Phoenix Central Park', 'gallery', null, null, null, '37–49 O''Connor Street, Chippendale NSW', 'Chippendale', 'https://phoenixcentralpark.com.au', '@phoenixcentralpark', -33.8865, 151.199, 'Sydney', null, null, null, null, null, 'active'),
  ('sh-ervin-gallery', 'S.H. Ervin Gallery', 'gallery', null, null, null, 'Watson Road, Observatory Hill, Millers Point NSW', 'Millers Point', 'https://www.shervingallery.com.au', '@shervingallery', -33.8599, 151.2049, 'Sydney', null, null, null, 'Tue–Sun 11:00–17:00', '2026-07-21', 'active'),
  ('station-sydney', 'STATION Sydney', 'gallery', null, null, null, '91 Campbell Street, Surry Hills NSW', 'Surry Hills', 'https://stationgallery.com', '@stationgalleryaustralia', -33.8796, 151.2102, 'Sydney', null, null, null, null, null, 'active'),
  ('saint-cloche', 'Saint Cloche', 'gallery', null, null, null, '37 MacDonald Street, Paddington NSW', 'Paddington', 'https://saintcloche.com', '@saint_cloche', -33.8824, 151.2231, 'Sydney', null, null, null, null, null, 'active'),
  ('sullivan-strumpf', 'Sullivan+Strumpf', 'gallery', null, null, null, '799 Elizabeth Street, Zetland NSW', 'Zetland', 'https://www.sullivanstrumpf.com', '@sullivanstrumpf', -33.9065, 151.2067, 'Sydney', null, null, null, null, null, 'active'),
  ('unsw-galleries', 'UNSW Galleries', 'gallery', null, null, null, 'Cnr Oxford Street & Greens Road, Paddington NSW', 'Paddington', 'https://www.galleries.unsw.edu.au', '@unswgalleries', -33.8845, 151.2223, 'Sydney', null, null, null, null, null, 'active'),
  ('uts-gallery', 'UTS Gallery', 'gallery', null, null, null, 'Level 4, Building 6, 702 Harris Street, Ultimo NSW', 'Ultimo', 'https://art.uts.edu.au', '@uts_art', -33.8805, 151.2, 'Sydney', null, null, null, null, null, 'active'),
  ('utopia-art-sydney', 'Utopia Art Sydney', 'gallery', null, null, null, '983 Bourke Street, Waterloo NSW', 'Waterloo', 'https://utopiaartsydney.com.au', '@utopiaartsydney', -33.9, 151.2106, 'Sydney', null, null, null, null, null, 'active'),
  ('verge-gallery', 'Verge Gallery', 'gallery', null, null, null, 'Jane Foss Russell Plaza, 154 City Road, Darlington NSW', 'Darlington', 'https://www.verge-gallery.net', '@vergegallery', -33.8888, 151.1866, 'Sydney', null, null, null, null, null, 'active'),
  ('australian-museum', 'Australian Museum', 'museum', null, null, null, '1 William Street, Sydney NSW', 'Sydney', 'https://australian.museum', '@australianmuseum', -33.8712, 151.2133, 'Sydney', 1827, true, '2026-07-22', null, null, 'active'),
  ('chau-chak-wing-museum', 'Chau Chak Wing Museum', 'museum', null, null, null, 'University Place, University of Sydney, Camperdown NSW', 'Camperdown', 'https://www.sydney.edu.au/museum/', '@ccwm_sydney', -33.8853, 151.1905, 'Sydney', 2020, true, '2026-07-22', 'Mon–Fri 10:00–17:00, Sat–Sun 12:00–16:00', '2026-07-21', 'active'),
  ('fairfield-city-museum-gallery', 'Fairfield City Museum & Gallery', 'museum', null, null, null, '634 The Horsley Drive, Smithfield NSW', 'Smithfield', 'https://www.fcmg.nsw.gov.au', '@fairfieldcitymuseumgallery', -33.8481, 150.9427, 'Sydney', null, null, null, null, null, 'active'),
  ('museum-of-sydney', 'Museum of Sydney', 'museum', null, null, null, 'Cnr Phillip & Bridge Streets, Sydney NSW', 'Sydney', 'https://mhnsw.au/visit-us/museum-of-sydney/', '@museumsofhistorynsw', -33.8636, 151.2114, 'Sydney', null, true, '2026-07-22', null, null, 'active'),
  ('powerhouse-parramatta', 'Powerhouse Parramatta', 'museum', null, null, null, '34 Phillip Street, Parramatta NSW', 'Parramatta', 'https://powerhouse.com.au/visit/parramatta', '@powerhousemuseum', -33.81, 151.0044, 'Sydney', null, null, null, null, null, 'active'),
  ('sydney-jewish-museum', 'Sydney Jewish Museum', 'museum', null, null, null, '148 Darlinghurst Road, Darlinghurst NSW', 'Darlinghurst', 'https://sydneyjewishmuseum.com.au', '@sydneyjewishmuseum', -33.879, 151.2203, 'Sydney', 1992, false, '2026-07-22', null, null, 'active'),
  ('white-rabbit-gallery', 'White Rabbit Gallery', 'museum', null, null, null, '30 Balfour Street, Chippendale NSW', 'Chippendale', 'https://whiterabbitcollection.org', '@whiterabbitgallery', -33.8865, 151.2003, 'Sydney', null, null, null, 'Wed–Sun 10:00–17:00', '2026-07-21', 'active'),
  ('cement-fondu', 'Cement Fondu', 'gallery', null, null, null, '36 Gosbell Street, Paddington NSW', 'Paddington', 'https://cementfondu.org', '@cementfondu', -33.8776, 151.2222, 'Sydney', null, null, null, null, null, 'archived'),
  ('vermilion-art', 'Vermilion Art', 'gallery', null, null, null, '16 Hickson Road, Walsh Bay NSW', 'Walsh Bay', 'https://www.vermilionart.com.au', null, -33.8563, 151.2044, 'Sydney', null, null, null, null, null, 'active'),
  ('107-projects', '107 Projects', 'ari', null, null, null, '107 Redfern Street, Redfern NSW', 'Redfern', 'https://107.org.au', '@107projects', -33.8925, 151.2044, 'Sydney', null, null, null, null, null, 'active'),
  ('australian-design-centre', 'Australian Design Centre', 'gallery', null, null, null, '101–115 William Street, Darlinghurst NSW', 'Darlinghurst', 'https://australiandesigncentre.com', '@austdesigncentre', -33.8755, 151.2166, 'Sydney', null, null, null, null, null, 'pending'),
  ('galerie-pompom', 'Galerie pompom', 'gallery', null, null, null, '2/39 Abercrombie Street, Chippendale NSW', 'Chippendale', 'https://galeriepompom.com', '@galeriepompom', -33.8877, 151.1984, 'Sydney', null, null, null, null, null, 'archived'),
  ('artereal-gallery', 'Artereal Gallery', 'gallery', null, null, null, '747 Darling Street, Rozelle NSW', 'Rozelle', 'https://artereal.com.au', '@arterealgallery', -33.8614, 151.171, 'Sydney', null, null, null, null, null, 'active'),
  ('defiance-gallery', 'Defiance Gallery', 'gallery', null, null, null, '47 Enmore Road, Newtown NSW', 'Newtown', 'https://www.defiancegallery.com', '@defiancegallery', -33.899, 151.177, 'Sydney', null, null, null, null, null, 'active'),
  ('gallery-9', 'Gallery 9', 'gallery', null, null, null, '9 Darley Street, Darlinghurst NSW', 'Darlinghurst', 'https://www.gallery9.com.au', null, -33.883, 151.217, 'Sydney', null, null, null, null, null, 'active'),
  ('incinerator-art-space', 'Incinerator Art Space', 'gallery', null, null, null, '2 Small Street, Willoughby NSW', 'Willoughby', 'https://www.willoughby.nsw.gov.au/community/community-spaces/incinerator-art-space', null, -33.803, 151.19, 'Sydney', null, null, null, null, null, 'pending'),
  ('delmar-gallery', 'Delmar Gallery', 'gallery', null, null, null, '144 Victoria Street, Ashfield NSW', 'Ashfield', 'https://www.trinity.nsw.edu.au/community/delmar-gallery/', '@delmargallery', -33.883, 151.125, 'Sydney', null, null, null, null, null, 'active'),
  ('woollahra-gallery-at-redleaf', 'Woollahra Gallery at Redleaf', 'gallery', null, null, null, '548 New South Head Road, Double Bay NSW', 'Double Bay', 'https://www.woollahra.nsw.gov.au/woollahragallery', '@woollahragallery', -33.877, 151.245, 'Sydney', null, null, null, null, null, 'active'),
  ('16albermarle', '16albermarle Project Space', 'gallery', null, null, null, '16 Albermarle Street, Newtown NSW', 'Newtown', 'https://www.16albermarle.com', '@16albermarleprojectspace', -33.898, 151.181, 'Sydney', null, null, null, null, null, 'active'),
  ('hyde-park-barracks', 'Hyde Park Barracks', 'museum', 'institution', '1', 'UNESCO-listed convict barracks on Macquarie Street.', null, 'Sydney', 'https://mhnsw.au', '@museumsofhistorynsw', -33.8712, 151.2124, 'Sydney', null, true, '2026-07-22', null, null, 'active'),
  ('justice-police-museum', 'Justice & Police Museum', 'museum', 'institution', '1', 'Forensic photography and crime history in the old water police court - weekends only.', null, 'Sydney', 'https://mhnsw.au', '@museumsofhistorynsw', -33.8623, 151.2119, 'Sydney', null, null, null, null, null, 'active'),
  ('state-library-of-nsw-galleries', 'State Library of NSW Galleries', 'museum', 'institution', '1', 'Underrated free exhibitions from the state collection.', null, 'Sydney', 'https://www.sl.nsw.gov.au', '@statelibrarynsw', -33.8668, 151.213, 'Sydney', null, null, null, null, null, 'active'),
  ('brett-whiteley-studio', 'Brett Whiteley Studio', 'museum', 'institution', '1', 'Whiteley''s studio kept as he left it, run by the Art Gallery of NSW.', null, 'Surry Hills', 'https://www.brettwhiteley.org/', '@brettwhiteleystudio', -33.8845, 151.2153, 'Sydney', null, null, null, null, null, 'active'),
  ('australian-national-maritime-museum', 'Australian National Maritime Museum', 'museum', 'institution', '1', 'Wildlife Photographer of the Year among the masts.', null, 'Darling Harbour', 'https://www.sea.museum', '@sea.museum', -33.869, 151.1985, 'Sydney', 1991, true, '2026-07-22', null, null, 'active'),
  ('customs-house', 'Customs House', 'gallery', 'institution', '1', 'Free City of Sydney exhibitions opposite Circular Quay.', null, 'Sydney', 'https://www.sydneycustomshouse.com.au/', null, -33.8623, 151.2107, 'Sydney', null, null, null, null, null, 'active'),
  ('rose-seidler-house', 'Rose Seidler House', 'museum', 'institution', '1b', 'Harry Seidler''s mid-century masterpiece; home of the Fifties Fair.', null, 'Wahroonga', 'https://mhnsw.au', '@museumsofhistorynsw', -33.7275, 151.1092, 'Sydney', null, null, null, null, null, 'active'),
  ('vaucluse-house', 'Vaucluse House', 'museum', 'institution', '1b', 'Colonial estate with intact interiors and gardens.', null, 'Vaucluse', 'https://mhnsw.au', '@estatevauclusehouse', -33.8554, 151.278, 'Sydney', null, null, null, null, null, 'active'),
  ('elizabeth-bay-house', 'Elizabeth Bay House', 'museum', 'institution', '1b', '''The finest house in the colony'' - an architecture icon.', null, 'Elizabeth Bay', 'https://mhnsw.au', '@museumsofhistorynsw', -33.8702, 151.2262, 'Sydney', null, null, null, null, null, 'active'),
  ('old-government-house', 'Old Government House', 'museum', 'institution', '1b', 'Australia''s oldest public building, in Parramatta Park.', null, 'Parramatta', 'https://www.nationaltrust.org.au/places/old-government-house/', null, -33.811, 150.999, 'Sydney', null, null, null, null, null, 'active'),
  ('nutcote-may-gibbs-house', 'Nutcote (May Gibbs'' House)', 'museum', 'institution', '1b', 'The illustrator of the gumnut babies, at home.', null, 'Neutral Bay', null, null, -33.839, 151.222, 'Sydney', null, null, null, null, null, 'active'),
  ('macquarie-university-art-gallery', 'Macquarie University Art Gallery', 'gallery', 'public', '2', 'University collection and program on the north side.', null, 'Macquarie Park', 'https://www.mq.edu.au/about/facilities/museums-collections/macquarie-university-art-gallery', null, -33.777, 151.113, 'Sydney', null, null, null, null, null, 'active'),
  ('margaret-whitlam-galleries', 'Margaret Whitlam Galleries', 'gallery', 'public', '2', 'Western Sydney University galleries in the Female Orphan School.', null, 'Parramatta', 'https://www.whitlam.org/mwg', null, -33.818, 151.023, 'Sydney', null, null, null, null, null, 'active'),
  ('the-cross-art-projects', 'The Cross Art Projects', 'gallery', 'public', '2', 'Small curatorial non-profit with a political edge.', null, 'Kings Cross', 'https://www.crossart.com.au/', '@thecrossartprojects', -33.874, 151.2225, 'Sydney', null, null, null, null, null, 'active'),
  ('bondi-pavilion-gallery', 'Bondi Pavilion Gallery', 'gallery', 'public', '2', 'Waverley Council''s gallery in the restored beachfront pavilion.', null, 'Bondi Beach', 'https://www.bondipavilion.com.au/discover/creative_spaces/art_gallery', '@bondipavilionofficial', -33.891, 151.276, 'Sydney', null, null, null, null, null, 'active'),
  ('art-space-on-the-concourse', 'Art Space on The Concourse', 'gallery', 'public', '2', 'Willoughby Council''s exhibition space on the North Shore.', null, 'Chatswood', 'https://www.willoughby.nsw.gov.au/Council/Venues/Art-Space-Gallery-The-Concourse', null, -33.796, 151.183, 'Sydney', null, null, null, null, null, 'active'),
  ('juniper-hall', 'Juniper Hall', 'gallery', 'public', '2', 'Georgian landmark, home of the Moran Prizes.', null, 'Paddington', 'https://moranarts.org.au/galleries/', null, -33.884, 151.227, 'Sydney', null, null, null, null, null, 'active'),
  ('artbank', 'Artbank', 'gallery', 'public', '2', 'The government''s lending collection - occasional public program.', null, 'Waterloo', 'https://www.artbank.gov.au/', '@artbankau', -33.9, 151.207, 'Sydney', null, null, null, null, null, 'active'),
  ('blacktown-arts', 'Blacktown Arts', 'gallery', 'public', '2b', 'First Nations and Western Sydney focus in the Leo Kelly Centre.', null, 'Blacktown', null, null, -33.771, 150.906, 'Sydney', null, null, null, null, null, 'archived'),
  ('parramatta-artists-studios', 'Parramatta Artists'' Studios', 'ari', 'public', '2b', 'Council studios with open-studio nights.', null, 'Parramatta', null, null, -33.815, 151.005, 'Sydney', null, null, null, null, null, 'active'),
  ('hawkesbury-regional-gallery', 'Hawkesbury Regional Gallery', 'gallery', 'public', '2b', 'Regional gallery on Sydney''s north-west edge.', null, 'Windsor', 'https://www.hawkesbury.nsw.gov.au/gallery', '@hawkesburyregional_gallery', -33.613, 150.814, 'Sydney', null, null, null, null, null, 'active'),
  ('hurstville-museum-gallery', 'Hurstville Museum & Gallery', 'museum', 'public', '2b', 'Georges River Council museum and gallery.', null, 'Hurstville', 'https://www.georgesriver.nsw.gov.au/Community/Art-and-Culture/Hurstville-Museum-Gallery', '@hurstvillemuseumgallery', -33.967, 151.103, 'Sydney', null, null, null, null, null, 'active'),
  ('peacock-gallery', 'Peacock Gallery', 'gallery', 'public', '2b', 'Small gallery in the Auburn Botanic Gardens.', null, 'Auburn', 'https://www.cumberland.nsw.gov.au/peacock-gallery', null, -33.853, 151.028, 'Sydney', null, null, null, null, null, 'active'),
  ('museums-discovery-centre', 'Museums Discovery Centre', 'museum', 'public', '2b', 'The Powerhouse''s open store - tours through the collection.', null, 'Castle Hill', 'https://powerhouse.com.au/visit/castle-hill', null, -33.732, 150.98, 'Sydney', null, null, null, null, null, 'active'),
  ('sarah-cottier-gallery', 'Sarah Cottier Gallery', 'gallery', 'commercial', '3', 'Minimal and conceptual since the nineties.', null, 'Paddington', null, null, -33.884, 151.226, 'Sydney', null, null, null, null, null, 'archived'),
  ('the-commercial', 'The Commercial', 'gallery', 'commercial', '3', 'Sharp conceptual program with a devoted following.', null, 'Marrickville', 'https://www.thecommercialgallery.com/', null, -33.911, 151.155, 'Sydney', null, null, null, null, null, 'active'),
  ('wagner-contemporary', 'Wagner Contemporary', 'gallery', 'commercial', '3', 'Approachable contemporary painting on Oxford Street.', null, 'Paddington', 'https://wagnercontemporary.com.au/', '@wagnercontemporary', -33.885, 151.227, 'Sydney', null, null, null, null, null, 'active'),
  ('piermarq', 'Piermarq', 'gallery', 'commercial', '3', 'International program pitched at a younger crowd.', 'Ground Floor, 23 Foster Street, Surry Hills NSW', 'Surry Hills', 'https://www.piermarq.com.au/', '@piermarqart', null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('gallery-sally-dan-cuthbert', 'Gallery Sally Dan-Cuthbert', 'gallery', 'commercial', '3', 'Art crossed with collectible design.', null, 'Rushcutters Bay', 'https://gallerysallydancuthbert.com/', '@gallerysallydancuthbert', -33.875, 151.225, 'Sydney', null, null, null, null, null, 'active'),
  ('annette-larkin-fine-art', 'Annette Larkin Fine Art', 'gallery', 'commercial', '3', 'Secondary-market specialist.', null, 'Darlinghurst', 'https://annettelarkin.com/', '@annettelarkinfineart', -33.879, 151.217, 'Sydney', null, null, null, null, null, 'active'),
  ('maunsell-wickes', 'Maunsell Wickes', 'gallery', 'commercial', '3', 'Long-established rooms on Glenmore Road.', null, 'Paddington', 'https://maunsellwickes.com/', '@maunsellwickesgallery', -33.885, 151.224, 'Sydney', null, null, null, null, null, 'active'),
  ('richard-martin-art', 'Richard Martin Art', 'gallery', 'commercial', '3', 'Modern and contemporary secondary market.', null, 'Woollahra', 'https://www.richardmartinart.com.au/', null, -33.888, 151.24, 'Sydney', null, null, null, null, null, 'active'),
  ('harvey-galleries', 'Harvey Galleries', 'gallery', 'commercial', '3', 'Commercial stalwart with harbourside clientele.', null, 'Mosman', 'https://harveygalleries.com.au/', '@harveygalleries', -33.828, 151.244, 'Sydney', null, null, null, null, null, 'active'),
  ('wentworth-galleries', 'Wentworth Galleries', 'gallery', 'commercial', '3', 'CBD commercial gallery.', null, 'Sydney', null, null, -33.868, 151.211, 'Sydney', null, null, null, null, null, 'active'),
  ('jerico-contemporary', 'Jerico Contemporary', 'gallery', 'commercial', '3b', 'Young and elegant, by the finger wharf.', null, 'Woolloomooloo', 'http://www.jericocontemporary.com/', '@jerico_contemporary', -33.87, 151.22, 'Sydney', null, null, null, null, null, 'active'),
  ('m-contemporary', 'M Contemporary', 'gallery', 'commercial', '3b', 'Strong curation on Ocean Street.', null, 'Woollahra', 'https://mcontemp.com/', '@mcontemporary', -33.885, 151.24, 'Sydney', null, null, null, null, null, 'active'),
  ('stanley-street-gallery', 'Stanley Street Gallery', 'gallery', 'commercial', '3b', 'Contemporary art and studio jewellery.', null, 'Darlinghurst', 'https://stanleystreetgallery.com.au/', '@stanley_street_gallery', -33.878, 151.218, 'Sydney', null, null, null, null, null, 'active'),
  ('curatorial-co', 'Curatorial+Co', 'gallery', 'commercial', '3b', 'Online-first gallery with a physical space.', 'Shop G01/02, 80 William Street, Woolloomooloo NSW', 'Woolloomooloo', 'https://curatorialandco.com', '@curatorialandco', null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('flinders-street-gallery', 'Flinders Street Gallery', 'gallery', 'commercial', '3b', 'Painting-focused program.', null, 'Surry Hills', 'https://www.flindersstreetgallery.com', '@flindersstgallery', -33.886, 151.214, 'Sydney', null, null, null, null, null, 'active'),
  ('black-eye-gallery', 'Black Eye Gallery', 'gallery', 'commercial', '3b', 'Photography specialist.', null, 'Darlinghurst', 'https://blackeyegallery.com.au', '@blackeyegallery', -33.879, 151.218, 'Sydney', null, null, null, null, null, 'active'),
  ('gaffa-gallery', 'Gaffa Gallery', 'gallery', 'commercial', '3b', 'Craft and photography across two floors.', null, 'Sydney', 'https://www.gaffa.com.au', '@gaffagallery', -33.876, 151.207, 'Sydney', null, null, null, null, null, 'active'),
  ('sabbia-gallery', 'Sabbia Gallery', 'gallery', 'commercial', '3b', 'Glass and ceramics at the highest level.', null, 'Redfern', 'https://sabbiagallery.com', '@sabbiagallery', -33.893, 151.205, 'Sydney', null, null, null, null, null, 'active'),
  ('ambush-gallery', 'Ambush Gallery', 'gallery', 'commercial', '3b', 'Street-leaning contemporary at Central Park.', 'Level 3, Central Park, 28 Broadway, Chippendale NSW', 'Chippendale', 'https://ambushgallery.com', '@ambushgallery', -33.887, 151.2, 'Sydney', null, null, null, null, null, 'active'),
  ('traffic-jam-galleries', 'Traffic Jam Galleries', 'gallery', 'commercial', '3b', 'Lower North Shore contemporary.', null, 'Neutral Bay', 'https://trafficjamgalleries.com', '@trafficjamgalleries', -33.832, 151.218, 'Sydney', null, null, null, null, null, 'active'),
  ('art2muse', 'Art2Muse', 'gallery', 'commercial', '3b', 'Eastern-suburbs contemporary.', null, 'Double Bay', 'https://art2muse.com.au', '@art2muse', -33.877, 151.243, 'Sydney', null, null, null, null, null, 'active'),
  ('studio-gallery', 'Studio Gallery', 'gallery', 'commercial', '3b', 'Melbourne group with a Sydney room.', null, 'Waterloo', null, '@studiogallerygroup', -33.9, 151.206, 'Sydney', null, null, null, null, null, 'active'),
  ('badger-fox-gallery', 'Badger & Fox Gallery', 'gallery', 'commercial', '3b', 'Contemporary rooms off Crown Street.', null, 'Surry Hills', 'https://badgerandfoxgallery.com', '@badfox201', -33.886, 151.212, 'Sydney', null, null, null, null, null, 'active'),
  ('goodspace', 'Goodspace', 'gallery', 'commercial', '3b', 'Young, fast-moving program.', null, 'Chippendale', null, '@goodspacegallery', -33.887, 151.199, 'Sydney', null, null, null, null, null, 'active'),
  ('sno-contemporary-art-projects', 'SNO Contemporary Art Projects', 'ari', 'ari', '4', 'Non-objective art, uncompromising.', 'Level 2, 30–40 Harcourt Parade, Rosebery NSW', 'Rosebery', 'http://www.sno.org.au', null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('knulp', 'Knulp', 'ari', 'ari', '4', 'Tiny, deeply insider artist-run space.', null, 'Sydney', 'http://www.knulps.org', '@knulpknulpknulp', -33.89, 151.19, 'Sydney', null, null, null, null, null, 'active'),
  ('harrington-street-gallery', 'Harrington Street Gallery', 'ari', 'ari', '4', 'Sydney''s oldest artists'' co-operative.', null, 'Chippendale', 'http://www.harringtonstreetgallery.com', '@theharringtonstreetartscentre', -33.887, 151.198, 'Sydney', null, null, null, null, null, 'active'),
  ('art-leven', 'Art Leven', 'gallery', 'first_nations', '3', 'The oldest specialist First Nations gallery, formerly Cooee Art.', null, 'Redfern', 'https://www.cooeeart.com.au', '@art.leven', -33.893, 151.204, 'Sydney', null, null, null, null, null, 'active'),
  ('kate-owen-gallery', 'Kate Owen Gallery', 'gallery', 'first_nations', '3', 'Three floors of Aboriginal art.', null, 'Rozelle', 'https://www.kateowengallery.com', '@kateowengallery', -33.861, 151.171, 'Sydney', null, null, null, null, null, 'active'),
  ('aboriginal-contemporary', 'Aboriginal Contemporary', 'gallery', 'first_nations', '3', 'Community-sourced work from the deserts and the Top End.', null, 'Bronte', 'https://www.aboriginalcontemporary.com.au', '@aboriginal.contemporary', -33.905, 151.264, 'Sydney', null, null, null, null, null, 'active'),
  ('gannon-house-gallery', 'Gannon House Gallery', 'gallery', 'first_nations', '3', 'Aboriginal and Australian art in The Rocks.', null, 'The Rocks', 'https://gannonhousegallery.com/', '@gannonhouse', -33.859, 151.209, 'Sydney', null, null, null, null, null, 'active'),
  ('spirit-gallery', 'Spirit Gallery', 'gallery', 'first_nations', '3', 'Accessible First Nations art and objects.', null, 'The Rocks', 'https://www.spiritgallery.com.au/', null, -33.859, 151.209, 'Sydney', null, null, null, null, null, 'active'),
  ('apy-gallery', 'APY Gallery', 'gallery', 'first_nations', '3', 'Artist-owned gallery of the APY Lands studios.', null, 'Darlinghurst', 'https://www.apygallery.com/', null, -33.879, 151.217, 'Sydney', null, null, null, null, null, 'active'),
  ('d-lan-contemporary', 'D''Lan Contemporary', 'gallery', 'first_nations', '3', 'Blue-chip secondary market for First Nations masters.', null, 'Sydney', null, null, -33.87, 151.21, 'Sydney', null, null, null, null, null, 'active'),
  ('wollongong-art-gallery', 'Wollongong Art Gallery', 'gallery', 'day_trip', '2', 'The largest regional gallery south of Sydney.', null, 'Wollongong', 'https://wollongongartgallery.au', '@wollongongartgallery', -34.424, 150.893, 'Sydney', null, null, null, null, null, 'active'),
  ('ngununggula', 'Ngununggula', 'gallery', 'day_trip', '2', 'Southern Highlands regional with a sharp program.', null, 'Bowral', 'https://ngununggula.com', '@ngununggula', -34.478, 150.42, 'Sydney', null, null, null, null, null, 'active'),
  ('bundanon', 'Bundanon', 'museum', 'day_trip', '1', 'Arthur Boyd''s gift - art museum and the Kerstin Thompson bridge in the bush.', null, 'Illaroo', 'https://www.bundanon.com.au', '@bundanontrust', -34.85, 150.51, 'Sydney', null, null, null, null, null, 'active'),
  ('blue-mountains-cultural-centre', 'Blue Mountains Cultural Centre', 'gallery', 'day_trip', '2', 'Regional gallery with an escarpment view.', null, 'Katoomba', 'https://bluemountainsculturalcentre.com.au', '@bluemountainsculturalcentre', -33.712, 150.312, 'Sydney', null, null, null, null, null, 'active'),
  ('newcastle-art-gallery', 'Newcastle Art Gallery', 'gallery', 'day_trip', '2', 'Reopened after a major expansion.', null, 'Newcastle', 'https://newcastleartgallery.nsw.gov.au', '@newcastleartgalleryaustralia', -32.928, 151.771, 'Sydney', null, null, null, null, null, 'active'),
  ('the-lock-up', 'The Lock-Up', 'gallery', 'day_trip', '2', 'Contemporary art in the old police lock-up.', null, 'Newcastle', 'https://thelockup.org.au', '@thelockupartspace', -32.927, 151.779, 'Sydney', null, null, null, null, null, 'active'),
  ('maitland-regional-art-gallery', 'Maitland Regional Art Gallery', 'gallery', 'day_trip', '2', 'Hunter Valley regional with generous programming.', null, 'Maitland', 'https://www.mrag.org.au', '@maitlandregionalartgallery', -32.733, 151.557, 'Sydney', null, null, null, null, null, 'active'),
  ('gosford-regional-gallery', 'Gosford Regional Gallery', 'gallery', 'day_trip', '2', 'Central Coast gallery with the Edogawa garden.', null, 'Gosford', 'https://gosfordregionalgallery.com', '@gosfordregionalgallery', -33.426, 151.342, 'Sydney', null, null, null, null, null, 'active'),
  ('smith-singer', 'Smith & Singer', 'gallery', 'auction', '3', 'Sotheby''s-licensed auction house.', null, 'Sydney', 'https://www.smithandsinger.com.au', '@smith_singer', -33.869, 151.21, 'Sydney', null, null, null, null, null, 'active'),
  ('deutscher-and-hackett', 'Deutscher and Hackett', 'gallery', 'auction', '3', 'Major Australian art auctions.', null, 'Paddington', 'https://www.deutscherandhackett.com', '@deutscherandhackett', -33.884, 151.226, 'Sydney', null, null, null, null, null, 'active'),
  ('menzies', 'Menzies', 'gallery', 'auction', '3', 'Australian and international art auctions.', null, 'Kensington', 'https://www.menziesartbrands.com', '@menziesauctions', -33.92, 151.222, 'Sydney', null, null, null, null, null, 'active'),
  ('shapiro-auctioneers', 'Shapiro Auctioneers', 'gallery', 'auction', '3', 'Art, design and decorative arts.', null, 'Woollahra', 'https://www.shapiro.com.au', '@shapirosydney', -33.888, 151.24, 'Sydney', null, null, null, null, null, 'active'),
  ('bonhams-australia', 'Bonhams Australia', 'gallery', 'auction', '3', 'International house, Australian salerooms.', null, 'Double Bay', 'https://www.bonhams.com/location/SYD/sydney/', '@bonhams1793', -33.877, 151.243, 'Sydney', null, null, null, null, null, 'active'),
  ('leonard-joel-sydney', 'Leonard Joel Sydney', 'gallery', 'auction', '3', 'Auctions across art and objects.', null, 'Woollahra', 'https://www.leonardjoel.com.au', '@leonardjoelauctions', -33.888, 151.24, 'Sydney', null, null, null, null, null, 'active'),
  ('palas', 'PALAS', 'gallery', 'commercial', '2b', 'Ambitious young Zetland gallery working across painting and installation.', '42 Hansard Street, Zetland NSW', 'Zetland', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('michael-reid-northern-beaches', 'Michael Reid Northern Beaches', 'gallery', 'commercial', '3', 'Michael Reid’s beach outpost — Studio Direct and Michael Reid CLAY.', 'Shop 2/358 Barrenjoey Road, Newport NSW', 'Newport', 'https://michaelreidnorthernbeaches.com.au/', '@michaelreidnorthernbeaches', null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('soho-galleries', 'SOHO Galleries', 'gallery', 'commercial', '3b', 'Long-running Woollahra dealer, broad contemporary stable.', '150 Edgecliff Road, Woollahra NSW', 'Woollahra', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('robin-gibson-gallery', 'Robin Gibson Gallery', 'gallery', 'commercial', '3', 'A Darlinghurst fixture since 1977, painting-led.', '278 Liverpool Street, Darlinghurst NSW', 'Darlinghurst', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('stella-downer-fine-art', 'Stella Downer Fine Art', 'gallery', 'commercial', '3b', 'Works on paper and prints, with a long secondary-market list.', '1/24 Wellington Street, Waterloo NSW', 'Waterloo', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('the-renshaws-sydney', 'The Renshaws, Sydney', 'gallery', 'commercial', '3', 'The Brisbane dealer’s Sydney room in Alexandria.', '111–117 McEvoy Street, Alexandria NSW', 'Alexandria', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('airspace-projects', 'AIRspace Projects', 'ari', 'ari', '2b', 'Artist-run, board-led; a new show on the first Friday of every month.', '10 Junction Street, Marrickville NSW', 'Marrickville', 'https://www.airspaceprojects.com.au', '@airspaceprojects', null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('chrissie-cotter-gallery', 'Chrissie Cotter Gallery', 'gallery', 'public', '3', 'Inner West Council’s Camperdown space — thirty years of artist-proposed shows in 2026.', '31A Pidcock Street, Camperdown NSW', 'Camperdown', 'https://www.innerwest.nsw.gov.au/exhibitions-and-public-art/chrissie-cotter-gallery', null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('barometer', 'Barometer', 'ari', 'ari', '3b', 'Artist-run room with an eye for fibre, textile and photography.', '13 Gurner Street, Paddington NSW', 'Paddington', 'https://barometer.net.au/', null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('ken-done-gallery', 'Ken Done Gallery', 'gallery', 'commercial', '3b', 'The harbour painter’s own gallery, open daily on Hickson Road.', '1 Hickson Road, The Rocks NSW', 'The Rocks', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('cbd-gallery', 'CBD Gallery', 'gallery', 'commercial', '3b', 'Small CBD room showing emerging painters.', '72 Erskine Street, Sydney NSW', 'Sydney', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('gallery-371', 'Gallery 371', 'gallery', 'commercial', '3b', 'Enmore Road shopfront gallery.', '371 Enmore Road, Marrickville NSW', 'Marrickville', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('laila', 'LAILA', 'gallery', 'commercial', '3', 'Marrickville warehouse space for contemporary practice.', 'Level 1, 158 Edinburgh Road, Marrickville NSW', 'Marrickville', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('syrup', 'Syrup', 'ari', 'ari', '3b', 'Small independent Marrickville project space.', '20 Farr Street, Marrickville NSW', 'Marrickville', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('upspace-gallery', 'UPSpace Gallery + Studio', 'ari', 'ari', '3b', 'Studio and gallery in the Addison Road community centre.', 'Building 24, 142 Addison Road, Marrickville NSW', 'Marrickville', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('gallery-lnl', 'Gallery LNL', 'gallery', 'commercial', '3b', 'King Street gallery at the Newtown end.', '49–51 King Street, Newtown NSW', 'Newtown', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('studio-551', 'Studio 551', 'gallery', 'commercial', '4', 'Small Newtown studio gallery.', '551 King Street, Newtown NSW', 'Newtown', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('art-moment-gallery', 'Art Moment Gallery', 'gallery', 'commercial', '4', 'Bondi Beach shopfront gallery.', '99 Curlewis Street, Bondi Beach NSW', 'Bondi Beach', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('revolve-gallery', 'Revolve Gallery & Studios', 'ari', 'ari', '3b', 'Studios and a gallery in a Little Eveleigh Street terrace.', '138 Little Eveleigh Street, Redfern NSW', 'Redfern', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('scieppan-gallery', 'Scieppan Gallery', 'gallery', 'commercial', '4', 'Darlinghurst shopfront.', 'Shop 2/1 Francis Street, Darlinghurst NSW', 'Darlinghurst', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('freeman-gallery', 'Freeman Gallery', 'gallery', 'commercial', '3b', 'Macleay Street gallery in Potts Point.', '03/46a Macleay Street, Potts Point NSW', 'Potts Point', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('numbers', 'Numbers', 'gallery', 'commercial', '3', 'Kellett Street room, a few doors from Cassandra Bird.', '8 Kellett Street, Potts Point NSW', 'Potts Point', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('the-garden-gallery', 'The Garden Gallery', 'gallery', 'public', '3b', 'Exhibition room inside the Royal Botanic Garden.', 'Royal Botanic Garden, Mrs Macquaries Road, Sydney NSW', 'Sydney', null, null, null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('powerhouse-castle-hill', 'Powerhouse Castle Hill', 'museum', 'institution', '2', 'The visible store — 500,000 objects, open free every weekend.', '172 Showground Road, Castle Hill NSW', 'Castle Hill', 'https://powerhouse.com.au/visit/castle-hill', '@powerhousemuseum', null, null, 'Sydney', null, null, null, null, null, 'active'),
  ('powerhouse-ultimo', 'Powerhouse Ultimo', 'museum', 'institution', '1', 'The Ultimo original — closed for the heritage revitalisation.', '500 Harris Street, Ultimo NSW', 'Ultimo', 'https://powerhouse.com.au', '@powerhousemuseum', null, null, 'Sydney', null, null, null, null, null, 'pending')
on conflict (slug) do update set
  name           = excluded.name,
  type           = excluded.type,
  category       = excluded.category,
  tier           = excluded.tier,
  editorial_note = excluded.editorial_note,
  address        = coalesce(excluded.address, venues.address),
  suburb         = excluded.suburb,
  website        = coalesce(excluded.website, venues.website),
  instagram      = coalesce(excluded.instagram, venues.instagram),
  latitude       = coalesce(excluded.latitude, venues.latitude),
  longitude      = coalesce(excluded.longitude, venues.longitude),
  city           = excluded.city,
  founded_year   = coalesce(excluded.founded_year, venues.founded_year),
  free_entry     = coalesce(excluded.free_entry, venues.free_entry),
  entry_checked  = coalesce(excluded.entry_checked, venues.entry_checked),
  opening_hours  = coalesce(excluded.opening_hours, venues.opening_hours),
  hours_checked  = coalesce(excluded.hours_checked, venues.hours_checked),
  status         = excluded.status;

-- Closed before this register existed — archived, never deleted.
update venues set status = 'archived', verification_source = 'owner register v2'
  where slug in ('may-space', 'liverpool-street-gallery');

-- ---------------------------------------------------------------------------
-- Venue photography — freely licensed (Wikimedia Commons). Only set where the
-- venue has no photo yet, so a venue-uploaded photo is never overwritten.
-- ---------------------------------------------------------------------------
update venues set image_url = x.url
from (values
  ('art-gallery-of-new-south-wales', 'https://upload.wikimedia.org/wikipedia/commons/4/42/Art_Gallery_of_New_South_Wales.JPG'),
  ('mca-australia', 'https://upload.wikimedia.org/wikipedia/commons/f/f5/The_Museum_of_Contemporary_Art%2C_Sydney_%28former_MSB_Building%29.jpg'),
  ('roslyn-oxley9-gallery', 'https://commons.wikimedia.org/wiki/Special:FilePath/Roslyn_Oxley9_Gallery.jpg?width=1600'),
  ('artspace', 'https://commons.wikimedia.org/wiki/Special:FilePath/Artspace%2C_The_Gunnery%2C_Woolloomooloo.jpg?width=1600'),
  ('manly-art-gallery-museum', 'https://commons.wikimedia.org/wiki/Special:FilePath/Manly_Art_Gallery_and_Museum_pano.jpg?width=1600'),
  ('nas-gallery', 'https://commons.wikimedia.org/wiki/Special:FilePath/(1)_National_Art_School_(d).JPG?width=1600'),
  ('sh-ervin-gallery', 'https://commons.wikimedia.org/wiki/Special:FilePath/S._H._Ervin_Gallery_1.jpg?width=1600'),
  ('australian-museum', 'https://commons.wikimedia.org/wiki/Special:FilePath/AustralianMuseum.jpg?width=1600'),
  ('chau-chak-wing-museum', 'https://commons.wikimedia.org/wiki/Special:FilePath/Entrance_to_the_Chau_Chak_Wing_Museum_April_2021.jpg?width=1600'),
  ('museum-of-sydney', 'https://commons.wikimedia.org/wiki/Special:FilePath/Museum_of_Sydney_2010.jpg?width=1600'),
  ('sydney-jewish-museum', 'https://commons.wikimedia.org/wiki/Special:FilePath/Sydney_Jewish_Museum_Darlinghurst_Road_-_Burton_Street_junction_view.jpg?width=1600'),
  ('white-rabbit-gallery', 'https://commons.wikimedia.org/wiki/Special:FilePath/White_Rabbit_Gallery_tea_house.jpg?width=1600'),
  ('incinerator-art-space', 'https://commons.wikimedia.org/wiki/Special:FilePath/(1)Griffin_incinerator_Willoughby_123.jpg?width=1600'),
  ('woollahra-gallery-at-redleaf', 'https://commons.wikimedia.org/wiki/Special:FilePath/Double_Bay_Council_Chambers-A.jpg?width=1600'),
  ('hyde-park-barracks', 'https://commons.wikimedia.org/wiki/Special:FilePath/HydeParkBarracks.JPG?width=1600'),
  ('justice-police-museum', 'https://commons.wikimedia.org/wiki/Special:FilePath/Justice_and_Police_Museum.jpg?width=1600'),
  ('state-library-of-nsw-galleries', 'https://commons.wikimedia.org/wiki/Special:FilePath/State_Library_of_New_South_Wales.jpg?width=1600'),
  ('brett-whiteley-studio', 'https://commons.wikimedia.org/wiki/Special:FilePath/Brett_whiteley_studio_raper_street_surry_hills.jpg?width=1600'),
  ('australian-national-maritime-museum', 'https://commons.wikimedia.org/wiki/Special:FilePath/Australian_National_Maritime_Museum_(30581601062).jpg?width=1600'),
  ('customs-house', 'https://commons.wikimedia.org/wiki/Special:FilePath/Customs_House_(James_Barnet)%2C_Sydney_-_Wiki0055.jpg?width=1600'),
  ('rose-seidler-house', 'https://commons.wikimedia.org/wiki/Special:FilePath/Rose_Seidler_House%2C_Wahroonga%2C_Sydney%2C_1951_-_photographed_by_Marcel_Seidler_(3461484773).jpg?width=1600'),
  ('vaucluse-house', 'https://commons.wikimedia.org/wiki/Special:FilePath/130_Vaucluse_House%2C_Sydney%2C_1979_(52068393355).jpg?width=1600'),
  ('old-government-house', 'https://commons.wikimedia.org/wiki/Special:FilePath/Old_Government_House_-_Parramatta_Park%2C_Parramatta%2C_NSW_(7822320214).jpg?width=1600'),
  ('bondi-pavilion-gallery', 'https://commons.wikimedia.org/wiki/Special:FilePath/Bondi_Beach_Pavilion.jpg?width=1600'),
  ('wollongong-art-gallery', 'https://commons.wikimedia.org/wiki/Special:FilePath/Wollongong_Art_Gallery_August_2020.jpg?width=1600'),
  ('newcastle-art-gallery', 'https://commons.wikimedia.org/wiki/Special:FilePath/Newcastle_Art_Gallery%2C_April_2026.jpg?width=1600'),
  ('maitland-regional-art-gallery', 'https://commons.wikimedia.org/wiki/Special:FilePath/Maitland_Regional_Art_Gallery%2C_December_2025_02.jpg?width=1600')
) as x(slug, url)
where venues.slug = x.slug and venues.image_url is null;

-- Controle: hoeveel venues staan er nu live?
select count(*) as venues_live from venues where status = 'active';

-- ART EYE — zet de geverifieerde tentoonstellingen in de LIVE database.
--  GENERATED FILE — do not edit by hand.
--  Source: art-eye/src/lib/seed.ts. Regenerate with `npm run seed:sql`.
--
--  67 shows.
--  Plak dit een keer in de SQL Editor en druk Run. Veilig om te herhalen: shows
--  die er al staan (zelfde venue + titel) worden overgeslagen, en de wachtrij
--  van de motor blijft onaangeroerd.

with seed (slug, title, artists, start_date, end_date, description, image_url, is_featured) as (
  values
  ('art-gallery-of-new-south-wales', 'Archibald, Wynne & Sulman Prizes 2026', 'Finalists 2026', '2026-05-09', '2026-08-16', 'Australia’s most argued-over walls. The Archibald’s portraits, the Wynne’s landscapes and the Sulman’s subject pictures hang side by side — a yearly census of who we are and how we want to be seen.', null, true),
  ('art-gallery-of-new-south-wales', 'Takashi Murakami', 'Takashi Murakami', '2026-12-05', '2027-07-18', 'The superflat universe at full scale — smiling flowers, silver screens and centuries of Japanese painting compressed into one relentless surface. Murakami’s first major Sydney survey.', 'https://upload.wikimedia.org/wikipedia/commons/8/80/Takashi_Murakami_at_Versailles_Sept._2010_%281%29.jpg', true),
  ('mca-australia', 'Primavera 2026: Young Australian Artists', 'Young Australian Artists', '2026-06-27', '2026-09-28', 'The MCA’s annual exhibition of Australian artists aged 35 and under — the clearest early signal of where Australian art is going next.', null, true),
  ('mca-australia', 'Hany Armanious: The Planets', 'Hany Armanious', '2026-07-10', '2026-10-26', 'Casts of the overlooked — foam, wax, candle stubs, offcuts — remade with such fidelity that the ordinary turns uncanny. A survey of one of Australia’s most quietly influential sculptors.', null, false),
  ('mca-australia', 'Robyn Kahukiwa: My Ancestors Are Always With Me', 'Robyn Kahukiwa', '2026-10-14', '2027-02-07', 'Paintings that carry whakapapa like a current — the late Māori artist’s figures of women and ancestors, political and tender at once, gathered for Sydney audiences.', null, false),
  ('mca-australia', 'Nell: Loti Smorgon Sculpture Terrace Commission', 'Nell', '2026-08-26', '2027-08-23', 'A new commission by Nell — where rock’n’roll, Buddhism and the eucalypt meet. On the MCA’s public-facing spaces through spring.', null, false),
  ('roslyn-oxley9-gallery', 'A Constructed World', 'A Constructed World', '2026-06-26', '2026-07-18', 'The collaborative practice of Geoff Lowe and Jacqueline Riva — painting, performance and speech acts that keep meaning deliberately unstable.', null, false),
  ('cassandra-bird', 'Places of Delight', 'Robby Bennett', '2026-06-19', '2026-08-01', 'New paintings by Robby Bennett — gardens, rooms and remembered places rendered as sites of pleasure and slight unease.', null, false),
  ('1301sw', 'Sally Gabori & Judy Ledgerwood', 'Sally Gabori, Judy Ledgerwood', '2026-06-13', '2026-07-11', 'Two painters of colour at scale, an ocean apart — Gabori’s Kaiadilt country in saturated fields beside Ledgerwood’s rhythmic Chicago abstraction.', null, false),
  ('ames-yavuz', 'Infinite Gesture', 'Group Exhibition', '2026-07-04', '2026-08-08', 'A group exhibition on the mark as a unit of thought — gesture repeated, extended and abstracted across painting and works on paper.', null, false),
  ('olsen-annexe', 'Interconnected', 'Aaron Crothers', '2026-07-22', '2026-08-15', 'Aaron Crothers maps the systems beneath landscape — geology, weather, root and network — in paintings that read like aerial diagrams of connection.', null, false),
  ('grace-cossington-smith-gallery', 'Pulse', 'Group Exhibition', '2026-06-12', '2026-07-11', 'Works that take rhythm as subject and method — repetition, beat and breath across media at the Grace Cossington Smith Gallery.', null, false),
  ('grace-cossington-smith-gallery', 'Abbotsleigh Biennial: Finalists', 'Biennial Finalists', '2026-07-18', '2026-08-15', 'Finalists of the Abbotsleigh Biennial — a cross-section of current practice selected for the gallery’s biennial exhibition and prize.', null, false),
  ('white-rabbit-gallery', 'Black Myth', 'White Rabbit Collection artists', '2026-06-25', '2026-11-08', 'Drawn from the Judith Neilson collection — new Chinese art that reaches for the mythic: gods, ghosts and machines tangled in one dark, spectacular sweep across all four floors.', null, true),
  ('artspace', '2026 NSW Visual Arts Fellowship (Emerging)', 'Virginia Keft, Charles Levi, Tia Madden, Amelia Skelton, Sue Jo Wright, Natasha & Caitlin Dubler', '2026-07-03', '2026-09-06', 'Six emerging practices in one charged room — the state’s sharpest early-career artists make their case for the Fellowship at The Gunnery.', null, false),
  ('chau-chak-wing-museum', 'Undying: Abdul-Rahman Abdullah', 'Abdul-Rahman Abdullah', '2026-02-07', '2026-07-26', 'Hand-carved animals meet the museum’s natural history collection — Abdullah’s tender, uncanny menagerie on our entangled lives with the creatures we keep, fear and mourn.', null, false),
  ('chau-chak-wing-museum', 'Unkept: Kirtika Kain', 'Kirtika Kain', '2026-02-07', '2026-07-26', 'In a makeshift storehouse in the Penelope Gallery, Kain works gold, tar and pigment into a reckoning with caste, labour and the histories archives fail to keep.', null, false),
  ('sh-ervin-gallery', 'Salon des Refusés 2026', 'The alternative Archibald & Wynne selection', '2026-05-09', '2026-07-26', 'The ones that got away — the annual alternative selection from the Archibald and Wynne entries, hung on Observatory Hill and argued over just as fiercely.', null, false),
  ('nas-gallery', 'Mitch Cairns: Artist’s Mouth', 'Mitch Cairns', '2026-05-01', '2026-07-11', 'Twenty years of Cairns’ cool, exact painting — 48 works, the 2017 Archibald winner among them — surveyed in the old Darlinghurst Gaol where he trained.', null, false),
  ('mosman-art-gallery', 'Jasper Knight: Collage, prints and works on paper', 'Jasper Knight', '2026-06-01', '2026-08-09', 'Harbour light at speed — Knight’s cut, layered and printed Sydney, from ferries to pylons, in a survey of his works on paper at Mosman.', null, false),
  ('manly-art-gallery-museum', 'Tamara Dean: Leave Only Footprints', 'Tamara Dean', '2026-06-12', '2026-08-02', 'Bodies folded into bushland, ocean and storm — the first survey of Dean’s staged photomedia, where the human figure is one animal among many.', null, false),
  ('manly-art-gallery-museum', 'Min Wong: You shall definitely pass', 'Min Wong', '2026-06-12', '2026-08-02', 'Fresh from residencies in Berlin and Athens, Wong builds an immersive installation on power, belonging and the promises of self-improvement.', null, false),
  ('manly-art-gallery-museum', 'Chronos: Australian ceramics from 1933', 'Australian ceramicists, 1933 to now', '2026-03-21', '2027-03-14', 'Nine decades of Australian clay — how ceramic practice holds and hands on cultural change, traced through the gallery’s collection.', null, false),
  ('campbelltown-arts-centre', 'Friends Annual & Focus: Zara Collins', 'Friends of Campbelltown Arts Centre, Zara Collins', '2026-06-27', '2026-09-13', 'The region’s artists on their own walls — the Friends’ eclectic annual across styles and mediums, with Zara Collins as this year’s Focus artist.', null, false),
  ('firstdraft', 'You wouldn’t remember him', 'Nina Dorabialski', '2026-07-18', '2026-08-22', 'The family album, present only by inference — Dorabialski circles the pictures never shown, unsettling the stories nuclear families tell about themselves.', null, false),
  ('king-street-gallery', 'The Quick and the Slow', 'John Bartley', '2026-07-07', '2026-08-01', 'Bartley’s new paintings hold two speeds at once — quick marks over slow ground, landscape as something felt in tempo rather than seen in place.', null, false),
  ('king-street-gallery', 'Proverbial', 'Nathan Nhan', '2026-07-07', '2026-08-01', 'Nhan takes the worn wisdom of proverbs and paints it strange again — inherited sayings tested against a first-generation present.', null, false),
  ('wollongong-art-gallery', 'Once Upon a Doll', 'Raquel Caballero', '2026-07-03', '2026-11-01', 'Sixteen hand-built dolls by Raquel Caballero — craft turned uncanny, childhood forms carrying very adult freight.', null, false),
  ('wollongong-art-gallery', 'Popular Versus Culture', 'Georgia Banks', '2026-06-06', '2026-09-06', 'Made in the wake of a residency at The Andy Warhol Museum, Banks pushes Warhol''s obsession with fame and fandom into the feed-scroll present.', null, false),
  ('ngununggula', 'New Religion', 'Hayley Millar Baker, Nell, Julia Robinson, Brent Harris & others', '2026-06-27', '2026-10-18', 'Faith and its afterimages — contemporary work alongside loans from the AGNSW and NGA, from Dürer to now, on symbols that outlive belief.', null, false),
  ('bundanon', 'Man on Fire: Visions of Nebuchadnezzar', 'Arthur Boyd, Shaun Gladwell', '2026-07-04', '2026-10-11', 'Boyd''s Nebuchadnezzar paintings — a king burning through his own hubris — meet a major new Shaun Gladwell commission on the same unravelling.', null, true),
  ('blue-mountains-cultural-centre', 'The Art of Adaptation', 'Kandos School of Cultural Adaptation', '2026-06-20', '2026-08-02', 'The Kandos School of Cultural Adaptation brings its field-tested art-and-land experiments to Katoomba — practical, hopeful, unromantic.', null, false),
  ('newcastle-art-gallery', 'Brian Robinson: Multiverse', 'Brian Robinson', '2026-05-23', '2026-08-30', 'The Torres Strait Islander artist''s first major NSW solo — monumental linocuts, larger-than-life sculpture and an immersive animation in the reopened gallery.', null, false),
  ('newcastle-art-gallery', 'Tiyan Baker', 'Tiyan Baker', '2026-07-25', '2026-09-06', 'Baker''s first institutional solo, on home ground — part of the reopened Newcastle Art Gallery''s statement 2026 program.', null, false),
  ('the-lock-up', 'Into the Dark', 'Wendy Sharpe', '2026-07-18', '2026-09-13', 'Archibald winner Wendy Sharpe paints the night side — staged in the cells of a former police lock-up, which suits the work.', null, false),
  ('gosford-regional-gallery', '20 x 20 Art Exhibition 2026', 'Central Coast artists, anonymous until sold', '2026-07-22', '2026-08-03', 'A wall of anonymous 20-centimetre squares at $100 each — the annual leveller where a name means nothing until the red dot goes up.', null, false),
  ('gosford-regional-gallery', 'Confluence', 'David Collins, Ana Pollak', '2026-07-25', '2026-09-13', 'Partners for forty years, Collins and Pollak hang side by side — two practices that meet the way rivers do, keeping their own currents.', null, false),
  ('carriageworks', 'Sydney Contemporary 2026', '100+ galleries, 500+ artists', '2026-09-03', '2026-09-06', 'The southern hemisphere''s biggest art fair takes over the Eveleigh rail sheds — a hundred galleries, five hundred artists, four dense days.', null, false),
  ('4a-centre', 'Archetypes: 30 Years of 4A', 'Asian-Australian artists across three decades', '2026-07-11', '2026-09-20', 'Three decades of Asian-Australian art and advocacy — new commissions hung against the archive that made them possible.', null, false),
  ('nas-gallery', 'Margaret Olley: Australian Intimiste', 'Margaret Olley', '2026-07-31', '2026-10-25', 'Interiors, ranunculus, the unmade table — the National Art School honours its most beloved alum with a full survey of the great intimiste.', null, true),
  ('hazelhurst-arts-centre', 'Milli Jannides', 'Milli Jannides', '2026-07-04', '2026-08-30', 'Dreamlike, loose-limbed painting from the Sydney-born, Aotearoa-based Jannides — canvases that feel remembered rather than observed.', null, false),
  ('hazelhurst-arts-centre', 'Mango Flesh Identikit', 'Edward Inchbold', '2026-07-10', '2026-07-28', 'Inchbold''s new paintings hold two readings at once — identity and memory worked over until the image refuses to settle.', null, false),
  ('penrith-regional-gallery', 'Ngalawan: We Live', 'Leanne Tobin', '2026-07-04', '2026-11-01', 'Dharug artist Leanne Tobin on Country, presence and persistence — the gallery''s major solo through spring.', null, false),
  ('penrith-regional-gallery', 'Penrith Youth Art Prize 2026', 'Young artists of the Penrith region', '2026-06-27', '2026-09-09', 'The region''s youngest artists on the big walls — an annual prize show with more nerve than polish, in the best way.', null, false),
  ('fairfield-city-museum-gallery', 'We Are Here', 'Fairfield communities', '2026-04-11', '2026-09-19', 'Fairfield''s communities tell their own arrival stories — a museum show built from the suburb outward.', null, false),
  ('hawkesbury-regional-gallery', 'Entangled Grounds', 'Yandell Walton, Mar Serinyà Gou', '2026-06-06', '2026-08-23', 'Walton and Serinyà Gou turn residencies on the edge of Wollemi National Park into work about roots, networks and what connects underneath.', null, false),
  ('hurstville-museum-gallery', 'Woven from a hundred flowers', 'Nepalese community artists of the Georges River', '2026-05-01', '2026-08-30', 'Stories and textiles of the Nepalese community of the Georges River — culture carried in cloth.', null, false),
  ('pari', 'Domain', 'Chloe Abdelnour, Katerina Asistin, Lingam Brown & others', '2026-06-21', '2026-08-16', 'Western Sydney voices on their own terms — Pari''s group show holds the neighbourhood close.', null, false),
  ('utopia-art-sydney', 'David Aspden', 'David Aspden', '2026-07-25', '2026-08-15', 'Unseen major Aspdens from the 1970s — colour as weather — opening the gallery''s new Waterloo rooms.', null, false),
  ('martin-browne-contemporary', 'Introspection', 'Adrienne Gaha', '2026-07-04', '2026-07-25', 'Gaha''s veiled, luminous canvases — painting that looks inward and lets the light do the arguing.', null, false),
  ('martin-browne-contemporary', 'La Madrugá', 'Rose Espinosa', '2026-07-04', '2026-07-25', 'Espinosa''s small hours — works named for the hush before dawn, hung alongside Gaha''s Introspection.', null, false),
  ('mosman-art-gallery', 'Shireen Taweel: the trig point', 'Shireen Taweel', '2026-05-16', '2026-08-09', 'Taweel maps sacred architecture onto the observatory — a silk house of seven circles and a sonic score of navigation, migration and faith.', null, false),
  ('mosman-art-gallery', 'Merciful Navigation', 'Casey Chen', '2026-05-16', '2026-08-09', 'Chen redraws a mythical Song-dynasty China through ceramic tradition and pop culture — an allegorical map of a country in turmoil.', null, false),
  ('gallery-lane-cove', 'Evolution: Founders of the Indigenous Art Movement', 'Albert Namatjira, Emily Kngwarreye, Ronnie Tjampitjinpa & others', '2026-07-01', '2026-07-25', 'Namatjira, Kngwarreye, Tjampitjinpa — the founders of the desert painting movement, curated by Brenda Colahan at Lane Cove.', null, false),
  ('art-space-on-the-concourse', 'THREADLINES', 'Five First Nations artists, curated by Nicole Monks', '2026-07-02', '2026-08-02', 'Weaving as method, collaboration as subject — five artists in residence, with work spilling into the library next door.', null, false),
  ('art-space-on-the-concourse', 'Operation Art 2026', 'NSW school students for Westmead Children''s Hospital', '2026-08-08', '2026-10-04', 'Schoolchildren painting for the children''s hospital — hundreds of small works of unguarded sincerity, picked for the wards at Westmead.', null, false),
  ('dominik-mersch-gallery', 'DMG Curator Award 2026: After Hours', 'Group show curated by Liam Garstang', '2026-07-10', '2026-08-01', 'Curator Award winner Liam Garstang keeps the lights on late — a group show about what work does to time.', null, false),
  ('art-gallery-of-new-south-wales', 'Super Nature', 'Group Exhibition', '2026-03-14', '2027-02-01', 'Four thematic spaces on the ties between people and the environment — gardens as memorials, the wild nature that lives alongside us, and the cultivation of nature for survival. Free entry.', null, false),
  ('art-gallery-of-new-south-wales', 'Avatar: Forms of Vishnu', 'South and Southeast Asian art', '2026-06-20', '2026-10-05', 'Centuries of art and storytelling from South and Southeast Asia celebrating Vishnu, the Hindu deity believed to preserve order in the universe.', null, false),
  ('art-gallery-of-new-south-wales', 'Nolan: Origins', 'Sidney Nolan', '2026-10-03', '2027-02-07', 'A major survey of Sidney Nolan''s formative years in Australia — the making of one of the country''s defining modern painters.', null, false),
  ('mca-australia', 'Tony Albert: Not a Souvenir', 'Tony Albert', '2026-05-21', '2026-10-19', 'A major survey across sculpture, photography, installation and painting — Albert turns The Rocks'' souvenir culture back on itself, confronting the commodification of Aboriginal people while celebrating survival and pride. Guest curated by Bruce Johnson McLean.', null, false),
  ('sh-ervin-gallery', 'Portia Geach Memorial Award 2026', 'Finalists 2026', '2026-09-18', '2026-11-01', 'The country’s richest portrait prize for women painters, first awarded in 1965 — finalists on Observatory Hill.', null, false),
  ('sh-ervin-gallery', 'Olive Cotton and her contemporaries', 'Olive Cotton, Ilse Bing, Dora Maar, Lucia Moholy', '2026-08-01', '2026-09-13', 'Cotton’s Australian modernism hung beside Bing, Maar and Moholy — four women who each made the camera argue with its own century.', null, false),
  ('campbelltown-arts-centre', 'Make', 'Group exhibition', '2026-08-22', '2026-09-13', 'Making as the subject, not the means — process work from the Campbelltown studios and beyond.', null, false),
  ('campbelltown-arts-centre', '2026 Fisher’s Ghost Art Award', 'Finalists 2026', '2026-09-26', '2026-12-04', 'Campbelltown’s open prize, named for the district’s own ghost story — the widest cross-section of practice in south-west Sydney.', null, false),
  ('hazelhurst-arts-centre', 'Dreams Nursed in Darkness', 'Group exhibition', '2026-09-12', '2026-11-08', 'Work made in and about the dark — the touring exhibition arrives at Hazelhurst for spring. Free entry.', null, false),
  ('artspace', 'Jasmine Miikika Craciun: Light of a Clear Blue Morning', 'Jasmine Miikika Craciun', '2026-07-02', '2026-09-06', 'The Barkindji and Malyangapa artist works a family archive — Wilcannia to suburban Sydney — through painting, textiles and stained glass at the Ideas Platform.', null, false)
)
insert into exhibitions (venue_id, title, artists, start_date, end_date, description, image_url, status, is_featured, city)
select v.id, s.title, s.artists, s.start_date::date, s.end_date::date, s.description, s.image_url, 'approved', s.is_featured, 'Sydney'
from seed s
join venues v on v.slug = s.slug
where not exists (
  select 1 from exhibitions e
  where e.venue_id = v.id and lower(e.title) = lower(s.title)
);

-- Controle: hoeveel staan er nu live?
select count(*) as exhibitions_live from exhibitions;
