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
