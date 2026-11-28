-- Tier 3 (department admin) can manage cohort admins of their own department,
-- through the same approval requests. Super admin removal is root-only.
begin;

-- Department admin = scope 'track' with full rights.
create or replace function public.is_track_admin(p_faculty text, p_category text, p_track text)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.admin_grants g
    where g.email = public.my_email() and g.faculty = p_faculty
      and g.scope = 'track' and g.perms = 'full'
      and g.category = coalesce(p_category,'basic') and g.track = p_track
  )
$$;

drop policy if exists grants_read_own_track on public.admin_grants;
create policy grants_read_own_track on public.admin_grants for select
  using (public.is_track_admin(faculty, category, track));

create or replace function public.request_grant_add(
  p_email text, p_scope text, p_faculty text, p_category text,
  p_track text, p_year smallint, p_perms text)
returns bigint language plpgsql security definer set search_path to 'public' as $$
declare rid bigint;
begin
  if p_scope = 'faculty' then
    raise exception 'إضافة مشرف على مستوى الكلية من اختصاص السوبر أدمن فقط';
  end if;
  if public.is_faculty_admin(p_faculty) then
    null; -- faculty admin: cohort or department admins inside the faculty
  elsif p_scope = 'cohort' and public.is_track_admin(p_faculty, p_category, p_track) then
    null; -- department admin: cohort admins inside the department only
  else
    raise exception 'ليست لديك صلاحية على هذا النطاق';
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
  if g.id is null then raise exception 'المشرف غير موجود'; end if;
  if g.scope = 'faculty' then
    raise exception 'إزالة مشرف كلية من اختصاص السوبر أدمن فقط';
  end if;
  if public.is_faculty_admin(g.faculty) then
    null;
  elsif g.scope = 'cohort' and public.is_track_admin(g.faculty, g.category, g.track) then
    null;
  else
    raise exception 'ليست لديك صلاحية على هذا المشرف';
  end if;
  insert into public.admin_requests(action,target_email,scope,faculty,category,track,year,perms,grant_id,requested_by)
  values ('remove', g.email, g.scope, g.faculty, g.category, g.track, g.year, g.perms, g.id, auth.uid())
  returning id into rid;
  return rid;
end $$;

-- Root super admin: the original owner. Only a root can add or remove another
-- super admin, and a root can never be removed. No client privileges on the table.
create table if not exists public.root_admins (user_id uuid primary key references public.profiles(id));
alter table public.root_admins enable row level security;
revoke all on public.root_admins from anon, authenticated;
insert into public.root_admins(user_id)
  select id from public.profiles where email = 'mustafatitios.u@gmail.com' on conflict do nothing;

create or replace function public.is_root() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists(select 1 from public.root_admins where user_id = auth.uid())
$$;

create or replace function public.set_super(p_email text, p_on boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare t public.profiles;
begin
  if not public.is_root() then raise exception 'هذا الإجراء للسوبر أدمن الأساسي فقط'; end if;
  select * into t from public.profiles where lower(email) = lower(trim(p_email));
  if t.id is null then raise exception 'لا يوجد حساب بهذا البريد. يجب أن يسجّل أولًا.'; end if;
  if exists(select 1 from public.root_admins where user_id = t.id) then
    raise exception 'لا يمكن تغيير صلاحية السوبر أدمن الأساسي';
  end if;
  update public.profiles set role = case when p_on then 'admin' else 'student' end where id = t.id;
end $$;

grant execute on function public.is_track_admin(text,text,text) to authenticated;
grant execute on function public.is_root() to authenticated;
grant execute on function public.set_super(text,boolean) to authenticated;
revoke execute on function public.set_super(text,boolean) from anon, public;
revoke execute on function public.is_root() from anon, public;
revoke execute on function public.is_track_admin(text,text,text) from anon, public;

commit;
