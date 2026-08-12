-- 0016 — Direct messages between mutual follows.
-- A thread is the pair (sender, recipient) in both directions; messaging is
-- only possible when both directions of the follow are accepted, enforced by
-- RLS so the client cannot bypass the rule.

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);
create index if not exists direct_messages_pair_idx
  on direct_messages (sender_id, recipient_id, created_at);
create index if not exists direct_messages_unread_idx
  on direct_messages (recipient_id) where read_at is null;

alter table direct_messages enable row level security;

-- Both directions of the follow accepted — the mutual-follow gate.
create or replace function follows_each_other(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from follows f
    where f.follower_id = a and f.followee_id = b and f.status = 'accepted'
  ) and exists (
    select 1 from follows f
    where f.follower_id = b and f.followee_id = a and f.status = 'accepted'
  );
$$;

-- Only the two participants can read a thread.
drop policy if exists "dm: participants read" on direct_messages;
create policy "dm: participants read" on direct_messages for select
  using (auth.uid() in (sender_id, recipient_id));

-- You send as yourself, and only to someone who follows you back.
drop policy if exists "dm: send to mutuals" on direct_messages;
create policy "dm: send to mutuals" on direct_messages for insert
  with check (sender_id = auth.uid() and follows_each_other(sender_id, recipient_id));

-- The recipient may update (used to set read_at when opening the thread).
drop policy if exists "dm: recipient marks read" on direct_messages;
create policy "dm: recipient marks read" on direct_messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
