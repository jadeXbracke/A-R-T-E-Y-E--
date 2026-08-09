-- 0017 — art-medium categorisation on exhibitions.
-- Free multi-tag from a fixed vocabulary (painting, photography, sculpture…),
-- used by the agenda's filter panel. Untagged shows simply don't match a
-- medium filter; they still appear when no filter is active.

alter table exhibitions
  add column if not exists mediums text[] not null default '{}';
