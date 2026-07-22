-- 0013 — short video clips on user posts (visit logs).
-- Reuses the existing exhibition-images storage bucket and the app's expo-video
-- player; only a nullable url column is needed on the visits table.

alter table user_visits
  add column if not exists video_url text;
