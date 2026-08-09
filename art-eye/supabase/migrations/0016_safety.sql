-- 0016 — safety: blocking, reporting and account deletion.
-- Required for app-store review of any app with accounts and user content.

-- ---- blocks -----------------------------------------------------------------
create table if not exists blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table blocks enable row level security;

-- Only the blocker sees and manages their own block list.
drop policy if exists "blocks: own" on blocks;
create policy "blocks: own" on blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- A block severs messaging in both directions: replace the send policy so a
-- message can't be sent when either party has blocked the other.
drop policy if exists "messages: own send" on messages;
create policy "messages: own send" on messages for insert
  with check (
    sender_id = auth.uid()
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = recipient_id and b.blocked_id = sender_id)
         or (b.blocker_id = sender_id and b.blocked_id = recipient_id)
    )
  );

-- ---- reports ----------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  kind text not null check (kind in ('post', 'comment', 'profile')),
  subject_user_id uuid not null references profiles (id) on delete cascade,
  exhibition_id uuid, -- for kind = 'post': the post is (subject_user_id, exhibition_id)
  comment_id uuid,    -- for kind = 'comment'
  reason text not null check (char_length(reason) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

drop policy if exists "reports: own insert" on reports;
create policy "reports: own insert" on reports for insert
  with check (reporter_id = auth.uid());

-- Only the host reads the report queue.
drop policy if exists "reports: admin read" on reports;
create policy "reports: admin read" on reports for select
  using (is_admin());

-- ---- account deletion -------------------------------------------------------
-- Deleting the auth user cascades through profiles into every table that
-- references it (visits, follows, likes, comments, messages, blocks, reports).
create or replace function delete_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function delete_account() from public;
grant execute on function delete_account() to authenticated;
