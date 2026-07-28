/**
 * Generates the forward-only Compatibility Profile V2 catalog migration.
 *
 * V1 and its user responses remain preserved. V2 becomes the only active
 * questionnaire version and contains 10 categories × 8 questions.
 *
 * Run: node --import tsx scripts/generate-questionnaire-calibration-v2-migration.ts
 */
import { writeFileSync } from 'node:fs';

import {
  getQuestionnaireCatalog,
  QUESTIONNAIRE_VERSION,
  SPECIFICATION_VERSION,
} from '../lib/questionnaire/catalog/index';

const MIGRATION_PATH =
  'supabase/migrations/20260728040337_questionnaire_calibration_v2.sql';

function sqlJson(value: unknown): string {
  return `$seed$${JSON.stringify(value)}$seed$::jsonb`;
}

const catalog = getQuestionnaireCatalog();
const questions = catalog.categories.flatMap((category) =>
  category.questions.map((question) => {
    const eligibilityRuleKey = question.eligibilityRuleId
      ? catalog.eligibilityRules.find(
          (rule) => rule.id === question.eligibilityRuleId
        )?.ruleKey ?? null
      : null;
    return {
      category_key: category.id,
      question_key: question.id,
      question_number: question.number,
      prompt: question.prompt,
      statement: question.statement ?? null,
      format_label: question.formatLabel,
      response_behavior: question.responseBehavior,
      context_note: question.contextNote ?? null,
      implementation_note: question.implementationNote ?? null,
      eligibility_rule_key: eligibilityRuleKey,
      is_conditional: Boolean(question.conditional),
      select_all_that_apply: Boolean(question.selectAllThatApply),
      structured_identity_config: question.structuredIdentity ?? null,
      alignment_purpose: question.alignmentPurpose,
      min_selections: question.minSelections,
      max_selections: question.maxSelections,
      allowed_special_response_states:
        question.allowedSpecialResponseStates ?? null,
      allowed_qualifiers: question.allowedQualifiers ?? null,
      display_order: question.number,
    };
  })
);
const choices = catalog.categories.flatMap((category) =>
  category.questions.flatMap((question) =>
    question.choices.map((choice) => ({
      category_key: category.id,
      question_key: question.id,
      choice_key: choice.id,
      label: choice.label,
      display_order: choice.displayOrder,
      mutually_exclusive: Boolean(choice.mutuallyExclusive),
      special_response_state: choice.specialResponseState ?? null,
      qualifier: choice.qualifier ?? null,
      qualifier_coexists_with_selections: Boolean(
        choice.qualifierCoexistsWithSelections
      ),
      opens_optional_context: Boolean(choice.opensOptionalContext),
      optional_context_config: choice.optionalContext ?? null,
    }))
  )
);
const priorityCount = catalog.categories
  .flatMap((category) => category.questions)
  .filter((question) => question.priorityFollowUp).length;

if (
  catalog.categories.length !== 10 ||
  questions.length !== 80 ||
  priorityCount !== 0
) {
  throw new Error(
    `Expected 10 categories, 80 questions, and 0 priorities; got ${catalog.categories.length}, ${questions.length}, ${priorityCount}`
  );
}

const rules = catalog.eligibilityRules.map((rule) => ({
  rule_key: rule.ruleKey,
  description: rule.description,
  condition: rule.condition,
}));
const categories = catalog.categories.map((category) => ({
  category_key: category.id,
  category_number: category.number,
  title: category.title,
  display_order: category.number,
  locked_product_decisions: category.lockedProductDecisions,
}));

const sql = `-- =============================================================================
-- Forge Compatibility Profile V2 — calibrated 80-question catalog
--
-- Forward-only data migration:
--   * Preserves the V1 catalog and every V1 response.
--   * Creates the V2 catalog and makes it active.
--   * Eliminates priority follow-ups from the active product.
-- =============================================================================

set local lock_timeout = '5s';

update public.questionnaire_versions
set is_active = false
where is_active = true
  and version_key <> '${QUESTIONNAIRE_VERSION}';

insert into public.questionnaire_versions (
  version_key, specification_version, title, is_active
) values (
  '${QUESTIONNAIRE_VERSION}',
  '${SPECIFICATION_VERSION}',
  'Compatibility Profile',
  true
)
on conflict (version_key) do update set
  specification_version = excluded.specification_version,
  title = excluded.title,
  is_active = excluded.is_active;

with data as (
  select *
  from jsonb_to_recordset(${sqlJson(rules)}) as d(
    rule_key text,
    description text,
    condition jsonb
  )
)
insert into public.questionnaire_eligibility_rules (
  version_id, rule_key, description, condition
)
select v.id, d.rule_key, d.description, d.condition
from data d
cross join public.questionnaire_versions v
where v.version_key = '${QUESTIONNAIRE_VERSION}'
on conflict (version_id, rule_key) do update set
  description = excluded.description,
  condition = excluded.condition;

with data as (
  select *
  from jsonb_to_recordset(${sqlJson(categories)}) as d(
    category_key text,
    category_number integer,
    title text,
    display_order integer,
    locked_product_decisions jsonb
  )
)
insert into public.questionnaire_categories (
  version_id, category_key, category_number, title, status, display_order,
  locked_product_decisions
)
select
  v.id,
  d.category_key,
  d.category_number,
  d.title,
  'locked'::public.questionnaire_category_status,
  d.display_order,
  d.locked_product_decisions
from data d
cross join public.questionnaire_versions v
where v.version_key = '${QUESTIONNAIRE_VERSION}'
on conflict (version_id, category_key) do update set
  category_number = excluded.category_number,
  title = excluded.title,
  status = excluded.status,
  display_order = excluded.display_order,
  locked_product_decisions = excluded.locked_product_decisions;

with data as (
  select *
  from jsonb_to_recordset(${sqlJson(questions)}) as d(
    category_key text,
    question_key text,
    question_number integer,
    prompt text,
    statement text,
    format_label text,
    response_behavior text,
    context_note text,
    implementation_note text,
    eligibility_rule_key text,
    is_conditional boolean,
    select_all_that_apply boolean,
    structured_identity_config jsonb,
    alignment_purpose text,
    min_selections integer,
    max_selections integer,
    allowed_special_response_states jsonb,
    allowed_qualifiers jsonb,
    display_order integer
  )
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
  c.id,
  d.question_key,
  d.question_number,
  d.prompt,
  d.statement,
  d.format_label,
  d.response_behavior::public.questionnaire_response_behavior,
  d.context_note,
  d.implementation_note,
  er.id,
  d.is_conditional,
  d.select_all_that_apply,
  d.structured_identity_config,
  d.alignment_purpose,
  d.min_selections,
  d.max_selections,
  null,
  null,
  true,
  null,
  null,
  null,
  case
    when d.allowed_special_response_states is null then null
    else array(
      select jsonb_array_elements_text(d.allowed_special_response_states)
    )::public.questionnaire_response_state[]
  end,
  case
    when d.allowed_qualifiers is null then null
    else array(
      select jsonb_array_elements_text(d.allowed_qualifiers)
    )::public.questionnaire_response_qualifier[]
  end,
  d.display_order
from data d
join public.questionnaire_versions v
  on v.version_key = '${QUESTIONNAIRE_VERSION}'
join public.questionnaire_categories c
  on c.version_id = v.id
 and c.category_key = d.category_key
left join public.questionnaire_eligibility_rules er
  on er.version_id = v.id
 and er.rule_key = d.eligibility_rule_key
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  context_note = excluded.context_note,
  implementation_note = excluded.implementation_note,
  eligibility_rule_id = excluded.eligibility_rule_id,
  is_conditional = excluded.is_conditional,
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

with data as (
  select *
  from jsonb_to_recordset(${sqlJson(choices)}) as d(
    category_key text,
    question_key text,
    choice_key text,
    label text,
    display_order integer,
    mutually_exclusive boolean,
    special_response_state text,
    qualifier text,
    qualifier_coexists_with_selections boolean,
    opens_optional_context boolean,
    optional_context_config jsonb
  )
)
insert into public.questionnaire_answer_choices (
  question_id, choice_key, label, display_order, mutually_exclusive,
  special_response_state, qualifier, qualifier_coexists_with_selections,
  opens_optional_context, optional_context_config
)
select
  q.id,
  d.choice_key,
  d.label,
  d.display_order,
  d.mutually_exclusive,
  d.special_response_state::public.questionnaire_response_state,
  d.qualifier::public.questionnaire_response_qualifier,
  d.qualifier_coexists_with_selections,
  d.opens_optional_context,
  d.optional_context_config
from data d
join public.questionnaire_versions v
  on v.version_key = '${QUESTIONNAIRE_VERSION}'
join public.questionnaire_categories c
  on c.version_id = v.id
 and c.category_key = d.category_key
join public.questionnaire_questions q
  on q.category_id = c.id
 and q.question_key = d.question_key
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state,
  qualifier = excluded.qualifier,
  qualifier_coexists_with_selections = excluded.qualifier_coexists_with_selections,
  opens_optional_context = excluded.opens_optional_context,
  optional_context_config = excluded.optional_context_config;

do $$
declare
  v_categories integer;
  v_questions integer;
  v_priorities integer;
begin
  select
    count(distinct c.id),
    count(distinct q.id),
    count(*) filter (where q.priority_follow_up_prompt is not null)
  into v_categories, v_questions, v_priorities
  from public.questionnaire_versions v
  join public.questionnaire_categories c on c.version_id = v.id
  join public.questionnaire_questions q on q.category_id = c.id
  where v.version_key = '${QUESTIONNAIRE_VERSION}';

  if v_categories <> 10 or v_questions <> 80 or v_priorities <> 0 then
    raise exception
      'Compatibility Profile V2 contract failed: categories %, questions %, priorities %',
      v_categories, v_questions, v_priorities;
  end if;
end
$$;
`;

writeFileSync(MIGRATION_PATH, sql);

console.log(
  JSON.stringify({
    migrationPath: MIGRATION_PATH,
    version: QUESTIONNAIRE_VERSION,
    specificationVersion: SPECIFICATION_VERSION,
    categories: catalog.categories.length,
    questions: questions.length,
    choices: choices.length,
    priorities: priorityCount,
    bytes: sql.length,
  })
);
