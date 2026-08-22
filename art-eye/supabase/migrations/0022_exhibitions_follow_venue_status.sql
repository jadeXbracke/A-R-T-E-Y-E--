-- 0022 — a show is only public while its venue is.
--
-- The venues policy (0005) drops archived and pending venues from the public
-- feed, but the exhibitions policy never looked at the venue at all. So a show
-- left over from an earlier seed run, or approved before a venue closed, stayed
-- readable while its venue row was hidden — the card renders with no venue
-- behind it. Archiving a venue now takes its shows with it.
--
-- The owner and admin branches are unchanged: an owner still sees everything at
-- their own venue, whatever its status.

drop policy if exists "exhibitions: approved read" on exhibitions;
create policy "exhibitions: approved read" on exhibitions for select using (
  (
    status = 'approved'
    and is_fixture = false
    and exists (
      select 1 from venues v
      where v.id = venue_id and v.is_fixture = false and v.status = 'active'
    )
  )
  or is_admin()
  or exists (select 1 from venues v where v.id = venue_id and v.owner_user_id = auth.uid())
);
