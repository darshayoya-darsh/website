-- Admin roles, upload-only grants, and super-admin approval of admin changes.
-- Existing grants keep exactly their current rights (perms defaults to 'full').

begin;

alter table public.admin_grants
  add column if not exists perms text not null default 'full'
  check (perms in ('full','upload_only'));

-- Upload/read/edit scope check stays can_manage (unchanged).
-- Delete needs full rights: upload-only admins cannot delete.
create or replace function public.can_manage_full(p_faculty text, p_track text, p_year smallint)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.is_super() or exists (
    select 1 from public.admin_grants g
    where g.email = public.my_email()
      and g.faculty = p_faculty
      and g.perms = 'full'
      and (g.scope = 'faculty'
           or (g.scope = 'track' and g.track = p_track)
           or (g.scope = 'cohort' and g.track = p_track and g.year = p_year))
  )
$$;

-- Is the caller a faculty admin (scope faculty, full rights) of this faculty?
create or replace function public.is_faculty_admin(p_faculty text)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.admin_grants g
    where g.email = public.my_email() and g.faculty = p_faculty
      and g.scope = 'faculty' and g.perms = 'full'
  )
$$;

drop policy if exists files_manage_scoped on public.files;
create policy files_write_scoped on public.files for insert
  with check (public.can_manage(faculty, department, year));
create policy files_update_scoped on public.files for update
  using (public.can_manage(faculty, department, year))
  with check (public.can_manage(faculty, department, year));
create policy files_select_scoped on public.files for select
  using (public.can_manage(faculty, department, year));
create policy files_delete_full on public.files for delete
  using (public.can_manage_full(faculty, department, year));

-- A faculty admin sees admins of their own faculty (needed to list/remove them).
create policy grants_read_own_faculty on public.admin_grants for select
  using (public.is_faculty_admin(faculty));

create table if not exists public.admin_requests (
  id            bigint generated always as identity primary key,
  action        text not null check (action in ('add','remove')),
  target_email  text not null,
  scope         text check (scope in ('cohort','track','faculty')),
  faculty       text not null,
  category      text not null default 'basic',
  track         text,
  year          smallint,
  perms         text not null default 'upload_only' check (perms in ('full','upload_only')),
  grant_id      bigint,
  requested_by  uuid not null references public.profiles(id),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by    uuid references public.profiles(id),
  decided_at    timestamptz,
  note          text,
  created_at    timestamptz not null default now()
);
alter table public.admin_requests enable row level security;

create policy requests_read on public.admin_requests for select
  using (public.is_super() or requested_by = auth.uid());
-- No insert/update/delete policies: all changes go through the functions below.

create or replace function public.request_grant_add(
  p_email text, p_scope text, p_faculty text, p_category text,
  p_track text, p_year smallint, p_perms text)
returns bigint language plpgsql security definer set search_path to 'public' as $$
declare rid bigint;
begin
  if not public.is_faculty_admin(p_faculty) then
    raise exception 'ليست لديك صلاحية على هذه الكلية';
  end if;
  if p_scope = 'faculty' then
    raise exception 'إضافة مشرف على مستوى الكلية من اختصاص السوبر أدمن فقط';
  end if;
  insert into public.admin_requests(action,target_email,scope,faculty,category,track,year,perms,requested_by)
  values ('add', lower(trim(p_email)), p_scope, p_faculty, p_category, p_track, p_year, p_perms, auth.uid())
  returning id into rid;
  return rid;
end $$;

create or replace function public.request_grant_remove(p_grant_id bigint)
returns bigint language plpgsql security definer set search_path to 'public' as $$
declare g public.admin_grants; rid bigint;
begin
  select * into g from public.admin_grants where id = p_grant_id;
  if g.id is null or not public.is_faculty_admin(g.faculty) then
    raise exception 'ليست لديك صلاحية على هذا المشرف';
  end if;
  if g.scope = 'faculty' then
    raise exception 'إزالة مشرف كلية من اختصاص السوبر أدمن فقط';
  end if;
  insert into public.admin_requests(action,target_email,scope,faculty,category,track,year,perms,grant_id,requested_by)
  values ('remove', g.email, g.scope, g.faculty, g.category, g.track, g.year, g.perms, g.id, auth.uid())
  returning id into rid;
  return rid;
end $$;

create or replace function public.approve_request(p_id bigint)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r public.admin_requests;
begin
  if not public.is_super() then raise exception 'للسوبر أدمن فقط'; end if;
  select * into r from public.admin_requests where id = p_id and status = 'pending' for update;
  if r.id is null then raise exception 'الطلب غير موجود أو تم البت فيه'; end if;
  if r.action = 'add' then
    insert into public.admin_grants(email,scope,faculty,category,track,year,perms,created_by)
    values (r.target_email, r.scope, r.faculty, r.category, r.track, r.year, r.perms, auth.uid());
  else
    delete from public.admin_grants where id = r.grant_id;
  end if;
  update public.admin_requests set status='approved', decided_by=auth.uid(), decided_at=now() where id = p_id;
end $$;

create or replace function public.reject_request(p_id bigint, p_note text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_super() then raise exception 'للسوبر أدمن فقط'; end if;
  update public.admin_requests set status='rejected', decided_by=auth.uid(), decided_at=now(), note=p_note
  where id = p_id and status = 'pending';
  if not found then raise exception 'الطلب غير موجود أو تم البت فيه'; end if;
end $$;

grant execute on function public.request_grant_add(text,text,text,text,text,smallint,text) to authenticated;
grant execute on function public.request_grant_remove(bigint) to authenticated;
grant execute on function public.approve_request(bigint) to authenticated;
grant execute on function public.reject_request(bigint,text) to authenticated;
grant execute on function public.can_manage_full(text,text,smallint) to authenticated;
grant execute on function public.is_faculty_admin(text) to authenticated;
revoke execute on function public.request_grant_add(text,text,text,text,text,smallint,text) from anon, public;
revoke execute on function public.request_grant_remove(bigint) from anon, public;
revoke execute on function public.approve_request(bigint) from anon, public;
revoke execute on function public.reject_request(bigint,text) from anon, public;

commit;
