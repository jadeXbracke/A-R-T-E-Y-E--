-- 0008 — moving backgrounds: optional short video clips on venues and
-- exhibitions. Supplied by the host or a claimed venue account; the app plays
-- them as muted, looping backdrops (hero carousel, venue page, exhibition
-- page). Where no clip exists the app animates the editorial photo instead,
-- so nothing here is required.

alter table public.venues
  add column if not exists video_url text;

alter table public.exhibitions
  add column if not exists video_url text;
