-- Anonymous research responses are separate from member accounts.
create or replace function public.valid_dating_survey_answers(input jsonb)
returns boolean language plpgsql immutable security invoker
set search_path = pg_catalog, public
as $function$
declare
  catalog constant jsonb := $catalog$[{"id":"experience","title":"What is your experience with dating apps or websites?","kind":"single","options":["I currently use them.","I’ve used them, but stopped.","I’ve never used them."]},{"id":"frustrations","title":"What frustrations have you experienced with dating apps or websites?","kind":"multiple","options":["Matches whose values or intentions don’t align with mine","The app didn’t let me express my values or match around them","Dishonest, misleading, or fake profiles","Ghosting or conversations that go nowhere","Unwanted or disrespectful messages","Safety or privacy concerns","Costs, paywalls, or unclear pricing","Too much swiping and not enough meaningful connection","Other","None","I haven’t used dating apps or websites"],"exclusive":["None","I haven’t used dating apps or websites"]},{"id":"leaving","title":"What is the biggest reason you stopped, or would consider stopping, using a dating app?","kind":"single","options":["I wasn’t meeting compatible people.","The app’s design or dating culture wasn’t right for me.","It took too much time or felt exhausting.","I didn’t trust the profiles or people I encountered.","I felt uncomfortable or unsafe.","It cost too much.","I met someone or no longer needed it.","Other","I’m not considering stopping.","I haven’t used dating apps or websites."]},{"id":"worthwhile","title":"What would make online dating feel worth trying, or continuing, for you?","kind":"text"},{"id":"improvements","title":"Which improvements would matter most to you?","kind":"multiple","options":["Clearer relationship intentions","Matching based on meaningful values and compatibility","Better tools for handling unwanted contact and safety concerns","Fewer irrelevant profiles","More genuine conversations","Clear, transparent pricing","A simpler experience with less swiping","Other","None of these"],"exclusive":["None of these"]},{"id":"feature","title":"What is one feature or change you wish a dating app offered?","kind":"text"},{"id":"trying","title":"What would encourage you to try Forge?","description":"Choose up to three. If you’re ready now or not interested, choose that answer by itself.","kind":"multiple","options":["Enough people in my area","A clear explanation of how it works","Confidence in its safety and privacy practices","Evidence that it offers something meaningfully different","A free way to try it","A recommendation from someone I trust","Other","I’d be willing to try it now.","I’m not interested in trying a new dating platform."],"exclusive":["I’d be willing to try it now.","I’m not interested in trying a new dating platform."]}]$catalog$::jsonb;
  question jsonb;
  answer jsonb;
  choice jsonb;
  answer_count integer;
  allowed_keys text[];
begin
  if input is null or jsonb_typeof(input) <> 'object' or octet_length(input::text) > 16000 then return false; end if;
  select array_agg(q->>'id') into allowed_keys from jsonb_array_elements(catalog) q;
  if exists (select 1 from jsonb_object_keys(input) k where not (k = any(allowed_keys))) then return false; end if;
  for question in select value from jsonb_array_elements(catalog) loop
    answer := input -> (question->>'id');
    if answer is null or jsonb_typeof(answer) <> 'array' then return false; end if;
    answer_count := jsonb_array_length(answer);
    if question->>'kind' = 'text' then
      if answer_count > 1 then return false; end if;
      for choice in select value from jsonb_array_elements(answer) loop
        if jsonb_typeof(choice) <> 'string' or char_length(choice #>> '{}') > 1000 then return false; end if;
      end loop;
    else
      if answer_count < 1 or answer_count > (case when question->>'kind' = 'single' then 1 else 3 end) then return false; end if;
      if (select count(distinct value) from jsonb_array_elements(answer)) <> answer_count then return false; end if;
      for choice in select value from jsonb_array_elements(answer) loop
        if jsonb_typeof(choice) <> 'string' or not ((question->'options') @> jsonb_build_array(choice)) then return false; end if;
        if answer_count > 1 and coalesce((question->'exclusive') @> jsonb_build_array(choice), false) then return false; end if;
      end loop;
    end if;
  end loop;
  return true;
end;
$function$;
revoke all on function public.valid_dating_survey_answers(jsonb) from public, anon, authenticated;
grant execute on function public.valid_dating_survey_answers(jsonb) to service_role;
