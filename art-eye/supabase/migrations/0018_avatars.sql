-- 0018 — profile avatars. A single public image url per profile, stored in
-- the existing exhibition-images bucket via the app's upload path.

alter table profiles
  add column if not exists avatar_url text;
