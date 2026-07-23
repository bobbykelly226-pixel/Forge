import { readFileSync, writeFileSync } from 'node:fs';

import {
  CATEGORY_01,
  CATEGORY_01_FORMAT_DISTRIBUTION,
  CATEGORY_01_LOCKED_PRODUCT_DECISIONS,
} from '../lib/questionnaire/catalog/category-01';

let fixture = `# Category 1 authoritative catalog excerpt

Authoritative Category 1 content after the 10 question reduction.
Used for wording regression tests.

## Category 1: Relationship Vision & Intentions

`;

for (const q of CATEGORY_01.questions) {
  fixture += `### ${q.number}. ${q.prompt}\n\n`;
  fixture += `**Format:** ${q.formatLabel}\n\n`;
  if (q.statement) fixture += `${q.statement}\n\n`;
  for (const c of q.choices) fixture += `${c.label}\n`;
  fixture += `\n`;
  if (q.priorityFollowUp) {
    fixture += `**Priority follow up:** ${q.priorityFollowUp.prompt}\n\n`;
  }
  fixture += `**Alignment purpose:** ${q.alignmentPurpose}\n\n`;
}

fixture += `### Locked product decisions\n\n`;
for (const d of CATEGORY_01_LOCKED_PRODUCT_DECISIONS) fixture += `${d}\n`;
fixture += `\n### Final format distribution\n\n`;
for (const [k, v] of Object.entries(CATEGORY_01_FORMAT_DISTRIBUTION)) {
  const values = v as readonly number[];
  fixture += `${k}: ${values.join(', ') || '(none)'}\n`;
}
writeFileSync('lib/questionnaire/fixtures/category-01-master-excerpt.md', fixture);

const manifest = JSON.parse(
  readFileSync('lib/questionnaire/fixtures/master-structure-manifest.json', 'utf8')
);
const others = manifest.questions.filter((q: { categoryNumber: number }) => q.categoryNumber !== 1);
const c1 = CATEGORY_01.questions.map((q) => {
  const features: string[] = [];
  if (q.priorityFollowUp) features.push('priority_follow_up');
  if (q.allowedSpecialResponseStates?.includes('context_dependent')) {
    features.push('context_dependent_state');
  }
  return {
    categoryNumber: 1,
    categoryTitle: CATEGORY_01.title,
    questionNumber: q.number,
    formatLabel: q.formatLabel,
    responseBehavior: q.responseBehavior,
    listedChoiceCount: q.choices.length,
    choiceCount: q.choices.length,
    minSelections: q.minSelections,
    maxSelections: q.maxSelections,
    features: features.sort(),
    specialChoices: q.choices
      .filter((c) => c.specialResponseState || c.mutuallyExclusive)
      .map((c) => ({
        index: c.displayOrder,
        ...(c.specialResponseState ? { specialResponseState: c.specialResponseState } : {}),
        ...(c.mutuallyExclusive ? { mutuallyExclusive: true } : {}),
      })),
    ...(q.allowedSpecialResponseStates
      ? { allowedSpecialResponseStates: q.allowedSpecialResponseStates }
      : {}),
    ...(q.priorityFollowUp
      ? {
          priorityFollowUp: {
            selectionCount: q.priorityFollowUp.selectionCount,
            unordered: true as const,
            minEligibleSelectionsBeforeDisplay:
              q.priorityFollowUp.minEligibleSelectionsBeforeDisplay ??
              q.priorityFollowUp.selectionCount,
          },
        }
      : {}),
    hasContextNote: Boolean(q.contextNote),
    hasImplementationNote: Boolean(q.implementationNote),
    hasEligibility: Boolean(q.eligibilityRuleId),
    isConditionalScenario: q.formatLabel === 'Conditional scenario-based choice',
  };
});

manifest.questions = [...c1, ...others].sort(
  (
    a: { categoryNumber: number; questionNumber: number },
    b: { categoryNumber: number; questionNumber: number }
  ) =>
    a.categoryNumber === b.categoryNumber
      ? a.questionNumber - b.questionNumber
      : a.categoryNumber - b.categoryNumber
);
manifest.questionCount = manifest.questions.length;
manifest.source = 'Forge Compatibility Profile structural manifest';
manifest.note =
  'Category 1 reduced to 10 questions (authoritative live catalog). Categories 2 through 10 still reflect the prior locked extraction and have not been reduced in this slice. Product target for the full profile is approximately 100 questions.';
writeFileSync(
  'lib/questionnaire/fixtures/master-structure-manifest.json',
  `${JSON.stringify(manifest, null, 2)}\n`
);

function esc(s: string) {
  return s.replace(/'/g, "''");
}
function qUuid(n: number) {
  return `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`;
}
function cUuid(q: number, c: number) {
  return `44444444-4444-4444-8${String(q).padStart(3, '0')}-${String(c).padStart(12, '0')}`;
}

let sql = `-- ---------------------------------------------------------------------------
-- 6. Category 1 seed
-- ---------------------------------------------------------------------------

insert into public.questionnaire_versions (id, version_key, specification_version, title, is_active)
values (
  '11111111-1111-4111-8111-111111111111',
  'compatibility_profile_v1',
  'compatibility_profile_category_1_v10',
  'Compatibility Profile',
  true
)
on conflict (version_key) do update set
  specification_version = excluded.specification_version,
  title = excluded.title,
  is_active = excluded.is_active;

insert into public.questionnaire_categories (
  id, version_id, category_key, category_number, title, status, display_order, locked_product_decisions
) values (
  '22222222-2222-4222-8222-222222222221',
  '11111111-1111-4111-8111-111111111111',
  'relationship_vision_intentions',
  1,
  'Relationship Vision & Intentions',
  'locked',
  1,
  '${esc(JSON.stringify([...CATEGORY_01_LOCKED_PRODUCT_DECISIONS]))}'::jsonb
)
on conflict (version_id, category_key) do update set
  title = excluded.title,
  status = excluded.status,
  display_order = excluded.display_order,
  locked_product_decisions = excluded.locked_product_decisions;

`;

for (const q of CATEGORY_01.questions) {
  const states = q.allowedSpecialResponseStates
    ? `array[${q.allowedSpecialResponseStates.map((s) => `'${s}'`).join(', ')}]::public.questionnaire_response_state[]`
    : 'null';
  sql += `insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, alignment_purpose, min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '${qUuid(q.number)}',
  '22222222-2222-4222-8222-222222222221',
  '${q.id}',
  ${q.number},
  '${esc(q.prompt)}',
  ${q.statement ? `'${esc(q.statement)}'` : 'null'},
  '${esc(q.formatLabel)}',
  '${q.responseBehavior}'::public.questionnaire_response_behavior,
  null,
  null,
  null,
  false,
  ${q.selectAllThatApply ? 'true' : 'false'},
  '${esc(q.alignmentPurpose)}',
  ${q.minSelections},
  ${q.maxSelections === null ? 'null' : q.maxSelections},
  ${q.priorityFollowUp ? `'${esc(q.priorityFollowUp.prompt)}'` : 'null'},
  ${q.priorityFollowUp ? q.priorityFollowUp.selectionCount : 'null'},
  true,
  null,
  null,
  ${
    q.priorityFollowUp
      ? (q.priorityFollowUp.minEligibleSelectionsBeforeDisplay ??
        q.priorityFollowUp.selectionCount)
      : 'null'
  },
  ${states},
  ${q.number}
)
on conflict (category_id, question_key) do update set
  question_number = excluded.question_number,
  prompt = excluded.prompt,
  statement = excluded.statement,
  format_label = excluded.format_label,
  response_behavior = excluded.response_behavior,
  alignment_purpose = excluded.alignment_purpose,
  min_selections = excluded.min_selections,
  max_selections = excluded.max_selections,
  priority_follow_up_prompt = excluded.priority_follow_up_prompt,
  priority_selection_count = excluded.priority_selection_count,
  priority_unordered = excluded.priority_unordered,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  display_order = excluded.display_order;

`;
  for (const c of q.choices) {
    sql += `insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state
) values (
  '${cUuid(q.number, c.displayOrder)}',
  '${qUuid(q.number)}',
  '${c.id}',
  '${esc(c.label)}',
  ${c.displayOrder},
  ${c.mutuallyExclusive ? 'true' : 'false'},
  ${
    c.specialResponseState
      ? `'${c.specialResponseState}'::public.questionnaire_response_state`
      : 'null'
  }
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state;

`;
  }
}

writeFileSync('/tmp/category-01-seed.sql', sql);
console.log(
  JSON.stringify({
    questions: CATEGORY_01.questions.length,
    manifestCount: manifest.questionCount,
    seedBytes: sql.length,
  })
);
