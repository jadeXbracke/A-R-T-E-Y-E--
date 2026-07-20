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
