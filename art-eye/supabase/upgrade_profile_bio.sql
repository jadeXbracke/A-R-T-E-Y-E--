-- Adds a short bio and a profile photo to profiles. One paste in the SQL
-- Editor. Safe to run more than once.
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists avatar_url text;
