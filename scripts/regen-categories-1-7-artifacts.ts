/**
 * Regenerates Categories 1–7 fixtures + migration seed + manifest from live catalog.
 * Keeps Categories 8–10 from the prior manifest (15 each) → total 115.
 *
 * Run: npx tsx scripts/regen-categories-1-7-artifacts.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

import {
  CATEGORY_01,
  CATEGORY_01_FORMAT_DISTRIBUTION,
  CATEGORY_01_LOCKED_PRODUCT_DECISIONS,
} from '../lib/questionnaire/catalog/category-01';
import {
  CATEGORY_02,
  CATEGORY_02_FORMAT_DISTRIBUTION,
  CATEGORY_02_LOCKED_PRODUCT_DECISIONS,
} from '../lib/questionnaire/catalog/category-02';
import {
  CATEGORY_03,
  CATEGORY_03_FORMAT_DISTRIBUTION,
  CATEGORY_03_LOCKED_PRODUCT_DECISIONS,
} from '../lib/questionnaire/catalog/category-03';
import {
  CATEGORY_04,
  CATEGORY_04_FORMAT_DISTRIBUTION,
  CATEGORY_04_LOCKED_PRODUCT_DECISIONS,
} from '../lib/questionnaire/catalog/category-04';
import {
  CATEGORY_05,
  CATEGORY_05_FORMAT_DISTRIBUTION,
  CATEGORY_05_LOCKED_PRODUCT_DECISIONS,
} from '../lib/questionnaire/catalog/category-05';
import {
  CATEGORY_06,
  CATEGORY_06_FORMAT_DISTRIBUTION,
  CATEGORY_06_LOCKED_PRODUCT_DECISIONS,
} from '../lib/questionnaire/catalog/category-06';
import {
  CATEGORY_07,
  CATEGORY_07_FORMAT_DISTRIBUTION,
  CATEGORY_07_LOCKED_PRODUCT_DECISIONS,
  CATEGORY_07_PARENTING_ELIGIBILITY,
} from '../lib/questionnaire/catalog/category-07';
import type { CategoryDefinition, QuestionDefinition } from '../lib/questionnaire/types';

type CategoryBundle = {
  category: CategoryDefinition;
  locked: readonly string[];
  formatDistribution: Record<string, readonly number[]>;
  excerptName: string;
};

const BUNDLES: CategoryBundle[] = [
  {
    category: CATEGORY_01,
    locked: CATEGORY_01_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_01_FORMAT_DISTRIBUTION,
    excerptName: 'category-01-master-excerpt.md',
  },
  {
    category: CATEGORY_02,
    locked: CATEGORY_02_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_02_FORMAT_DISTRIBUTION,
    excerptName: 'category-02-master-excerpt.md',
  },
  {
    category: CATEGORY_03,
    locked: CATEGORY_03_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_03_FORMAT_DISTRIBUTION,
    excerptName: 'category-03-master-excerpt.md',
  },
  {
    category: CATEGORY_04,
    locked: CATEGORY_04_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_04_FORMAT_DISTRIBUTION,
    excerptName: 'category-04-master-excerpt.md',
  },
  {
    category: CATEGORY_05,
    locked: CATEGORY_05_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_05_FORMAT_DISTRIBUTION,
    excerptName: 'category-05-master-excerpt.md',
  },
  {
    category: CATEGORY_06,
    locked: CATEGORY_06_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_06_FORMAT_DISTRIBUTION,
    excerptName: 'category-06-master-excerpt.md',
  },
  {
    category: CATEGORY_07,
    locked: CATEGORY_07_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_07_FORMAT_DISTRIBUTION,
    excerptName: 'category-07-master-excerpt.md',
  },
];

const VERSION_ID = '11111111-1111-4111-8111-111111111111';
const ELIGIBILITY_C07_UUID = '55555555-5555-4555-8555-000000000007';
const MIGRATION_PATH = 'supabase/migrations/20260723000000_questionnaire_foundation.sql';
const MANIFEST_PATH = 'lib/questionnaire/fixtures/master-structure-manifest.json';

function writeExcerpt(bundle: CategoryBundle) {
  const { category, locked, formatDistribution, excerptName } = bundle;
  let fixture = `# Category ${category.number} authoritative catalog excerpt

Authoritative Category ${category.number} content after the 10 question reduction.
Used for wording regression tests.

## Category ${category.number}: ${category.title}

`;

  for (const q of category.questions) {
    fixture += `### ${q.number}. ${q.prompt}\n\n`;
    fixture += `**Format:** ${q.formatLabel}\n\n`;
    if (q.statement) fixture += `${q.statement}\n\n`;
    if (q.contextNote) fixture += `**Context note:** ${q.contextNote}\n\n`;
    if (q.implementationNote) fixture += `**Implementation note:** ${q.implementationNote}\n\n`;
    for (const c of q.choices) fixture += `${c.label}\n`;
    fixture += `\n`;
    if (q.priorityFollowUp) {
      fixture += `**Priority follow up:** ${q.priorityFollowUp.prompt}\n\n`;
    }
    fixture += `**Alignment purpose:** ${q.alignmentPurpose}\n\n`;
  }

  fixture += `### Locked product decisions\n\n`;
  for (const d of locked) fixture += `${d}\n`;
  fixture += `\n### Final format distribution\n\n`;
  for (const [k, v] of Object.entries(formatDistribution)) {
    const values = v as readonly number[];
    fixture += `${k}: ${values.join(', ') || '(none)'}\n`;
  }
  writeFileSync(`lib/questionnaire/fixtures/${excerptName}`, fixture);
}

function isConditionalFormat(formatLabel: string): boolean {
  return (
    formatLabel === 'Conditional scenario based choice' ||
    formatLabel === 'Conditional scenario-based choice'
  );
}

function manifestEntry(category: CategoryDefinition) {
  return category.questions.map((q) => {
    const features: string[] = [];
    if (q.priorityFollowUp) features.push('priority_follow_up');
    if (q.selectAllThatApply) features.push('select_all');
    if (q.structuredIdentity) {
      features.push('structured_identity');
      if (q.structuredIdentity.allowsRefinement) features.push('identity_refinement');
      if (q.structuredIdentity.allowsUserSuppliedIdentity) {
        features.push('user_supplied_identity');
      }
      if (q.structuredIdentity.privacy.userControlsPublicDisplay) {
        features.push('identity_privacy');
      }
      if (q.structuredIdentity.privacy.userControlsPrivateMatchingUse) {
        features.push('identity_private_matching_control');
      }
    }
    if (q.conditional || isConditionalFormat(q.formatLabel)) {
      features.push('conditional_scenario');
    }
    if (q.eligibilityRuleId) features.push('eligibility');
    if (q.allowedSpecialResponseStates?.includes('context_dependent')) {
      features.push('context_dependent_state');
    }
    return {
      categoryNumber: category.number,
      categoryTitle: category.title,
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
      ...(q.structuredIdentity ? { structuredIdentity: q.structuredIdentity } : {}),
      hasContextNote: Boolean(q.contextNote),
      hasImplementationNote: Boolean(q.implementationNote),
      hasEligibility: Boolean(q.eligibilityRuleId),
      isConditionalScenario: Boolean(q.conditional) || isConditionalFormat(q.formatLabel),
    };
  });
}

for (const bundle of BUNDLES) writeExcerpt(bundle);

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const others = manifest.questions.filter(
  (q: { categoryNumber: number }) => q.categoryNumber > 7
);
const live = BUNDLES.flatMap((b) => manifestEntry(b.category));
manifest.questions = [...live, ...others].sort(
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
  'Categories 1 through 7 reduced to 10 questions each (authoritative live catalog). Categories 8 through 10 remain at 15 until later PRs. Total 115.';
if (manifest.questionCount !== 115) {
  throw new Error(`Expected 115 questions, got ${manifest.questionCount}`);
}
writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

function esc(s: string) {
  return s.replace(/'/g, "''");
}

function categoryUuid(n: number) {
  return `22222222-2222-4222-8222-${String(n).padStart(12, '0')}`;
}

function qUuid(categoryNumber: number, questionNumber: number) {
  if (categoryNumber === 1) {
    return `33333333-3333-4333-8333-${String(questionNumber).padStart(12, '0')}`;
  }
  return `33333333-3333-4333-8${String(categoryNumber).padStart(3, '0')}-${String(questionNumber).padStart(12, '0')}`;
}

function cUuid(categoryNumber: number, questionNumber: number, choiceOrder: number) {
  if (categoryNumber === 1) {
    return `44444444-4444-4444-8${String(questionNumber).padStart(3, '0')}-${String(choiceOrder).padStart(12, '0')}`;
  }
  return `44444444-4444-4444-8${String(categoryNumber).padStart(1)}${String(questionNumber).padStart(2, '0')}-${String(choiceOrder).padStart(12, '0')}`;
}

function structuredIdentitySql(q: QuestionDefinition): string {
  if (!q.structuredIdentity) return 'null';
  return `'${esc(JSON.stringify(q.structuredIdentity))}'::jsonb`;
}

function eligibilityRuleIdSql(q: QuestionDefinition): string {
  if (!q.eligibilityRuleId) return 'null';
  if (q.eligibilityRuleId === CATEGORY_07_PARENTING_ELIGIBILITY.id) {
    return `'${ELIGIBILITY_C07_UUID}'`;
  }
  throw new Error(`Unknown eligibility rule id: ${q.eligibilityRuleId}`);
}

let sql = `-- ---------------------------------------------------------------------------
-- 6. Categories 1 through 7 seed
-- ---------------------------------------------------------------------------

insert into public.questionnaire_versions (id, version_key, specification_version, title, is_active)
values (
  '${VERSION_ID}',
  'compatibility_profile_v1',
  'compatibility_profile_categories_1_7_v10',
  'Compatibility Profile',
  true
)
on conflict (version_key) do update set
  specification_version = excluded.specification_version,
  title = excluded.title,
  is_active = excluded.is_active;

insert into public.questionnaire_eligibility_rules (
  id, version_id, rule_key, description, condition
) values (
  '${ELIGIBILITY_C07_UUID}',
  '${VERSION_ID}',
  '${esc(CATEGORY_07_PARENTING_ELIGIBILITY.ruleKey)}',
  '${esc(CATEGORY_07_PARENTING_ELIGIBILITY.description)}',
  '${esc(JSON.stringify(CATEGORY_07_PARENTING_ELIGIBILITY.condition))}'::jsonb
)
on conflict (version_id, rule_key) do update set
  description = excluded.description,
  condition = excluded.condition;

`;

for (const bundle of BUNDLES) {
  const cat = bundle.category;
  sql += `insert into public.questionnaire_categories (
  id, version_id, category_key, category_number, title, status, display_order, locked_product_decisions
) values (
  '${categoryUuid(cat.number)}',
  '${VERSION_ID}',
  '${cat.id}',
  ${cat.number},
  '${esc(cat.title)}',
  'locked',
  ${cat.number},
  '${esc(JSON.stringify([...bundle.locked]))}'::jsonb
)
on conflict (version_id, category_key) do update set
  title = excluded.title,
  status = excluded.status,
  display_order = excluded.display_order,
  locked_product_decisions = excluded.locked_product_decisions;

`;

  for (const q of cat.questions) {
    const states = q.allowedSpecialResponseStates
      ? `array[${q.allowedSpecialResponseStates.map((s) => `'${s}'`).join(', ')}]::public.questionnaire_response_state[]`
      : 'null';
    sql += `insert into public.questionnaire_questions (
  id, category_id, question_key, question_number, prompt, statement,
  format_label, response_behavior, context_note, implementation_note, eligibility_rule_id,
  is_conditional, select_all_that_apply, structured_identity_config, alignment_purpose,
  min_selections, max_selections,
  priority_follow_up_prompt, priority_selection_count, priority_unordered,
  priority_eligible_choice_keys, priority_excluded_choice_keys, priority_min_eligible_selections,
  allowed_special_response_states, display_order
) values (
  '${qUuid(cat.number, q.number)}',
  '${categoryUuid(cat.number)}',
  '${q.id}',
  ${q.number},
  '${esc(q.prompt)}',
  ${q.statement ? `'${esc(q.statement)}'` : 'null'},
  '${esc(q.formatLabel)}',
  '${q.responseBehavior}'::public.questionnaire_response_behavior,
  ${q.contextNote ? `'${esc(q.contextNote)}'` : 'null'},
  ${q.implementationNote ? `'${esc(q.implementationNote)}'` : 'null'},
  ${eligibilityRuleIdSql(q)},
  ${q.conditional ? 'true' : 'false'},
  ${q.selectAllThatApply ? 'true' : 'false'},
  ${structuredIdentitySql(q)},
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
  context_note = excluded.context_note,
  implementation_note = excluded.implementation_note,
  eligibility_rule_id = excluded.eligibility_rule_id,
  is_conditional = excluded.is_conditional,
  select_all_that_apply = excluded.select_all_that_apply,
  structured_identity_config = excluded.structured_identity_config,
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
  '${cUuid(cat.number, q.number, c.displayOrder)}',
  '${qUuid(cat.number, q.number)}',
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
}

const migration = readFileSync(MIGRATION_PATH, 'utf8');
const startMarker = '-- ---------------------------------------------------------------------------\n-- 6. Categories';
const start = migration.indexOf(startMarker);
if (start < 0) {
  throw new Error('Could not find section 6 seed marker in migration');
}
const nextMigration = `${migration.slice(0, start).trimEnd()}\n\n${sql.trimEnd()}\n`;
writeFileSync(MIGRATION_PATH, nextMigration);

console.log(
  JSON.stringify({
    categories: BUNDLES.map((b) => ({
      number: b.category.number,
      questions: b.category.questions.length,
    })),
    manifestCount: manifest.questionCount,
    seedBytes: sql.length,
    priorities: manifest.questions.filter(
      (q: { priorityFollowUp?: unknown }) => q.priorityFollowUp
    ).length,
  })
);
