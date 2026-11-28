-- Source link per knowledge doc (shown under answers).
alter table public.knowledge_docs add column if not exists source_url text;
grant select (slug, title, body, source_url, updated_at) on public.knowledge_docs to anon, authenticated;

-- Assistant feedback. Only the Worker can write (shared-secret header, same as rate_hit);
-- nobody reads it through the API. Reviewed weekly with the owner database access.
create table if not exists public.agent_feedback (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  rating text not null check (rating in ('up','down')),
  question text not null check (length(question) <= 600),
  answer text not null check (length(answer) <= 4000),
  comment text check (comment is null or length(comment) <= 600)
);
alter table public.agent_feedback enable row level security;
revoke all on public.agent_feedback from anon, authenticated;

create or replace function public.submit_agent_feedback(p_rating text, p_question text, p_answer text, p_comment text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_hdr text := coalesce(current_setting('request.headers', true), '{}')::json->>'x-azu-rl';
begin
  if v_hdr is null or v_hdr <> (select v from public.rate_secret where id = 1) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.agent_feedback(rating, question, answer, comment)
  values (p_rating, left(p_question, 600), left(p_answer, 4000), left(p_comment, 600));
end $$;
revoke execute on function public.submit_agent_feedback(text,text,text,text) from public;
grant execute on function public.submit_agent_feedback(text,text,text,text) to anon, authenticated;
