-- 1. No email-based auto admin on signup. Super admin is set only by set_super (root only).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email, 'student');
  return new;
end $$;

-- 2. rate_hit only works for the Worker, which sends a shared secret header.
create table if not exists public.rate_secret (id int primary key default 1 check (id = 1), v text not null);
alter table public.rate_secret enable row level security;
revoke all on public.rate_secret from anon, authenticated;

create or replace function public.rate_hit(p_key text, p_cap integer, p_window_ms integer) returns boolean
language plpgsql security definer set search_path to 'public' as $$
declare
  v_now timestamptz := now();
  v_hits timestamptz[];
  v_hdr text := coalesce(current_setting('request.headers', true), '{}')::json->>'x-azu-rl';
begin
  if v_hdr is null or v_hdr <> (select v from public.rate_secret where id = 1) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_cap < 1 or p_cap > 100000 or p_window_ms < 1000 or p_window_ms > 86400000 or length(p_key) > 200 then
    raise exception 'bad args';
  end if;
  insert into rate_buckets(key, hits) values (p_key, '{}') on conflict (key) do nothing;
  select hits into v_hits from rate_buckets where key = p_key for update;
  v_hits := array(select h from unnest(coalesce(v_hits, '{}')) as h where v_now - h < (p_window_ms || ' milliseconds')::interval);
  if coalesce(array_length(v_hits, 1), 0) >= p_cap then
    update rate_buckets set hits = v_hits where key = p_key;
    return true;
  end if;
  update rate_buckets set hits = v_hits || v_now where key = p_key;
  return false;
end $$;

-- 3. No TRUNCATE / TRIGGER / REFERENCES for API roles.
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, trigger, references on tables from anon, authenticated;

-- 5. Public visitors can no longer read storage keys or uploader ids.
revoke select on public.files from anon;
grant select (id, faculty, category, department, year, course_code, title, kind, size_bytes, status, created_at) on public.files to anon;
