-- Who may read admin_grants: super sees all; everyone sees their own rows;
-- a faculty admin sees only department and cohort admins of their faculty;
-- a department admin sees only cohort admins of their department.
begin;
drop policy if exists grants_read_own_faculty on public.admin_grants;
create policy grants_read_own_faculty on public.admin_grants for select
  using (scope in ('track','cohort') and public.is_faculty_admin(faculty));
drop policy if exists grants_read_own_track on public.admin_grants;
create policy grants_read_own_track on public.admin_grants for select
  using (scope = 'cohort' and public.is_track_admin(faculty, category, track));
commit;
