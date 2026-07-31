-- 0015 — exhibition discovery pipeline.
-- The discover-exhibitions Edge Function reads each venue's own website (plus
-- aggregators) via Claude web_search and files CURRENT/UPCOMING shows here.
-- Nothing publishes automatically: an admin approves a row, which inserts the
-- real exhibition. Same "propose, never apply" principle as the venue pipeline.

create table if not exists exhibition_review_queue (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  title text not null,
  artists text not null default '',
  start_date date,
  end_date date,
  description text not null default '',
  source_url text,                 -- where it was found (the venue's page)
  confidence numeric not null default 0.5 check (confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists exq_status_idx on exhibition_review_queue (status);
create index if not exists exq_venue_idx on exhibition_review_queue (venue_id);

alter table exhibition_review_queue enable row level security;
drop policy if exists "exq: admin all" on exhibition_review_queue;
create policy "exq: admin all" on exhibition_review_queue for all
  using (is_admin()) with check (is_admin());

-- Approve a queued exhibition: insert the real show and mark the row approved.
-- SECURITY DEFINER so an admin can call it via RPC; guarded by is_admin().
create or replace function approve_exhibition_proposal(qid uuid)
returns uuid language plpgsql security definer as $$
declare q exhibition_review_queue;
        new_id uuid;
begin
  if not is_admin() then raise exception 'not authorised'; end if;
  select * into q from exhibition_review_queue where id = qid and status = 'pending';
  if not found then raise exception 'proposal not found or already handled'; end if;

  insert into exhibitions (venue_id, title, artists, start_date, end_date, description, image_source, status, is_featured, city)
  values (q.venue_id, q.title, q.artists,
          coalesce(q.start_date, current_date), coalesce(q.end_date, current_date),
          q.description, q.source_url, 'approved', false, 'Sydney')
  returning id into new_id;

  update exhibition_review_queue set status = 'approved', reviewed_at = now() where id = qid;
  return new_id;
end $$;
