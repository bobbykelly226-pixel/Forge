-- =============================================================================
-- Forge Compatibility Profile V3 — focused 30-question core
--
-- Forward-only and idempotent:
--   * Preserves every V1/V2 catalog row and response.
--   * Copies only stable retained V2 question/choice keys into V3.
--   * Recalculates V3 progress after the copy.
--   * Leaves prior rows intact and never reinterprets an answer.
-- =============================================================================

set local lock_timeout = '5s';

insert into public.questionnaire_versions (
  version_key, specification_version, title, is_active
) values (
  'compatibility_profile_v3',
  'compatibility_profile_core_30_v1',
  'Compatibility Profile',
  true
)
on conflict (version_key) do update set
  specification_version = excluded.specification_version,
  title = excluded.title,
  is_active = excluded.is_active;

update public.questionnaire_versions
set is_active = false
where version_key <> 'compatibility_profile_v3'
  and is_active = true;

insert into public.questionnaire_categories (
  version_id, category_key, category_number, title, status, display_order,
  locked_product_decisions
)
select
  target.id,
  source_category.category_key,
  source_category.category_number,
  source_category.title,
  'locked'::public.questionnaire_category_status,
  source_category.display_order,
  jsonb_build_array(
    'The initial Compatibility Profile contains three focused core questions in this category.',
    'Existing onboarding and profile facts are reused instead of asking duplicate identity or lifestyle questions.',
    'Category results are normalized before overall weighting.',
    'Important Alignment Factors remain separate and never automatically overwrite Relationship Alignment.',
    'Missing, withheld, and inapplicable answers are never scored as mismatches.'
  )
from public.questionnaire_versions source
join public.questionnaire_categories source_category
  on source_category.version_id = source.id
cross join public.questionnaire_versions target
where source.version_key = 'compatibility_profile_v2'
  and target.version_key = 'compatibility_profile_v3'
on conflict (version_id, category_key) do update set
  category_number = excluded.category_number,
  title = excluded.title,
  status = excluded.status,
  display_order = excluded.display_order,
  locked_product_decisions = excluded.locked_product_decisions;

with retained(category_key, question_key, question_number) as (
  values
    ('relationship_vision_intentions', 'relationship_vision_intentions_q02', 1),
    ('relationship_vision_intentions', 'relationship_vision_intentions_q03', 2),
    ('relationship_vision_intentions', 'relationship_vision_intentions_q04', 3),
    ('values_character', 'values_character_q03', 1),
    ('values_character', 'values_character_q04', 2),
    ('values_character', 'values_character_q07', 3),
    ('communication_emotional_connection', 'communication_emotional_connection_q01', 1),
    ('communication_emotional_connection', 'communication_emotional_connection_q02', 2),
    ('communication_emotional_connection', 'communication_emotional_connection_q05', 3),
    ('conflict_repair', 'conflict_repair_q01', 1),
    ('conflict_repair', 'conflict_repair_q02', 2),
    ('conflict_repair', 'conflict_repair_q06', 3),
    ('commitment_partnership', 'commitment_partnership_q01', 1),
    ('commitment_partnership', 'commitment_partnership_q02', 2),
    ('commitment_partnership', 'commitment_partnership_q04', 3),
    ('family_children_parenting', 'family_children_parenting_q06', 1),
    ('family_children_parenting', 'family_children_parenting_q07', 2),
    ('family_children_parenting', 'family_children_parenting_q08', 3),
    ('faith_spirituality_worldview', 'faith_spirituality_worldview_q04', 1),
    ('faith_spirituality_worldview', 'faith_spirituality_worldview_q06', 2),
    ('faith_spirituality_worldview', 'faith_spirituality_worldview_q10', 3),
    ('politics_civic_life_social_issues', 'politics_civic_life_social_issues_q01', 1),
    ('politics_civic_life_social_issues', 'politics_civic_life_social_issues_q02', 2),
    ('politics_civic_life_social_issues', 'politics_civic_life_social_issues_q06', 3),
    ('service_community_contribution', 'service_community_contribution_q01', 1),
    ('service_community_contribution', 'service_community_contribution_q04', 2),
    ('service_community_contribution', 'service_community_contribution_q06', 3),
    ('integrity_honesty_trust', 'integrity_honesty_trust_q01', 1),
    ('integrity_honesty_trust', 'integrity_honesty_trust_q03', 2),
    ('integrity_honesty_trust', 'integrity_honesty_trust_q07', 3)
)
insert into public.questionnaire_questions (
  category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note,
  eligibility_rule_id, is_conditional, select_all_that_apply,
  structured_identity_config, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys,
  priority_min_eligible_selections, allowed_special_response_states,
  allowed_qualifiers, display_order
)
select
  target_category.id,
  source_question.question_key,
  retained.question_number,
  source_question.prompt,
  source_question.statement,
  source_question.format_label,
  source_question.response_behavior,
  source_question.context_note,
  source_question.implementation_note,
  null,
  false,
  source_question.select_all_that_apply,
  source_question.structured_identity_config,
  source_question.alignment_purpose,
  source_question.min_selections,
  source_question.max_selections,
  null,
  null,
  true,
  null,
  null,
  null,
  source_question.allowed_special_response_states,
  source_question.allowed_qualifiers,
  retained.question_number
from retained
join public.questionnaire_versions source
  on source.version_key = 'compatibility_profile_v2'
join public.questionnaire_categories source_category
  on source_category.version_id = source.id
 and source_category.category_key = retained.category_key
join public.questionnaire_questions source_question
  on source_question.category_id = source_category.id
 and source_question.question_key = retained.question_key
join public.questionnaire_versions target
  on target.version_key = 'compatibility_profile_v3'
join public.questionnaire_categories target_category
  on target_category.version_id = target.id
 and target_category.category_key = retained.category_key
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  context_note = excluded.context_note,
  implementation_note = excluded.implementation_note,
  eligibility_rule_id = null,
  is_conditional = false,
  select_all_that_apply = excluded.select_all_that_apply,
  structured_identity_config = excluded.structured_identity_config,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = null,
  priority_selection_count = null,
  priority_unordered = true,
  priority_eligible_choice_keys = null,
  priority_excluded_choice_keys = null,
  priority_min_eligible_selections = null,
  allowed_special_response_states = excluded.allowed_special_response_states,
  allowed_qualifiers = excluded.allowed_qualifiers,
  display_order = excluded.display_order;

insert into public.questionnaire_answer_choices (
  question_id, choice_key, label, display_order, mutually_exclusive,
  special_response_state, qualifier, qualifier_coexists_with_selections,
  opens_optional_context, optional_context_config
)
select
  target_question.id,
  source_choice.choice_key,
  source_choice.label,
  source_choice.display_order,
  source_choice.mutually_exclusive,
  source_choice.special_response_state,
  source_choice.qualifier,
  source_choice.qualifier_coexists_with_selections,
  source_choice.opens_optional_context,
  source_choice.optional_context_config
from public.questionnaire_versions source
join public.questionnaire_categories source_category
  on source_category.version_id = source.id
join public.questionnaire_questions source_question
  on source_question.category_id = source_category.id
join public.questionnaire_answer_choices source_choice
  on source_choice.question_id = source_question.id
join public.questionnaire_versions target
  on target.version_key = 'compatibility_profile_v3'
join public.questionnaire_categories target_category
  on target_category.version_id = target.id
 and target_category.category_key = source_category.category_key
join public.questionnaire_questions target_question
  on target_question.category_id = target_category.id
 and target_question.question_key = source_question.question_key
where source.version_key = 'compatibility_profile_v2'
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state,
  qualifier = excluded.qualifier,
  qualifier_coexists_with_selections = excluded.qualifier_coexists_with_selections,
  opens_optional_context = excluded.opens_optional_context,
  optional_context_config = excluded.optional_context_config;

-- Create the target progress row before response rows because responses use a
-- composite foreign key into progress.
insert into public.user_questionnaire_progress (
  user_id, version_id, status, current_category_id, started_at, completed_at,
  current_question_id, current_phase, write_generation
)
select
  source_progress.user_id,
  target.id,
  'not_started'::public.questionnaire_progress_status,
  null,
  source_progress.started_at,
  null,
  null,
  null,
  0
from public.user_questionnaire_progress source_progress
join public.questionnaire_versions source
  on source.id = source_progress.version_id
cross join public.questionnaire_versions target
where source.version_key = 'compatibility_profile_v2'
  and target.version_key = 'compatibility_profile_v3'
on conflict (user_id, version_id) do nothing;

insert into public.user_questionnaire_responses (
  user_id, version_id, question_id, response_state, active_qualifiers,
  identity_refinement, identity_user_supplied,
  identity_public_display_allowed, identity_private_matching_allowed,
  created_at, updated_at, revision, client_mutation
)
select
  source_response.user_id,
  target.id,
  target_question.id,
  source_response.response_state,
  source_response.active_qualifiers,
  source_response.identity_refinement,
  source_response.identity_user_supplied,
  source_response.identity_public_display_allowed,
  source_response.identity_private_matching_allowed,
  source_response.created_at,
  source_response.updated_at,
  source_response.revision,
  source_response.client_mutation
from public.user_questionnaire_responses source_response
join public.questionnaire_versions source
  on source.id = source_response.version_id
join public.questionnaire_questions source_question
  on source_question.id = source_response.question_id
join public.questionnaire_categories source_category
  on source_category.id = source_question.category_id
join public.questionnaire_versions target
  on target.version_key = 'compatibility_profile_v3'
join public.questionnaire_categories target_category
  on target_category.version_id = target.id
 and target_category.category_key = source_category.category_key
join public.questionnaire_questions target_question
  on target_question.category_id = target_category.id
 and target_question.question_key = source_question.question_key
where source.version_key = 'compatibility_profile_v2'
on conflict (user_id, version_id, question_id) do nothing;

insert into public.user_questionnaire_selected_choices (
  response_id, choice_id, context_text, created_at
)
select
  target_response.id,
  target_choice.id,
  source_selected.context_text,
  source_selected.created_at
from public.user_questionnaire_selected_choices source_selected
join public.user_questionnaire_responses source_response
  on source_response.id = source_selected.response_id
join public.questionnaire_versions source
  on source.id = source_response.version_id
join public.questionnaire_questions source_question
  on source_question.id = source_response.question_id
join public.questionnaire_categories source_category
  on source_category.id = source_question.category_id
join public.questionnaire_answer_choices source_choice
  on source_choice.id = source_selected.choice_id
join public.questionnaire_versions target
  on target.version_key = 'compatibility_profile_v3'
join public.questionnaire_categories target_category
  on target_category.version_id = target.id
 and target_category.category_key = source_category.category_key
join public.questionnaire_questions target_question
  on target_question.category_id = target_category.id
 and target_question.question_key = source_question.question_key
join public.questionnaire_answer_choices target_choice
  on target_choice.question_id = target_question.id
 and target_choice.choice_key = source_choice.choice_key
join public.user_questionnaire_responses target_response
  on target_response.user_id = source_response.user_id
 and target_response.version_id = target.id
 and target_response.question_id = target_question.id
where source.version_key = 'compatibility_profile_v2'
on conflict (response_id, choice_id) do nothing;

do $$
declare
  item record;
  v_categories integer;
  v_questions integer;
  v_conditional integer;
begin
  for item in
    select progress.user_id, progress.version_id
    from public.user_questionnaire_progress progress
    join public.questionnaire_versions version on version.id = progress.version_id
    where version.version_key = 'compatibility_profile_v3'
  loop
    perform public.forge_recalculate_questionnaire_progress(
      item.user_id,
      item.version_id
    );
  end loop;

  update public.user_questionnaire_progress progress
  set
    current_category_id = null,
    current_question_id = null,
    current_phase = case when progress.status = 'completed' then 'complete' else null end,
    write_generation = 0
  from public.questionnaire_versions version
  where version.id = progress.version_id
    and version.version_key = 'compatibility_profile_v3';

  select
    count(distinct category.id),
    count(distinct question.id),
    count(*) filter (where question.is_conditional)
  into v_categories, v_questions, v_conditional
  from public.questionnaire_versions version
  join public.questionnaire_categories category on category.version_id = version.id
  join public.questionnaire_questions question on question.category_id = category.id
  where version.version_key = 'compatibility_profile_v3';

  if v_categories <> 10 or v_questions <> 30 or v_conditional <> 0 then
    raise exception
      'Compatibility Profile V3 contract failed: categories %, questions %, conditional %',
      v_categories, v_questions, v_conditional;
  end if;
end
$$;
