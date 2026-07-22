-- 0011 — Instagram Reel / TikTok links on venues and exhibitions.
-- reel_url is just a link to a post the venue or gallery already published —
-- tapping it opens the Reel/TikTok itself (Linking.openURL), never an
-- embedded scrape. Kept deliberately separate from video_url (a direct .mp4
-- used as a moving background) since a social post and a raw clip serve
-- different purposes in the app.

alter table public.venues
  add column if not exists reel_url text;

alter table public.exhibitions
  add column if not exists reel_url text;
