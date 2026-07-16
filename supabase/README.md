# ART EYE — Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run in order:
   - `migrations/0001_init.sql` — schema, triggers, row-level security
   - `migrations/0002_storage.sql` — public `exhibition-images` bucket
   - `seed.sql` — 8 Sydney venues + 13 real July-2026 exhibitions
3. In Authentication → Providers, enable **Email** (disable "Confirm email"
   for the smoothest demo, or keep it on for production).
4. Copy the project URL and anon key into `.env` (see `.env.example`).

## Admin account

`jadebrack@gmail.com` is promoted to **admin** automatically on signup by the
`handle_new_user` trigger. If that account already exists, run:

```sql
update public.users set role = 'admin'
where id = (select id from auth.users where email = 'jadebrack@gmail.com');
```

## Approval flow & security model

- Every submission (venue owner **or** anonymous public form) is inserted with
  `status = 'pending'` and `is_featured = false`; RLS makes any other insert
  impossible. Nothing auto-publishes.
- The public agenda only ever reads `status = 'approved'` rows (enforced by
  RLS, not just the client).
- Venue owners can read/edit only their **own** pending submissions.
- `user_watchlist` / `user_visits` are RLS-locked to the owning user — venue
  accounts can never read individual user rows; any venue-facing analytics
  must be built on aggregates.
- Signup metadata can request `user` or `venue_owner`; `admin` requested from
  the client is ignored, and a trigger blocks self-service role changes.
- `city` exists on venues and exhibitions from day one (default `Sydney`), so
  a second city is a data task, not a rebuild. The `guides` / `guide_items`
  tables are a phase-2 stub for user-curated city guides.

## Images

Seed rows use neutral placeholder images. To use venue press images, update
`image_url` on the relevant `exhibitions` rows (or upload to the
`exhibition-images` bucket and use its public URL).
