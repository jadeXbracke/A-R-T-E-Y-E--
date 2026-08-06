-- ART EYE — SETUP STEP 1 of 2: DATABASE SCHEMA.
-- Paste this ENTIRE file into the Supabase SQL Editor and press Run.
-- Then run setup_2_venues.sql. Safe to run once on a fresh project.
-- (Contains every migration except the optional auto-scheduler 0006.)


-- ============================================================
-- migrations/0001_init.sql
-- ============================================================
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
  image_url text,
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

-- (skipped 0006 — optional auto-scheduler, not needed here)

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

-- Weekly press-image pass — Tuesdays 02:30, after Monday's validate run.
-- Uses the same Vault secrets (project_url, service_role_key) as 0006.
-- (cron.schedule removed — optional auto-scheduler, needs pg_cron/0006)

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

-- A short "about me" and a profile photo, shown on the public profile.
alter table profiles
  add column if not exists bio text,
  add column if not exists avatar_url text;

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
