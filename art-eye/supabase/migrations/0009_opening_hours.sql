-- 0009 — opening hours on the venue register.
-- opening_hours holds the compact human line shown on the venue page
-- (e.g. "Tue–Sat 10:00–17:00"); hours_checked records when it was last
-- verified against the venue's own website, so stale hours are visible.
-- Kept as text on purpose: gallery hours are irregular (appointment-only,
-- seasonal closures) and a structured schema would lie more than it helps.

alter table public.venues
  add column if not exists opening_hours text,
  add column if not exists hours_checked date;
