-- 0017 — Feedback to the app owner.
-- Anyone (signed in or not) can write a note to the owner: general feedback,
-- or a "something is missing/wrong" report attached to a venue or exhibition.
-- Only the admin reads the inbox and marks items handled.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('general', 'venue', 'exhibition')),
  subject_id uuid,          -- venue/exhibition id; no FK so reports survive deletes
  subject_name text,        -- denormalised label for the inbox
  text text not null check (char_length(text) between 1 and 4000),
  sender_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'done'))
);
create index if not exists feedback_status_idx on feedback (status, created_at desc);

alter table feedback enable row level security;

-- Anyone may submit; you can only sign it as yourself (or leave it unsigned).
drop policy if exists "feedback: anyone submits" on feedback;
create policy "feedback: anyone submits" on feedback for insert
  with check (sender_id is null or sender_id = auth.uid());

-- Only the owner reads and updates the inbox.
drop policy if exists "feedback: admin reads" on feedback;
create policy "feedback: admin reads" on feedback for select using (is_admin());
drop policy if exists "feedback: admin updates" on feedback;
create policy "feedback: admin updates" on feedback for update
  using (is_admin()) with check (is_admin());
