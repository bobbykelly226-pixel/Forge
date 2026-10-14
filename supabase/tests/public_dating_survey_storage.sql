begin;
set local role service_role;
insert into public.dating_survey_responses (id, survey_version, answers) values ('c605aeb7-7f21-4a52-9825-2d7d315ea85a', 'dating-experience-v1', $answers${"experience":["I currently use them."],"frustrations":["Matches whose values or intentions don’t align with mine"],"leaving":["I wasn’t meeting compatible people."],"worthwhile":[],"improvements":["Clearer relationship intentions"],"feature":[],"trying":["Enough people in my area"]}$answers$::jsonb) on conflict (id) do nothing;
insert into public.dating_survey_responses (id, survey_version, answers) values ('c605aeb7-7f21-4a52-9825-2d7d315ea85a', 'dating-experience-v1', $answers${"experience":["I currently use them."],"frustrations":["Matches whose values or intentions don’t align with mine"],"leaving":["I wasn’t meeting compatible people."],"worthwhile":[],"improvements":["Clearer relationship intentions"],"feature":[],"trying":["Enough people in my area"]}$answers$::jsonb) on conflict (id) do nothing;
do $check$ begin
 if (select count(*) from public.dating_survey_responses where id = 'c605aeb7-7f21-4a52-9825-2d7d315ea85a') <> 1 then raise exception 'duplicate submission'; end if;
 if public.valid_dating_survey_answers($answers${"experience":["I currently use them."],"frustrations":["Matches whose values or intentions don’t align with mine"],"leaving":["I wasn’t meeting compatible people."],"worthwhile":[],"improvements":["Clearer relationship intentions"],"feature":[],"trying":["Enough people in my area"]}$answers$::jsonb || '{"email":["person@example.test"]}'::jsonb) then raise exception 'identity field accepted'; end if;
 begin
  insert into public.dating_survey_responses (id, survey_version, answers) values (gen_random_uuid(), 'dating-experience-v1', '{}'::jsonb);
  raise exception 'invalid answers accepted';
 exception when check_violation then null;
 end;
end $check$;
reset role;
set local role anon;
do $check$ begin
 begin perform * from public.dating_survey_responses; raise exception 'anon read allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.dating_survey_responses (id,survey_version,answers) values (gen_random_uuid(),'dating-experience-v1','{}'); raise exception 'anon insert allowed'; exception when insufficient_privilege then null; end;
 begin update public.dating_survey_responses set survey_version='wrong'; raise exception 'anon update allowed'; exception when insufficient_privilege then null; end;
 begin delete from public.dating_survey_responses; raise exception 'anon delete allowed'; exception when insufficient_privilege then null; end;
end $check$;
reset role;
set local role authenticated;
do $check$ begin
 begin perform * from public.dating_survey_responses; raise exception 'member read allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.dating_survey_responses (id,survey_version,answers) values (gen_random_uuid(),'dating-experience-v1','{}'); raise exception 'member insert allowed'; exception when insufficient_privilege then null; end;
 begin update public.dating_survey_responses set survey_version='wrong'; raise exception 'member update allowed'; exception when insufficient_privilege then null; end;
 begin delete from public.dating_survey_responses; raise exception 'member delete allowed'; exception when insufficient_privilege then null; end;
end $check$;
reset role;
select 'storage, retry, validation and access checks passed' as result;
rollback;
