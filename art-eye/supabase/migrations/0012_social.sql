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
