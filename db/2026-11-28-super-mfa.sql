-- Super admin needs a fresh authenticator (TOTP) verification, enforced in the database.
-- A session counts as super only when its token is aal2 AND a TOTP step happened
-- within the last 60 minutes (amr claim). Password, stolen phone or stolen token
-- alone is never enough once that hour passes.
create or replace function public.is_super() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
     and coalesce(auth.jwt()->>'aal','') = 'aal2'
     and exists (
       select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a
       where a->>'method' = 'totp'
         and (a->>'timestamp')::bigint > extract(epoch from now())::bigint - 3600)
$$;

create or replace function public.is_root() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select public.is_super() and exists(select 1 from public.root_admins where user_id = auth.uid())
$$;
