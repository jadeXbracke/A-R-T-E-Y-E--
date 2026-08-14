-- 0020 — a still photo alternative to the existing video clip on a post
-- (0013_post_video.sql). A post carries one or the other, never both.

alter table user_visits
  add column if not exists photo_url text;
