-- Host controls: give the admin (the host account) full ownership of what is
-- in the app, and make sure nobody else can reach these powers.
--
-- "Host" == the account whose profile.role = 'admin'. That role can only be
-- granted directly in the database (signup metadata is limited to 'user' /
-- 'venue_owner'), so admin rights cannot be self-assigned from the app.
--
-- Every policy below is gated on is_admin(); the matching app screens are gated
-- on profile.role === 'admin'. Both layers must agree before anything happens.

-- venues: the host may create, edit and delete any venue.
-- (public/anon insert of a submitted venue and owner self-edit already exist.)
drop policy if exists "venues: admin delete" on venues;
create policy "venues: admin delete" on venues for delete using (is_admin());

drop policy if exists "venues: admin insert" on venues;
create policy "venues: admin insert" on venues for insert with check (is_admin());

-- exhibitions: the host may publish directly (any status, may feature) and
-- delete anything. The existing public "pending insert" policy stays for
-- ordinary submissions; this adds an unrestricted admin path alongside it.
drop policy if exists "exhibitions: admin insert" on exhibitions;
create policy "exhibitions: admin insert" on exhibitions for insert with check (is_admin());

-- ("exhibitions: owner or admin update" and "exhibitions: admin delete" already
--  grant the host edit + delete rights — see 0001_init.sql.)
