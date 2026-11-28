-- Student's track (شعبة) from the bylaw. Own-row update only, same as faculty/department/year.
alter table public.profiles add column if not exists track text;
grant update (track) on public.profiles to authenticated;
