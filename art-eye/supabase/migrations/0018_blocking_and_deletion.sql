-- 0018 — blocking, reports (reuses feedback), account deletion, push tokens.
-- App Store readiness: guideline 1.2 (block + report for user-generated
-- content) and 5.1.1(v) (in-app, self-service account deletion).

create table if not exists blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on blocks (blocked_id);

alter table blocks enable row level security;

-- You can see (and therefore only manage) your own blocklist.
drop policy if exists "blocks: own read" on blocks;
create policy "blocks: own read" on blocks for select using (blocker_id = auth.uid());
drop policy if exists "blocks: own write" on blocks;
create policy "blocks: own write" on blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Bidirectional check used by RLS on posts/messages/etc: true if either side
-- has blocked the other.
create or replace function is_blocked(a uuid, b uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Reports reuse the feedback table (kind: 'profile' | 'post') — widen the
-- check constraint rather than add a parallel moderation table.
alter table feedback drop constraint if exists feedback_kind_check;
alter table feedback add constraint feedback_kind_check
  check (kind in ('general', 'venue', 'exhibition', 'profile', 'post'));

-- A block also ends any existing follow, in either direction.
create or replace function block_user(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if target = auth.uid() then
    raise exception 'cannot block yourself';
  end if;
  insert into blocks (blocker_id, blocked_id) values (auth.uid(), target)
    on conflict (blocker_id, blocked_id) do nothing;
  delete from follows
    where (follower_id = auth.uid() and followee_id = target)
       or (follower_id = target and followee_id = auth.uid());
end;
$$;

-- Fold the block into direct-message visibility: a blocked pair can no
-- longer read or send to each other, on top of the existing mutual-follow
-- gate from 0016.
drop policy if exists "dm: participants read" on direct_messages;
create policy "dm: participants read" on direct_messages for select
  using (auth.uid() in (sender_id, recipient_id) and not is_blocked(sender_id, recipient_id));
drop policy if exists "dm: send to mutuals" on direct_messages;
create policy "dm: send to mutuals" on direct_messages for insert
  with check (
    sender_id = auth.uid()
    and follows_each_other(sender_id, recipient_id)
    and not is_blocked(sender_id, recipient_id)
  );

-- Push notification device tokens: one row per (user, token) so a person
-- signed in on several devices gets pushes on all of them.
create table if not exists push_tokens (
  user_id uuid not null references profiles (id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table push_tokens enable row level security;
drop policy if exists "push_tokens: own" on push_tokens;
create policy "push_tokens: own" on push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Self-service account deletion. SECURITY DEFINER so it can reach
-- auth.users, which the client's anon/authenticated role cannot touch
-- directly; every profiles-referencing table already cascades from
-- profiles.id, which cascades from auth.users.id (0001_init.sql).
create or replace function delete_own_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;

revoke all on function block_user(uuid) from public;
grant execute on function block_user(uuid) to authenticated;
