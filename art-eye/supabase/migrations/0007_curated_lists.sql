-- 0007 — public curated lists on top of the guides tables.
-- A guide can now be published as a curated list by an artist, gallerist or
-- the editors: flag it is_public and it appears in the app's CURATED strip.
-- Private guides keep their existing owner-only policies.

alter table guides
  add column if not exists is_public    boolean not null default false,
  add column if not exists curator_name text,
  add column if not exists curator_role text not null default 'curator';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'guides_curator_role_check') then
    alter table guides add constraint guides_curator_role_check
      check (curator_role in ('artist', 'gallerist', 'curator'));
  end if;
end $$;

drop policy if exists "guides: public read" on guides;
create policy "guides: public read" on guides for select using (is_public = true);

drop policy if exists "guide_items: public read" on guide_items;
create policy "guide_items: public read" on guide_items for select using (
  exists (select 1 from guides g where g.id = guide_id and g.is_public = true)
);

-- The host publishes/curates lists (venue owners' and artists' picks are
-- entered via their own guides and flagged public by the host).
drop policy if exists "guides: admin all" on guides;
create policy "guides: admin all" on guides for all using (is_admin()) with check (is_admin());
drop policy if exists "guide_items: admin all" on guide_items;
create policy "guide_items: admin all" on guide_items for all using (is_admin()) with check (is_admin());
