-- 0015 — photos become the main component of a post (visit log).
-- Multiple photos per post, stored as public URLs in the existing
-- exhibition-images bucket (same upload path as video clips).

alter table user_visits
  add column if not exists photo_urls text[] not null default '{}';
