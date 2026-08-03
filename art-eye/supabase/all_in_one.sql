-- ART EYE — ALL-IN-ONE database setup for the exhibitions pipeline.
-- Paste this ENTIRE file into the Supabase SQL Editor and press Run.
-- Safe to run once on a fresh project. Contains every migration EXCEPT the
-- optional pg_cron scheduler (0006), plus the 54 real Sydney venues.
-- (You can add scheduling later; it isn't needed to run the pipeline by hand.)


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

-- (skipped 0006_pipeline_cron.sql — optional auto-scheduler, not needed here)

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
select cron.schedule(
  'art-eye-enrich-images',
  '30 2 * * 2',
  $$select call_pipeline_function('enrich-images')$$
);

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
-- venues_seed.sql  (54 real Sydney venues with websites)
-- ============================================================
-- ============================================================================
--  ART EYE — SYDNEY VENUE REGISTER  (seed / upsert)
-- ============================================================================
--  54 real Sydney venues (galleries, museums, ARIs), verified July 2026.
--  Safe to run repeatedly: rows are matched on `slug`, so re-running updates
--  existing venues instead of creating duplicates.
--
--  Run AFTER the migrations in ./migrations (needs the new columns + slug).
--
--  To add another venue, copy a line, keep the comma between rows (no comma
--  after the very last row), and set type to 'gallery' | 'museum' | 'ari'.
-- ============================================================================

insert into venues (slug, name, type, address, suburb, website, instagram, latitude, longitude, city) values
  ('articulate-project-space', 'Articulate Project Space', 'ari', '497 Parramatta Road, Leichhardt NSW', 'Leichhardt', 'https://www.articulateprojectspace.org', '@articulateprojectspace', -33.8776, 151.1552, 'Sydney'),
  ('boomalli', 'Boomalli Aboriginal Artists Co-operative', 'ari', '55–59 Flood Street, Leichhardt NSW', 'Leichhardt', 'https://boomalli.com.au', '@boomalli_aboriginal_art', -33.8858, 151.1504, 'Sydney'),
  ('firstdraft', 'Firstdraft', 'ari', '13–17 Riley Street, Woolloomooloo NSW', 'Woolloomooloo', 'https://firstdraft.org.au', '@firstdraft_', -33.8725, 151.2155, 'Sydney'),
  ('frontyard-projects', 'Frontyard Projects', 'ari', '228 Illawarra Road, Marrickville NSW', 'Marrickville', 'https://www.frontyardprojects.org', '@frontyardorg', -33.9107, 151.1549, 'Sydney'),
  ('pari', 'Pari', 'ari', 'Shop 7, 14 Hunter Street, Parramatta NSW', 'Parramatta', 'https://pariari.org', '@pari_ari_', -33.813, 150.9987, 'Sydney'),
  ('scratch-art-space', 'Scratch Art Space', 'ari', '67 Sydenham Road, Marrickville NSW', 'Marrickville', 'https://www.scratchartspace.com', '@scratchartspace', -33.9065, 151.1614, 'Sydney'),
  ('tortuga-studios', 'Tortuga Studios', 'ari', '31 Princes Highway, St Peters NSW', 'St Peters', 'https://tortugastudios.org.au', '@tortuga.studios', -33.91, 151.1808, 'Sydney'),
  ('4a-centre', '4A Centre for Contemporary Asian Art', 'gallery', '181–187 Hay Street, Haymarket NSW', 'Haymarket', 'https://4a.com.au', '@4a_aus', -33.879, 151.2037, 'Sydney'),
  ('arthouse-gallery', 'Arthouse Gallery', 'gallery', '66 McLachlan Avenue, Rushcutters Bay NSW', 'Rushcutters Bay', 'https://arthousegallery.com.au', '@arthousegallery', -33.8781, 151.2236, 'Sydney'),
  ('artspace', 'Artspace', 'gallery', '43–51 Cowper Wharf Roadway (The Gunnery), Woolloomooloo NSW', 'Woolloomooloo', 'https://www.artspace.org.au', '@artspacesydney', -33.8696, 151.2205, 'Sydney'),
  ('australian-galleries-sydney', 'Australian Galleries', 'gallery', '15 Roylston Street, Paddington NSW', 'Paddington', 'https://australiangalleries.com.au', '@australiangalleries', -33.881, 151.2246, 'Sydney'),
  ('bankstown-arts-centre', 'Bankstown Arts Centre', 'gallery', '5 Olympic Parade, Bankstown NSW', 'Bankstown', 'https://www.bankstownartscentre.com.au', '@bankstownartscentre', -33.9185, 151.0342, 'Sydney'),
  ('coma-gallery', 'COMA Gallery', 'gallery', '37 Chapel Street, Marrickville NSW', 'Marrickville', 'https://www.comagallery.com', '@comagallery', -33.9078, 151.164, 'Sydney'),
  ('campbelltown-arts-centre', 'Campbelltown Arts Centre', 'gallery', '1 Art Gallery Road, Campbelltown NSW', 'Campbelltown', 'https://c-a-c.com.au', '@campbelltownartscentre', -34.0728, 150.809, 'Sydney'),
  ('carriageworks', 'Carriageworks', 'gallery', '245 Wilson Street, Eveleigh NSW', 'Eveleigh', 'https://carriageworks.com.au', '@carriageworks', -33.8946, 151.1935, 'Sydney'),
  ('chalk-horse', 'Chalk Horse', 'gallery', '167 William Street (lower ground), Darlinghurst NSW', 'Darlinghurst', 'https://www.chalkhorse.com.au', '@chalkhorsegallery', -33.875, 151.2189, 'Sydney'),
  ('china-heights', 'China Heights Gallery', 'gallery', 'Level 3, 16–28 Foster Street, Surry Hills NSW', 'Surry Hills', 'https://chinaheights.com', '@chinaheights', -33.8797, 151.2103, 'Sydney'),
  ('darren-knight-gallery', 'Darren Knight Gallery', 'gallery', '840 Elizabeth Street, Waterloo NSW', 'Waterloo', 'https://darrenknightgallery.com', '@darrenknightgallery', -33.907, 151.2072, 'Sydney'),
  ('dominik-mersch-gallery', 'Dominik Mersch Gallery', 'gallery', '1/75 McLachlan Avenue, Rushcutters Bay NSW', 'Rushcutters Bay', 'https://dominikmerschgallery.com', '@dominikmerschgallery', -33.8783, 151.2238, 'Sydney'),
  ('fine-arts-sydney', 'Fine Arts, Sydney', 'gallery', '23 Hampden Street, Paddington NSW', 'Paddington', 'https://www.finearts.sydney', '@fineartssydney', -33.8828, 151.2211, 'Sydney'),
  ('gallery-lane-cove', 'Gallery Lane Cove', 'gallery', 'Level 3, 164 Longueville Road, Lane Cove NSW', 'Lane Cove', 'https://www.gallerylanecove.com.au', '@gallerylanecove', -33.816, 151.1697, 'Sydney'),
  ('granville-centre-art-gallery', 'Granville Centre Art Gallery', 'gallery', '1 Memorial Drive, Granville NSW', 'Granville', 'https://www.cumberland.nsw.gov.au/granville-centre-art-gallery', '@granvillecentreartgallery', -33.831, 151.014, 'Sydney'),
  ('hazelhurst-arts-centre', 'Hazelhurst Arts Centre', 'gallery', '782 Kingsway, Gymea NSW', 'Gymea', 'https://hazelhurst.sutherlandshire.nsw.gov.au', '@hazelhurstartscentre', -34.0329, 151.0874, 'Sydney'),
  ('king-street-gallery', 'King Street Gallery on William', 'gallery', '177 William Street, Darlinghurst NSW', 'Darlinghurst', 'https://kingstreetgallery.com.au', '@kingstreetgallery', -33.8747, 151.2184, 'Sydney'),
  ('liverpool-powerhouse', 'Casula Powerhouse Arts Centre', 'gallery', '1 Powerhouse Road, Casula NSW', 'Casula', 'https://www.liverpoolpowerhouse.com.au', '@liverpoolpowerhouse', -33.9493, 150.9129, 'Sydney'),
  ('manly-art-gallery-museum', 'Manly Art Gallery & Museum', 'gallery', '1a West Esplanade, Manly NSW', 'Manly', 'https://www.northernbeaches.nsw.gov.au/things-to-do/arts-and-culture/manly-art-gallery-museum', '@magamnsw', -33.7986, 151.2814, 'Sydney'),
  ('martin-browne-contemporary', 'Martin Browne Contemporary', 'gallery', '15 Hampden Street, Paddington NSW', 'Paddington', 'https://martinbrownecontemporary.com', '@martinbrownecontemporary', -33.8825, 151.2338, 'Sydney'),
  ('michael-reid-sydney', 'Michael Reid Sydney', 'gallery', '109 Shepherd Street, Chippendale NSW', 'Chippendale', 'https://michaelreid.com.au', '@michaelreidsydney', -33.8877, 151.1951, 'Sydney'),
  ('mosman-art-gallery', 'Mosman Art Gallery', 'gallery', '1 Art Gallery Way, Mosman NSW', 'Mosman', 'https://mosmanartgallery.org.au', '@mosmanart', -33.8279, 151.2406, 'Sydney'),
  ('n-smith-gallery', 'N.Smith Gallery', 'gallery', '15 Foster Street, Surry Hills NSW', 'Surry Hills', 'https://www.nsmithgallery.com', '@n.smithgallery', -33.88, 151.2097, 'Sydney'),
  ('nanda-hobbs', 'Nanda\Hobbs', 'gallery', '12–14 Meagher Street, Chippendale NSW', 'Chippendale', 'https://nandahobbs.com', '@nandahobbs', -33.8867, 151.1986, 'Sydney'),
  ('nas-gallery', 'National Art School Gallery', 'gallery', '156 Forbes Street, Darlinghurst NSW', 'Darlinghurst', 'https://nas.edu.au', '@nas_au', -33.8788, 151.2172, 'Sydney'),
  ('olsen-gallery', 'Olsen Gallery', 'gallery', '63 Jersey Road, Woollahra NSW', 'Woollahra', 'https://www.olsengallery.com', '@olsen_gallery', -33.8875, 151.2337, 'Sydney'),
  ('penrith-regional-gallery', 'Penrith Regional Gallery', 'gallery', '86 River Road, Emu Plains NSW', 'Emu Plains', 'https://www.penrithregionalgallery.com.au', '@penrithregionalgallery', -33.7458, 150.6669, 'Sydney'),
  ('phoenix-central-park', 'Phoenix Central Park', 'gallery', '37–49 O''Connor Street, Chippendale NSW', 'Chippendale', 'https://phoenixcentralpark.com.au', '@phoenixcentralpark', -33.8865, 151.199, 'Sydney'),
  ('roslyn-oxley9-gallery', 'Roslyn Oxley9 Gallery', 'gallery', '8 Soudan Lane, Paddington NSW', 'Paddington', 'https://www.roslynoxley9.com.au', '@roslynoxley9', -33.8826, 151.2341, 'Sydney'),
  ('sh-ervin-gallery', 'S.H. Ervin Gallery', 'gallery', 'Watson Road, Observatory Hill, Millers Point NSW', 'Millers Point', 'https://www.shervingallery.com.au', '@shervingallery', -33.8599, 151.2049, 'Sydney'),
  ('station-sydney', 'STATION Sydney', 'gallery', '91 Campbell Street, Surry Hills NSW', 'Surry Hills', 'https://stationgallery.com', '@stationgalleryaustralia', -33.8796, 151.2102, 'Sydney'),
  ('saint-cloche', 'Saint Cloche', 'gallery', '37 MacDonald Street, Paddington NSW', 'Paddington', 'https://saintcloche.com', '@saint_cloche', -33.8824, 151.2231, 'Sydney'),
  ('sullivan-strumpf', 'Sullivan+Strumpf', 'gallery', '799 Elizabeth Street, Zetland NSW', 'Zetland', 'https://www.sullivanstrumpf.com', '@sullivanstrumpf', -33.9065, 151.2067, 'Sydney'),
  ('unsw-galleries', 'UNSW Galleries', 'gallery', 'Cnr Oxford Street & Greens Road, Paddington NSW', 'Paddington', 'https://www.galleries.unsw.edu.au', '@unswgalleries', -33.8845, 151.2223, 'Sydney'),
  ('uts-gallery', 'UTS Gallery', 'gallery', 'Level 4, Building 6, 702 Harris Street, Ultimo NSW', 'Ultimo', 'https://art.uts.edu.au', '@uts_art', -33.8805, 151.2, 'Sydney'),
  ('utopia-art-sydney', 'Utopia Art Sydney', 'gallery', '983 Bourke Street, Waterloo NSW', 'Waterloo', 'https://utopiaartsydney.com.au', '@utopiaartsydney', -33.9, 151.2106, 'Sydney'),
  ('verge-gallery', 'Verge Gallery', 'gallery', 'Jane Foss Russell Plaza, 154 City Road, Darlington NSW', 'Darlington', 'https://www.verge-gallery.net', '@vergegallery', -33.8888, 151.1866, 'Sydney'),
  ('art-gallery-of-new-south-wales', 'Art Gallery of New South Wales', 'museum', 'Art Gallery Road, The Domain, Sydney NSW', 'Sydney', 'https://www.artgallery.nsw.gov.au', '@artgalleryofnsw', -33.8688, 151.2173, 'Sydney'),
  ('australian-museum', 'Australian Museum', 'museum', '1 William Street, Sydney NSW', 'Sydney', 'https://australian.museum', '@australianmuseum', -33.8712, 151.2133, 'Sydney'),
  ('chau-chak-wing-museum', 'Chau Chak Wing Museum', 'museum', 'University Place, University of Sydney, Camperdown NSW', 'Camperdown', 'https://www.sydney.edu.au/museum/', '@ccwm_sydney', -33.8853, 151.1905, 'Sydney'),
  ('fairfield-city-museum-gallery', 'Fairfield City Museum & Gallery', 'museum', '634 The Horsley Drive, Smithfield NSW', 'Smithfield', 'https://www.fcmg.nsw.gov.au', '@fairfieldcitymuseumgallery', -33.8481, 150.9427, 'Sydney'),
  ('mca-australia', 'Museum of Contemporary Art Australia', 'museum', '140 George Street, The Rocks NSW', 'The Rocks', 'https://www.mca.com.au', '@mca_australia', -33.8601, 151.209, 'Sydney'),
  ('museum-of-sydney', 'Museum of Sydney', 'museum', 'Cnr Phillip & Bridge Streets, Sydney NSW', 'Sydney', 'https://mhnsw.au/visit-us/museum-of-sydney/', '@museumsofhistorynsw', -33.8636, 151.2114, 'Sydney'),
  ('powerhouse-parramatta', 'Powerhouse Parramatta', 'museum', '34 Phillip Street, Parramatta NSW', 'Parramatta', 'https://powerhouse.com.au/visit/parramatta', '@powerhousemuseum', -33.81, 151.0044, 'Sydney'),
  ('sydney-jewish-museum', 'Sydney Jewish Museum', 'museum', '148 Darlinghurst Road, Darlinghurst NSW', 'Darlinghurst', 'https://sydneyjewishmuseum.com.au', '@sydneyjewishmuseum', -33.879, 151.2203, 'Sydney'),
  ('white-rabbit-gallery', 'White Rabbit Gallery', 'museum', '30 Balfour Street, Chippendale NSW', 'Chippendale', 'https://whiterabbitcollection.org', '@whiterabbitgallery', -33.8865, 151.2003, 'Sydney'),
  ('cement-fondu', 'Cement Fondu', 'gallery', '36 Gosbell Street, Paddington NSW', 'Paddington', 'https://cementfondu.org', '@cementfondu', -33.8776, 151.2222, 'Sydney'),
  ('vermilion-art', 'Vermilion Art', 'gallery', '16 Hickson Road, Dawes Point NSW', 'Dawes Point', 'https://www.vermilionart.com.au', null, -33.8563, 151.2044, 'Sydney'),
  ('107-projects', '107 Projects', 'ari', '107 Redfern Street, Redfern NSW', 'Redfern', 'https://107.org.au', '@107projects', -33.8925, 151.2044, 'Sydney'),
  ('australian-design-centre', 'Australian Design Centre', 'gallery', '101–115 William Street, Darlinghurst NSW', 'Darlinghurst', 'https://australiandesigncentre.com', '@austdesigncentre', -33.8755, 151.2166, 'Sydney'),
  ('galerie-pompom', 'Galerie pompom', 'gallery', '2/39 Abercrombie Street, Chippendale NSW', 'Chippendale', 'https://galeriepompom.com', '@galeriepompom', -33.8877, 151.1984, 'Sydney'),
  ('artereal-gallery', 'Artereal Gallery', 'gallery', '747 Darling Street, Rozelle NSW', 'Rozelle', 'https://artereal.com.au', '@arterealgallery', -33.8614, 151.171, 'Sydney'),
  ('defiance-gallery', 'Defiance Gallery', 'gallery', '47 Enmore Road, Newtown NSW', 'Newtown', 'https://www.defiancegallery.com', null, -33.899, 151.177, 'Sydney'),
  ('gallery-9', 'Gallery 9', 'gallery', '9 Darley Street, Darlinghurst NSW', 'Darlinghurst', 'https://www.gallery9.com.au', null, -33.883, 151.217, 'Sydney'),
  ('incinerator-art-space', 'Incinerator Art Space', 'gallery', '2 Small Street, Willoughby NSW', 'Willoughby', 'https://www.willoughby.nsw.gov.au/community/community-spaces/incinerator-art-space', null, -33.803, 151.19, 'Sydney'),
  ('delmar-gallery', 'Delmar Gallery', 'gallery', '144 Victoria Street, Ashfield NSW', 'Ashfield', null, null, -33.883, 151.125, 'Sydney'),
  ('woollahra-gallery-at-redleaf', 'Woollahra Gallery at Redleaf', 'gallery', '548 New South Head Road, Double Bay NSW', 'Double Bay', 'https://www.woollahra.nsw.gov.au/woollahragallery', null, -33.877, 151.245, 'Sydney'),
  ('16albermarle', '16albermarle Project Space', 'gallery', '16 Albermarle Street, Newtown NSW', 'Newtown', 'https://www.16albermarle.com', null, -33.898, 151.181, 'Sydney')
on conflict (slug) do update set
  name      = excluded.name,
  type      = excluded.type,
  address   = excluded.address,
  suburb    = excluded.suburb,
  website   = excluded.website,
  instagram = excluded.instagram,
  latitude  = excluded.latitude,
  longitude = excluded.longitude,
  city      = excluded.city;


-- ---------------------------------------------------------------------------
-- v2 dataset (owner-supplied, July 2026): institutions, house museums, public
-- galleries, commercial tiers, ARIs, First Nations, day trips and auction
-- houses. verified_date stays null so the validation pipeline checks each one
-- (the ~35 verify-flagged entries surface in the first cycles).
insert into venues (slug, name, type, category, tier, editorial_note, address, suburb, website, instagram, latitude, longitude, city) values
  ('hyde-park-barracks', 'Hyde Park Barracks', 'museum', 'institution', '1', 'UNESCO-listed convict barracks on Macquarie Street.', null, 'Sydney', 'https://mhnsw.au', null, -33.8712, 151.2124, 'Sydney'),
  ('justice-police-museum', 'Justice & Police Museum', 'museum', 'institution', '1', 'Forensic photography and crime history in the old water police court - weekends only.', null, 'Sydney', 'https://mhnsw.au', null, -33.8623, 151.2119, 'Sydney'),
  ('state-library-of-nsw-galleries', 'State Library of NSW Galleries', 'museum', 'institution', '1', 'Underrated free exhibitions from the state collection.', null, 'Sydney', 'https://www.sl.nsw.gov.au', null, -33.8668, 151.213, 'Sydney'),
  ('brett-whiteley-studio', 'Brett Whiteley Studio', 'museum', 'institution', '1', 'Whiteley''s studio kept as he left it, run by the Art Gallery of NSW.', null, 'Surry Hills', null, null, -33.8845, 151.2153, 'Sydney'),
  ('australian-national-maritime-museum', 'Australian National Maritime Museum', 'museum', 'institution', '1', 'Wildlife Photographer of the Year among the masts.', null, 'Darling Harbour', 'https://www.sea.museum', null, -33.869, 151.1985, 'Sydney'),
  ('customs-house', 'Customs House', 'gallery', 'institution', '1', 'Free City of Sydney exhibitions opposite Circular Quay.', null, 'Sydney', null, null, -33.8623, 151.2107, 'Sydney'),
  ('rose-seidler-house', 'Rose Seidler House', 'museum', 'institution', '1b', 'Harry Seidler''s mid-century masterpiece; home of the Fifties Fair.', null, 'Wahroonga', 'https://mhnsw.au', null, -33.7275, 151.1092, 'Sydney'),
  ('vaucluse-house', 'Vaucluse House', 'museum', 'institution', '1b', 'Colonial estate with intact interiors and gardens.', null, 'Vaucluse', 'https://mhnsw.au', null, -33.8554, 151.278, 'Sydney'),
  ('elizabeth-bay-house', 'Elizabeth Bay House', 'museum', 'institution', '1b', '''The finest house in the colony'' - an architecture icon.', null, 'Elizabeth Bay', 'https://mhnsw.au', null, -33.8702, 151.2262, 'Sydney'),
  ('old-government-house', 'Old Government House', 'museum', 'institution', '1b', 'Australia''s oldest public building, in Parramatta Park.', null, 'Parramatta', null, null, -33.811, 150.999, 'Sydney'),
  ('nutcote-may-gibbs-house', 'Nutcote (May Gibbs'' House)', 'museum', 'institution', '1b', 'The illustrator of the gumnut babies, at home.', null, 'Neutral Bay', null, null, -33.839, 151.222, 'Sydney'),
  ('macquarie-university-art-gallery', 'Macquarie University Art Gallery', 'gallery', 'public', '2', 'University collection and program on the north side.', null, 'Macquarie Park', null, null, -33.777, 151.113, 'Sydney'),
  ('margaret-whitlam-galleries', 'Margaret Whitlam Galleries', 'gallery', 'public', '2', 'Western Sydney University galleries in the Female Orphan School.', null, 'Parramatta', null, null, -33.818, 151.023, 'Sydney'),
  ('the-cross-art-projects', 'The Cross Art Projects', 'gallery', 'public', '2', 'Small curatorial non-profit with a political edge.', null, 'Kings Cross', null, null, -33.874, 151.2225, 'Sydney'),
  ('bondi-pavilion-gallery', 'Bondi Pavilion Gallery', 'gallery', 'public', '2', 'Waverley Council''s gallery in the restored beachfront pavilion.', null, 'Bondi Beach', null, null, -33.891, 151.276, 'Sydney'),
  ('art-space-on-the-concourse', 'Art Space on The Concourse', 'gallery', 'public', '2', 'Willoughby Council''s exhibition space on the North Shore.', null, 'Chatswood', null, null, -33.796, 151.183, 'Sydney'),
  ('juniper-hall', 'Juniper Hall', 'gallery', 'public', '2', 'Georgian landmark, home of the Moran Prizes.', null, 'Paddington', null, null, -33.884, 151.227, 'Sydney'),
  ('artbank', 'Artbank', 'gallery', 'public', '2', 'The government''s lending collection - occasional public program.', null, 'Waterloo', null, null, -33.9, 151.207, 'Sydney'),
  ('blacktown-arts', 'Blacktown Arts', 'gallery', 'public', '2b', 'First Nations and Western Sydney focus in the Leo Kelly Centre.', null, 'Blacktown', null, null, -33.771, 150.906, 'Sydney'),
  ('parramatta-artists-studios', 'Parramatta Artists'' Studios', 'ari', 'public', '2b', 'Council studios with open-studio nights.', null, 'Parramatta', null, null, -33.815, 151.005, 'Sydney'),
  ('hawkesbury-regional-gallery', 'Hawkesbury Regional Gallery', 'gallery', 'public', '2b', 'Regional gallery on Sydney''s north-west edge.', null, 'Windsor', null, null, -33.613, 150.814, 'Sydney'),
  ('hurstville-museum-gallery', 'Hurstville Museum & Gallery', 'museum', 'public', '2b', 'Georges River Council museum and gallery.', null, 'Hurstville', null, null, -33.967, 151.103, 'Sydney'),
  ('peacock-gallery', 'Peacock Gallery', 'gallery', 'public', '2b', 'Small gallery in the Auburn Botanic Gardens.', null, 'Auburn', null, null, -33.853, 151.028, 'Sydney'),
  ('museums-discovery-centre', 'Museums Discovery Centre', 'museum', 'public', '2b', 'The Powerhouse''s open store - tours through the collection.', null, 'Castle Hill', null, null, -33.732, 150.98, 'Sydney'),
  ('sarah-cottier-gallery', 'Sarah Cottier Gallery', 'gallery', 'commercial', '3', 'Minimal and conceptual since the nineties.', null, 'Paddington', null, null, -33.884, 151.226, 'Sydney'),
  ('the-commercial', 'The Commercial', 'gallery', 'commercial', '3', 'Sharp conceptual program with a devoted following.', null, 'Marrickville', null, null, -33.911, 151.155, 'Sydney'),
  ('wagner-contemporary', 'Wagner Contemporary', 'gallery', 'commercial', '3', 'Approachable contemporary painting on Oxford Street.', null, 'Paddington', null, null, -33.885, 151.227, 'Sydney'),
  ('piermarq', 'Piermarq', 'gallery', 'commercial', '3', 'International program pitched at a younger crowd.', null, 'Paddington', null, null, -33.884, 151.225, 'Sydney'),
  ('gallery-sally-dan-cuthbert', 'Gallery Sally Dan-Cuthbert', 'gallery', 'commercial', '3', 'Art crossed with collectible design.', null, 'Rushcutters Bay', null, null, -33.875, 151.225, 'Sydney'),
  ('annette-larkin-fine-art', 'Annette Larkin Fine Art', 'gallery', 'commercial', '3', 'Secondary-market specialist.', null, 'Darlinghurst', null, null, -33.879, 151.217, 'Sydney'),
  ('maunsell-wickes', 'Maunsell Wickes', 'gallery', 'commercial', '3', 'Long-established rooms on Glenmore Road.', null, 'Paddington', null, null, -33.885, 151.224, 'Sydney'),
  ('richard-martin-art', 'Richard Martin Art', 'gallery', 'commercial', '3', 'Modern and contemporary secondary market.', null, 'Woollahra', null, null, -33.888, 151.24, 'Sydney'),
  ('harvey-galleries', 'Harvey Galleries', 'gallery', 'commercial', '3', 'Commercial stalwart with harbourside clientele.', null, 'Mosman', null, null, -33.828, 151.244, 'Sydney'),
  ('wentworth-galleries', 'Wentworth Galleries', 'gallery', 'commercial', '3', 'CBD commercial gallery.', null, 'Sydney', null, null, -33.868, 151.211, 'Sydney'),
  ('jerico-contemporary', 'Jerico Contemporary', 'gallery', 'commercial', '3b', 'Young and elegant, by the finger wharf.', null, 'Woolloomooloo', null, null, -33.87, 151.22, 'Sydney'),
  ('m-contemporary', 'M Contemporary', 'gallery', 'commercial', '3b', 'Strong curation on Ocean Street.', null, 'Woollahra', null, null, -33.885, 151.24, 'Sydney'),
  ('stanley-street-gallery', 'Stanley Street Gallery', 'gallery', 'commercial', '3b', 'Contemporary art and studio jewellery.', null, 'Darlinghurst', null, null, -33.878, 151.218, 'Sydney'),
  ('curatorial-co', 'Curatorial+Co', 'gallery', 'commercial', '3b', 'Online-first gallery with a physical space.', null, 'Redfern', null, null, -33.892, 151.204, 'Sydney'),
  ('flinders-street-gallery', 'Flinders Street Gallery', 'gallery', 'commercial', '3b', 'Painting-focused program.', null, 'Surry Hills', null, null, -33.886, 151.214, 'Sydney'),
  ('black-eye-gallery', 'Black Eye Gallery', 'gallery', 'commercial', '3b', 'Photography specialist.', null, 'Darlinghurst', null, null, -33.879, 151.218, 'Sydney'),
  ('gaffa-gallery', 'Gaffa Gallery', 'gallery', 'commercial', '3b', 'Craft and photography across two floors.', null, 'Sydney', null, null, -33.876, 151.207, 'Sydney'),
  ('sabbia-gallery', 'Sabbia Gallery', 'gallery', 'commercial', '3b', 'Glass and ceramics at the highest level.', null, 'Redfern', null, null, -33.893, 151.205, 'Sydney'),
  ('ambush-gallery', 'Ambush Gallery', 'gallery', 'commercial', '3b', 'Street-leaning contemporary at Central Park.', null, 'Chippendale', null, null, -33.887, 151.2, 'Sydney'),
  ('traffic-jam-galleries', 'Traffic Jam Galleries', 'gallery', 'commercial', '3b', 'Lower North Shore contemporary.', null, 'Neutral Bay', null, null, -33.832, 151.218, 'Sydney'),
  ('art2muse', 'Art2Muse', 'gallery', 'commercial', '3b', 'Eastern-suburbs contemporary.', null, 'Double Bay', null, null, -33.877, 151.243, 'Sydney'),
  ('studio-gallery', 'Studio Gallery', 'gallery', 'commercial', '3b', 'Melbourne group with a Sydney room.', null, 'Waterloo', null, null, -33.9, 151.206, 'Sydney'),
  ('badger-fox-gallery', 'Badger & Fox Gallery', 'gallery', 'commercial', '3b', 'Contemporary rooms off Crown Street.', null, 'Surry Hills', null, null, -33.886, 151.212, 'Sydney'),
  ('goodspace', 'Goodspace', 'gallery', 'commercial', '3b', 'Young, fast-moving program.', null, 'Chippendale', null, null, -33.887, 151.199, 'Sydney'),
  ('sno-contemporary-art-projects', 'SNO Contemporary Art Projects', 'ari', 'ari', '4', 'Non-objective art, uncompromising.', null, 'Marrickville', null, null, -33.907, 151.156, 'Sydney'),
  ('knulp', 'Knulp', 'ari', 'ari', '4', 'Tiny, deeply insider artist-run space.', null, 'Sydney', null, null, -33.89, 151.19, 'Sydney'),
  ('harrington-street-gallery', 'Harrington Street Gallery', 'ari', 'ari', '4', 'Sydney''s oldest artists'' co-operative.', null, 'Chippendale', null, null, -33.887, 151.198, 'Sydney'),
  ('art-leven', 'Art Leven', 'gallery', 'first_nations', '3', 'The oldest specialist First Nations gallery, formerly Cooee Art.', null, 'Redfern', null, null, -33.893, 151.204, 'Sydney'),
  ('kate-owen-gallery', 'Kate Owen Gallery', 'gallery', 'first_nations', '3', 'Three floors of Aboriginal art.', null, 'Rozelle', 'https://www.kateowengallery.com', null, -33.861, 151.171, 'Sydney'),
  ('aboriginal-contemporary', 'Aboriginal Contemporary', 'gallery', 'first_nations', '3', 'Community-sourced work from the deserts and the Top End.', null, 'Bronte', null, null, -33.905, 151.264, 'Sydney'),
  ('gannon-house-gallery', 'Gannon House Gallery', 'gallery', 'first_nations', '3', 'Aboriginal and Australian art in The Rocks.', null, 'The Rocks', null, null, -33.859, 151.209, 'Sydney'),
  ('spirit-gallery', 'Spirit Gallery', 'gallery', 'first_nations', '3', 'Accessible First Nations art and objects.', null, 'The Rocks', null, null, -33.859, 151.209, 'Sydney'),
  ('apy-gallery', 'APY Gallery', 'gallery', 'first_nations', '3', 'Artist-owned gallery of the APY Lands studios.', null, 'Darlinghurst', null, null, -33.879, 151.217, 'Sydney'),
  ('d-lan-contemporary', 'D''Lan Contemporary', 'gallery', 'first_nations', '3', 'Blue-chip secondary market for First Nations masters.', null, 'Sydney', null, null, -33.87, 151.21, 'Sydney'),
  ('wollongong-art-gallery', 'Wollongong Art Gallery', 'gallery', 'day_trip', '2', 'The largest regional gallery south of Sydney.', null, 'Wollongong', null, null, -34.424, 150.893, 'Sydney'),
  ('ngununggula', 'Ngununggula', 'gallery', 'day_trip', '2', 'Southern Highlands regional with a sharp program.', null, 'Bowral', 'https://ngununggula.com', null, -34.478, 150.42, 'Sydney'),
  ('bundanon', 'Bundanon', 'museum', 'day_trip', '1', 'Arthur Boyd''s gift - art museum and the Kerstin Thompson bridge in the bush.', null, 'Illaroo', 'https://www.bundanon.com.au', null, -34.85, 150.51, 'Sydney'),
  ('blue-mountains-cultural-centre', 'Blue Mountains Cultural Centre', 'gallery', 'day_trip', '2', 'Regional gallery with an escarpment view.', null, 'Katoomba', null, null, -33.712, 150.312, 'Sydney'),
  ('newcastle-art-gallery', 'Newcastle Art Gallery', 'gallery', 'day_trip', '2', 'Reopened after a major expansion.', null, 'Newcastle', null, null, -32.928, 151.771, 'Sydney'),
  ('the-lock-up', 'The Lock-Up', 'gallery', 'day_trip', '2', 'Contemporary art in the old police lock-up.', null, 'Newcastle', null, null, -32.927, 151.779, 'Sydney'),
  ('maitland-regional-art-gallery', 'Maitland Regional Art Gallery', 'gallery', 'day_trip', '2', 'Hunter Valley regional with generous programming.', null, 'Maitland', null, null, -32.733, 151.557, 'Sydney'),
  ('gosford-regional-gallery', 'Gosford Regional Gallery', 'gallery', 'day_trip', '2', 'Central Coast gallery with the Edogawa garden.', null, 'Gosford', null, null, -33.426, 151.342, 'Sydney'),
  ('smith-singer', 'Smith & Singer', 'gallery', 'auction', '3', 'Sotheby''s-licensed auction house.', null, 'Sydney', null, null, -33.869, 151.21, 'Sydney'),
  ('deutscher-and-hackett', 'Deutscher and Hackett', 'gallery', 'auction', '3', 'Major Australian art auctions.', null, 'Paddington', null, null, -33.884, 151.226, 'Sydney'),
  ('menzies', 'Menzies', 'gallery', 'auction', '3', 'Australian and international art auctions.', null, 'Kensington', null, null, -33.92, 151.222, 'Sydney'),
  ('shapiro-auctioneers', 'Shapiro Auctioneers', 'gallery', 'auction', '3', 'Art, design and decorative arts.', null, 'Woollahra', null, null, -33.888, 151.24, 'Sydney'),
  ('bonhams-australia', 'Bonhams Australia', 'gallery', 'auction', '3', 'International house, Australian salerooms.', null, 'Double Bay', null, null, -33.877, 151.243, 'Sydney'),
  ('leonard-joel-sydney', 'Leonard Joel Sydney', 'gallery', 'auction', '3', 'Auctions across art and objects.', null, 'Woollahra', null, null, -33.888, 151.24, 'Sydney')
on conflict (slug) do update set
  name = excluded.name, type = excluded.type, category = excluded.category,
  tier = excluded.tier, editorial_note = excluded.editorial_note,
  suburb = excluded.suburb, website = coalesce(excluded.website, venues.website),
  latitude = excluded.latitude, longitude = excluded.longitude, city = excluded.city;

-- closed per the v2 register: archive, never delete
update venues set status = 'archived', verification_source = 'owner register v2'
  where slug in ('may-space', 'liverpool-street-gallery');

-- ---------------------------------------------------------------------------
-- Opening hours — verified against the venues' own sites on 2026-07-21.
-- (Requires migration 0009_opening_hours.sql.)
-- ---------------------------------------------------------------------------
update venues set opening_hours = x.hours, hours_checked = date '2026-07-21'
from (values
  ('art-gallery-of-new-south-wales', 'Daily 10:00–17:00, Wed until 22:00'),
  ('mca-australia',                  'Wed–Mon 10:00–17:00, closed Tue'),
  ('white-rabbit-gallery',           'Wed–Sun 10:00–17:00'),
  ('artspace',                       'Tue–Sun 11:00–17:00'),
  ('chau-chak-wing-museum',          'Mon–Fri 10:00–17:00, Sat–Sun 12:00–16:00'),
  ('sh-ervin-gallery',               'Tue–Sun 11:00–17:00'),
  ('mosman-art-gallery',             'Daily 10:00–17:00'),
  ('manly-art-gallery-museum',       'Tue–Sun 10:00–17:00'),
  ('campbelltown-arts-centre',       'Daily 10:00–16:00'),
  ('firstdraft',                     'Wed 11:00–20:00, Thu–Sat 11:00–17:00'),
  ('king-street-gallery',            'Tue–Sat 10:00–18:00'),
  ('olsen-gallery',                  'Tue–Fri 10:00–18:00, Sat 10:00–17:00'),
  ('roslyn-oxley9-gallery',          'Tue–Fri 10:00–18:00, Sat 11:00–18:00')
) as x(slug, hours)
where venues.slug = x.slug;

-- These three predate the slug backfill in some databases — match by name.
update venues set opening_hours = x.hours, hours_checked = date '2026-07-21'
from (values
  ('Cassandra Bird',                 'Tue–Fri 10:00–17:00, Sat 11:00–17:00'),
  ('Ames Yavuz',                     'Tue–Sat 10:00–18:00'),
  ('Grace Cossington Smith Gallery', 'Tue–Sat 10:00–17:00 (during exhibitions)')
) as x(name, hours)
where venues.name = x.name;


-- ---------------------------------------------------------------------------
-- Venue photography — freely licensed (Wikimedia Commons), verified 2026-07-21.
-- Served via Special:FilePath at 1600px. Only set where no photo exists yet,
-- so venue-uploaded photos are never overwritten.
-- ---------------------------------------------------------------------------
update venues set image_url = x.url
from (values
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


-- ---------------------------------------------------------------------------
-- Website / Instagram completion pass, verified 2026-07-21 — fills gaps in
-- the register so nearly every venue has at least one live link.
-- ---------------------------------------------------------------------------
update venues set
  website = coalesce(venues.website, x.website),
  instagram = coalesce(venues.instagram, x.instagram)
from (values
  ('cassandra-bird', 'https://www.cassandrabird.com/', '@cassandrabird.gallery'),
  ('1301sw', 'https://www.1301sw.com/', '@1301sw_au'),
  ('ames-yavuz', 'https://amesyavuz.com/', '@amesyavuz'),
  ('olsen-annexe', 'https://www.olsengallery.com/', '@olsen_annexe'),
  ('grace-cossington-smith-gallery', null, '@gcsgallery'),
  ('wagner-contemporary', 'https://wagnercontemporary.com.au/', '@wagnercontemporary'),
  ('piermarq', 'https://www.piermarq.com.au/', '@piermarqart'),
  ('gallery-sally-dan-cuthbert', 'https://gallerysallydancuthbert.com/', '@gallerysallydancuthbert'),
  ('annette-larkin-fine-art', 'https://annettelarkin.com/', '@annettelarkinfineart'),
  ('maunsell-wickes', 'https://maunsellwickes.com/', '@maunsellwickesgallery'),
  ('richard-martin-art', 'https://www.richardmartinart.com.au/', null),
  ('harvey-galleries', 'https://harveygalleries.com.au/', '@harveygalleries'),
  ('jerico-contemporary', 'http://www.jericocontemporary.com/', '@jerico_contemporary'),
  ('m-contemporary', 'https://mcontemp.com/', '@mcontemporary'),
  ('stanley-street-gallery', 'https://stanleystreetgallery.com.au/', '@stanley_street_gallery'),
  ('roslyn-oxley9-gallery', null, '@roslynoxley9'),
  ('curatorial-co', 'https://curatorialandco.com', '@curatorialandco'),
  ('flinders-street-gallery', 'https://www.flindersstreetgallery.com', '@flindersstgallery'),
  ('black-eye-gallery', 'https://blackeyegallery.com.au', '@blackeyegallery'),
  ('gaffa-gallery', 'https://www.gaffa.com.au', '@gaffagallery'),
  ('sabbia-gallery', 'https://sabbiagallery.com', '@sabbiagallery'),
  ('ambush-gallery', 'https://ambushgallery.com', '@ambushgallery'),
  ('traffic-jam-galleries', 'https://trafficjamgalleries.com', '@trafficjamgalleries'),
  ('art2muse', 'https://art2muse.com.au', '@art2muse'),
  ('studio-gallery', null, '@studiogallerygroup'),
  ('badger-fox-gallery', 'https://badgerandfoxgallery.com', '@badfox201'),
  ('goodspace', null, '@goodspacegallery'),
  ('sno-contemporary-art-projects', 'http://www.sno.org.au', null),
  ('knulp', 'http://www.knulps.org', '@knulpknulpknulp'),
  ('harrington-street-gallery', 'http://www.harringtonstreetgallery.com', '@theharringtonstreetartscentre'),
  ('art-leven', 'https://www.cooeeart.com.au', '@art.leven'),
  ('aboriginal-contemporary', 'https://www.aboriginalcontemporary.com.au', '@aboriginal.contemporary'),
  ('brett-whiteley-studio', 'https://www.brettwhiteley.org/', '@brettwhiteleystudio'),
  ('customs-house', 'https://www.sydneycustomshouse.com.au/', null),
  ('old-government-house', 'https://www.nationaltrust.org.au/places/old-government-house/', null),
  ('macquarie-university-art-gallery', 'https://www.mq.edu.au/about/facilities/museums-collections/macquarie-university-art-gallery', null),
  ('margaret-whitlam-galleries', 'https://www.whitlam.org/mwg', null),
  ('the-cross-art-projects', 'https://www.crossart.com.au/', '@thecrossartprojects'),
  ('bondi-pavilion-gallery', 'https://www.bondipavilion.com.au/discover/creative_spaces/art_gallery', '@bondipavilionofficial'),
  ('art-space-on-the-concourse', 'https://www.willoughby.nsw.gov.au/Council/Venues/Art-Space-Gallery-The-Concourse', null),
  ('juniper-hall', 'https://moranarts.org.au/galleries/', null),
  ('artbank', 'https://www.artbank.gov.au/', '@artbankau'),
  ('hawkesbury-regional-gallery', 'https://www.hawkesbury.nsw.gov.au/gallery', '@hawkesburyregional_gallery'),
  ('hurstville-museum-gallery', 'https://www.georgesriver.nsw.gov.au/Community/Art-and-Culture/Hurstville-Museum-Gallery', '@hurstvillemuseumgallery'),
  ('peacock-gallery', 'https://www.cumberland.nsw.gov.au/peacock-gallery', null),
  ('museums-discovery-centre', 'https://powerhouse.com.au/visit/castle-hill', null),
  ('delmar-gallery', 'https://www.trinity.nsw.edu.au/community/delmar-gallery/', '@delmargallery'),
  ('gannon-house-gallery', 'https://gannonhousegallery.com/', '@gannonhouse'),
  ('spirit-gallery', 'https://www.spiritgallery.com.au/', null),
  ('apy-gallery', 'https://www.apygallery.com/', null),
  ('the-commercial', 'https://www.thecommercialgallery.com/', null),
  ('defiance-gallery', null, '@defiancegallery'),
  ('kate-owen-gallery', null, '@kateowengallery'),
  ('16albermarle', null, '@16albermarleprojectspace'),
  ('woollahra-gallery', null, '@woollahragallery'),
  ('hyde-park-barracks', null, '@museumsofhistorynsw'),
  ('justice-police-museum', null, '@museumsofhistorynsw'),
  ('state-library-of-nsw-galleries', null, '@statelibrarynsw'),
  ('australian-national-maritime-museum', null, '@sea.museum'),
  ('rose-seidler-house', null, '@museumsofhistorynsw'),
  ('vaucluse-house', null, '@estatevauclusehouse'),
  ('elizabeth-bay-house', null, '@museumsofhistorynsw'),
  ('ngununggula', null, '@ngununggula'),
  ('bundanon', null, '@bundanontrust'),
  ('wollongong-art-gallery', 'https://wollongongartgallery.au', '@wollongongartgallery'),
  ('blue-mountains-cultural-centre', 'https://bluemountainsculturalcentre.com.au', '@bluemountainsculturalcentre'),
  ('newcastle-art-gallery', 'https://newcastleartgallery.nsw.gov.au', '@newcastleartgalleryaustralia'),
  ('the-lock-up', 'https://thelockup.org.au', '@thelockupartspace'),
  ('maitland-regional-art-gallery', 'https://www.mrag.org.au', '@maitlandregionalartgallery'),
  ('gosford-regional-gallery', 'https://gosfordregionalgallery.com', '@gosfordregionalgallery'),
  ('smith-singer', 'https://www.smithandsinger.com.au', '@smith_singer'),
  ('deutscher-and-hackett', 'https://www.deutscherandhackett.com', '@deutscherandhackett'),
  ('menzies', 'https://www.menziesartbrands.com', '@menziesauctions'),
  ('shapiro-auctioneers', 'https://www.shapiro.com.au', '@shapirosydney'),
  ('bonhams-australia', 'https://www.bonhams.com/location/SYD/sydney/', '@bonhams1793'),
  ('leonard-joel-sydney', 'https://www.leonardjoel.com.au', '@leonardjoelauctions')
) as x(slug, website, instagram)
where venues.slug = x.slug;
