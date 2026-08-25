-- In-app account deletion (GDPR article 17, and required by Apple).
--
-- The client cannot delete an auth user with the anon key, so this runs as a
-- security-definer function that only ever deletes the caller's own user.
-- Every table references auth.users with `on delete cascade`, so removing
-- the user removes all of their rows in one transaction.
--
-- Run once, after setup_1_schema.sql.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in.';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
