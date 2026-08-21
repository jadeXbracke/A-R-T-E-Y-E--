-- 0021 — the two venue facts the app already renders but the database never had.
--
-- venue-meta.ts builds the description block from type, founding year and entry
-- price. `free_entry` arrived with the register, but `founded_year` and
-- `entry_checked` existed only in the bundled demo seed — so in live mode the
-- founding year silently disappeared and the "checked on" date with it.

alter table venues
  add column if not exists founded_year  int,
  add column if not exists entry_checked date;

comment on column venues.founded_year is
  'Year the venue was established — verified, else null.';
comment on column venues.entry_checked is
  'Date the type / founded / entry facts were last verified.';
