begin;
set local role service_role;
do $test$
declare before_total bigint; before_written bigint; summary jsonb;
begin
 select public.get_dating_survey_results(1) into summary;
 before_total := (summary->>'total')::bigint;
 before_written := (summary->>'written_total')::bigint;
 insert into public.dating_survey_responses (id,survey_version,answers)
 select gen_random_uuid(),'dating-experience-v1',$answers${"experience":["I currently use them."],"frustrations":["Matches whose values or intentions don’t align with mine","Dishonest, misleading, or fake profiles","Ghosting or conversations that go nowhere"],"leaving":["I wasn’t meeting compatible people."],"worthwhile":[],"improvements":["Clearer relationship intentions"],"feature":["Harmless survey dashboard test"],"trying":["Enough people in my area"]}$answers$::jsonb from generate_series(1,51);
 summary := public.get_dating_survey_results(1);
 if (summary->>'total')::bigint <> before_total+51 then raise exception 'incorrect total'; end if;
 if (summary->>'written_total')::bigint <> before_written+51 then raise exception 'incorrect written total'; end if;
 if jsonb_array_length(summary->'feedback') <> 50 then raise exception 'page limit failed'; end if;
 summary := public.get_dating_survey_results(2);
 if jsonb_array_length(summary->'feedback') <> 1 then raise exception 'second page failed'; end if;
 begin perform public.get_dating_survey_results(0); raise exception 'invalid page accepted'; exception when invalid_parameter_value then null; end;
end $test$;
reset role;
set local role anon;
do $test$ begin
 begin perform public.get_dating_survey_results(1); raise exception 'anon summary allowed'; exception when insufficient_privilege then null; end;
end $test$;
reset role;
set local role authenticated;
do $test$ begin
 begin perform public.get_dating_survey_results(1); raise exception 'member summary allowed'; exception when insufficient_privilege then null; end;
end $test$;
reset role;
select 'dashboard totals, pagination, invalid page and private access checks passed' as result;
rollback;
