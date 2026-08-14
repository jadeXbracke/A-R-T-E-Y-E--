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
