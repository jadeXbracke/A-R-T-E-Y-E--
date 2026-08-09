-- 0014 — engagement: likes and comments on posts, and direct messages.
-- A "post" is a visit log, keyed (user_id, exhibition_id) in user_visits.
-- Likes/comments follow the post's visibility rules: you can engage with a
-- post if you could see it in a feed (owner, public profile, or accepted
-- follower). Messages are strictly between their two parties.

-- Reused visibility predicate: can the caller see posts by post_owner?
create or replace function can_view_posts_of(post_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select post_owner = auth.uid()
    or exists (select 1 from profiles p where p.id = post_owner and p.is_private = false)
    or exists (
      select 1 from follows f
      where f.followee_id = post_owner and f.follower_id = auth.uid() and f.status = 'accepted'
    )
    or is_admin();
$$;

-- ---- likes ------------------------------------------------------------------
create table if not exists post_likes (
  post_user_id uuid not null,
  exhibition_id uuid not null,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_user_id, exhibition_id, user_id),
  foreign key (post_user_id, exhibition_id)
    references user_visits (user_id, exhibition_id) on delete cascade
);

create index if not exists post_likes_post_idx on post_likes (post_user_id, exhibition_id);

alter table post_likes enable row level security;

drop policy if exists "likes: visible read" on post_likes;
create policy "likes: visible read" on post_likes for select
  using (can_view_posts_of(post_user_id));

drop policy if exists "likes: own insert" on post_likes;
create policy "likes: own insert" on post_likes for insert
  with check (user_id = auth.uid() and can_view_posts_of(post_user_id));

drop policy if exists "likes: own delete" on post_likes;
create policy "likes: own delete" on post_likes for delete
  using (user_id = auth.uid());

-- ---- comments ---------------------------------------------------------------
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_user_id uuid not null,
  exhibition_id uuid not null,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  foreign key (post_user_id, exhibition_id)
    references user_visits (user_id, exhibition_id) on delete cascade
);

create index if not exists post_comments_post_idx on post_comments (post_user_id, exhibition_id, created_at);

alter table post_comments enable row level security;

drop policy if exists "comments: visible read" on post_comments;
create policy "comments: visible read" on post_comments for select
  using (can_view_posts_of(post_user_id));

drop policy if exists "comments: own insert" on post_comments;
create policy "comments: own insert" on post_comments for insert
  with check (user_id = auth.uid() and can_view_posts_of(post_user_id));

-- The commenter can remove their comment; the post owner can moderate theirs.
drop policy if exists "comments: own delete" on post_comments;
create policy "comments: own delete" on post_comments for delete
  using (user_id = auth.uid() or post_user_id = auth.uid());

-- ---- direct messages --------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);

create index if not exists messages_recipient_idx on messages (recipient_id, created_at desc);
create index if not exists messages_sender_idx on messages (sender_id, created_at desc);

alter table messages enable row level security;

-- Only the two parties can read a message.
drop policy if exists "messages: party read" on messages;
create policy "messages: party read" on messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "messages: own send" on messages;
create policy "messages: own send" on messages for insert
  with check (sender_id = auth.uid());

-- Only the recipient updates a message, and only to mark it read.
drop policy if exists "messages: recipient read-receipt" on messages;
create policy "messages: recipient read-receipt" on messages for update
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
