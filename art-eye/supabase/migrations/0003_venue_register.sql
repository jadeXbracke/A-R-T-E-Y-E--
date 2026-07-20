-- Venue register: turn the thin venues table into a managed Sydney register.
-- Adds slug / suburb / website / instagram / lat-long / is_claimed / is_fixture,
-- auto-generates slugs, and guarantees fixture/test data can never reach the
-- public feed (enforced in RLS, so it holds regardless of the client query).
--
-- exhibitions.venue_id already exists as a NOT NULL foreign key (see 0001),
-- so there is no exhibition→venue migration to run here — only the fixture flag.

-- ---------------------------------------------------------------- columns
alter table venues
  add column if not exists slug       text,
  add column if not exists suburb     text,
  add column if not exists website    text,
  add column if not exists instagram  text,
  add column if not exists latitude   double precision,
  add column if not exists longitude  double precision,
  add column if not exists is_claimed boolean not null default false,
  add column if not exists is_fixture boolean not null default false;

-- test/fixture exhibitions (e.g. rows created while trying the app) can be
-- hidden even when they sit at a real venue.
alter table exhibitions
  add column if not exists is_fixture boolean not null default false;

-- a claimed venue is one an owner account is attached to
update venues set is_claimed = true where owner_user_id is not null;

-- ---------------------------------------------------------------- slugs
-- lower-case, hyphenated, ascii-only handle used in urls and for seed upserts.
create or replace function slugify(txt text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- new venues (incl. those created from a submission) get a unique slug for free.
create or replace function venue_set_slug() returns trigger
language plpgsql as $$
declare base text; candidate text; n int := 0;
begin
  if new.slug is null or new.slug = '' then
    base := slugify(new.name);
    if base = '' then base := 'venue'; end if;
    candidate := base;
    while exists (select 1 from venues where slug = candidate and id <> new.id) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists venue_slug_before_write on venues;
create trigger venue_slug_before_write
  before insert or update of name, slug on venues
  for each row execute function venue_set_slug();

-- backfill slugs for every existing venue, resolving any collisions.
do $$
declare r record; base text; candidate text; n int;
begin
  for r in select id, name from venues where slug is null or slug = '' loop
    base := slugify(r.name);
    if base = '' then base := 'venue'; end if;
    candidate := base; n := 0;
    while exists (select 1 from venues where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    update venues set slug = candidate where id = r.id;
  end loop;
end $$;

alter table venues alter column slug set not null;
create unique index if not exists venues_slug_key on venues (slug);

-- ---------------------------------------------------------------- public feed guard
-- Fixtures are invisible to the public directory and agenda. Owners still see
-- their own venue; admins see everything. Because this lives in RLS, a fixture
-- row cannot leak into the feed even if a client forgets to filter it.
drop policy if exists "venues: public read" on venues;
create policy "venues: public read" on venues for select using (
  is_fixture = false
  or owner_user_id = auth.uid()
  or is_admin()
);

drop policy if exists "exhibitions: approved read" on exhibitions;
create policy "exhibitions: approved read" on exhibitions for select using (
  (status = 'approved' and is_fixture = false)
  or is_admin()
  or exists (select 1 from venues v where v.id = venue_id and v.owner_user_id = auth.uid())
);
