create function public.get_dating_survey_results(p_page integer default 1)
returns jsonb language plpgsql stable security invoker
set search_path = pg_catalog, public
as $function$
declare result jsonb;
begin
 if p_page is null or p_page < 1 or p_page > 100000 then
  raise exception 'Invalid page' using errcode = '22023';
 end if;
 with responses as (
  select id, submitted_at, answers from public.dating_survey_responses
  where survey_version = 'dating-experience-v1'
 ), counts as (
  select entry.key as question, choice.value as answer, count(*) as count
  from responses r
  cross join lateral jsonb_each(r.answers) entry
  cross join lateral jsonb_array_elements_text(entry.value) choice
  where entry.key in ('experience','frustrations','leaving','improvements','trying')
  group by entry.key, choice.value
 ), written as (
  select id, submitted_at, nullif(answers->'worthwhile'->>0,'') as worthwhile,
   nullif(answers->'feature'->>0,'') as feature
  from responses
  where jsonb_array_length(answers->'worthwhile') > 0 or jsonb_array_length(answers->'feature') > 0
 ), feedback as (
  select * from written order by submitted_at desc, id desc limit 50 offset (p_page - 1) * 50
 )
 select jsonb_build_object(
  'total', (select count(*) from responses),
  'counts', coalesce((select jsonb_agg(to_jsonb(c)) from counts c), '[]'::jsonb),
  'written_total', (select count(*) from written),
  'page', p_page,
  'feedback', coalesce((select jsonb_agg(to_jsonb(f) order by submitted_at desc, id desc) from feedback f), '[]'::jsonb)
 ) into result;
 return result;
end;
$function$;
revoke all on function public.get_dating_survey_results(integer) from public, anon, authenticated;
grant execute on function public.get_dating_survey_results(integer) to service_role;
comment on function public.get_dating_survey_results(integer) is 'Service-only survey tallies and paginated written feedback. The server dashboard must authenticate its operator and verify MFA before calling.';
