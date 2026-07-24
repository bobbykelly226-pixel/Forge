/**
 * Regenerates Categories 1–10 fixtures + migration seed + manifest from live catalog.
 * After this PR the Compatibility Profile is exactly 100 questions.
 *
 * Run: npx tsx scripts/regen-categories-1-10-artifacts.ts
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
import {
  CATEGORY_08,
  CATEGORY_08_FORMAT_DISTRIBUTION,
  CATEGORY_08_LOCKED_PRODUCT_DECISIONS,
  CATEGORY_08_PARENTING_ELIGIBILITY,
} from '../lib/questionnaire/catalog/category-08';
import {
  CATEGORY_09,
  CATEGORY_09_FORMAT_DISTRIBUTION,
  CATEGORY_09_LOCKED_PRODUCT_DECISIONS,
  CATEGORY_09_PARENTING_ELIGIBILITY,
} from '../lib/questionnaire/catalog/category-09';
import {
  CATEGORY_10,
  CATEGORY_10_FORMAT_DISTRIBUTION,
  CATEGORY_10_LOCKED_PRODUCT_DECISIONS,
} from '../lib/questionnaire/catalog/category-10';
import type {
  CategoryDefinition,
  EligibilityRuleDefinition,
  QuestionDefinition,
} from '../lib/questionnaire/types';

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
  {
    category: CATEGORY_08,
    locked: CATEGORY_08_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_08_FORMAT_DISTRIBUTION,
    excerptName: 'category-08-master-excerpt.md',
  },
  {
    category: CATEGORY_09,
    locked: CATEGORY_09_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_09_FORMAT_DISTRIBUTION,
    excerptName: 'category-09-master-excerpt.md',
  },
  {
    category: CATEGORY_10,
    locked: CATEGORY_10_LOCKED_PRODUCT_DECISIONS,
    formatDistribution: CATEGORY_10_FORMAT_DISTRIBUTION,
    excerptName: 'category-10-master-excerpt.md',
  },
];

const ELIGIBILITY_RULES: EligibilityRuleDefinition[] = [
  CATEGORY_07_PARENTING_ELIGIBILITY,
  CATEGORY_08_PARENTING_ELIGIBILITY,
  CATEGORY_09_PARENTING_ELIGIBILITY,
];

const VERSION_ID = '11111111-1111-4111-8111-111111111111';
const ELIGIBILITY_UUIDS: Record<string, string> = {
  [CATEGORY_07_PARENTING_ELIGIBILITY.id]: '55555555-5555-4555-8555-000000000007',
  [CATEGORY_08_PARENTING_ELIGIBILITY.id]: '55555555-5555-4555-8555-000000000008',
  [CATEGORY_09_PARENTING_ELIGIBILITY.id]: '55555555-5555-4555-8555-000000000009',
};
const MIGRATION_PATH = 'supabase/migrations/20260723000000_questionnaire_foundation.sql';
const MANIFEST_PATH = 'lib/questionnaire/fixtures/master-structure-manifest.json';
const SPECIFICATION_VERSION = 'compatibility_profile_categories_1_10_v10';

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
    for (const c of q.choices) {
      fixture += c.mutuallyExclusive ? `${c.label} (mutually exclusive)\n` : `${c.label}\n`;
    }
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

function choiceIndexFromId(choiceId: string): number | null {
  const match = choiceId.match(/_c(\d+)$/);
  return match ? Number(match[1]) : null;
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
    if (q.contextNote) features.push('context_note');
    if (q.implementationNote) features.push('implementation_note');
    if (q.choices.some((c) => c.mutuallyExclusive)) {
      features.push('mutually_exclusive_choice');
    }
    if (q.choices.some((c) => c.opensOptionalContext)) {
      features.push('optional_choice_context');
    }
    if (q.choices.some((c) => c.qualifierCoexistsWithSelections)) {
      features.push('qualifier_may_coexist');
    }
    if (q.allowedSpecialResponseStates?.includes('no_preference')) {
      features.push('no_preference_state');
    }
    if (q.allowedSpecialResponseStates?.includes('context_dependent')) {
      features.push('context_dependent_state');
    }
    if (q.allowedSpecialResponseStates?.includes('current_priority')) {
      features.push('current_priority_state');
    }
    if (q.allowedSpecialResponseStates?.includes('no_specific_requirement')) {
      features.push('no_specific_requirement');
    }
    if (q.allowedQualifiers?.includes('limited_openness')) {
      features.push('limited_openness_qualifier');
    }
    if (q.allowedQualifiers?.includes('evaluation_preference')) {
      features.push('evaluation_preference_state');
    }
    if (q.priorityFollowUp?.excludedChoiceIds?.length) {
      features.push('priority_excluded_choices');
      features.push('priority_min_eligible');
    } else if (
      q.priorityFollowUp &&
      (q.priorityFollowUp.minEligibleSelectionsBeforeDisplay ??
        q.priorityFollowUp.selectionCount) === q.priorityFollowUp.selectionCount
    ) {
      // Standard priority still records min eligible when configured.
    }
    if (
      q.priorityFollowUp?.minEligibleSelectionsBeforeDisplay != null &&
      !features.includes('priority_min_eligible')
    ) {
      features.push('priority_min_eligible');
    }

    const excludedIndexes = (q.priorityFollowUp?.excludedChoiceIds ?? [])
      .map(choiceIndexFromId)
      .filter((n): n is number => n != null);

    const specialChoices = q.choices
      .filter(
        (c) =>
          c.specialResponseState ||
          c.mutuallyExclusive ||
          c.qualifier ||
          c.opensOptionalContext ||
          excludedIndexes.includes(c.displayOrder)
      )
      .map((c) => ({
        index: c.displayOrder,
        ...(c.specialResponseState ? { specialResponseState: c.specialResponseState } : {}),
        ...(c.mutuallyExclusive ? { mutuallyExclusive: true } : {}),
        ...(c.qualifier
          ? {
              qualifier: c.qualifier,
              qualifierCoexistsWithSelections: !!c.qualifierCoexistsWithSelections,
            }
          : {}),
        ...(c.opensOptionalContext && c.optionalContext
          ? {
              opensOptionalContext: true,
              optionalContext: c.optionalContext,
            }
          : {}),
        ...(excludedIndexes.includes(c.displayOrder) ? { excludeFromPriority: true } : {}),
      }));

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
      features: [...new Set(features)].sort(),
      specialChoices,
      ...(q.allowedSpecialResponseStates
        ? { allowedSpecialResponseStates: q.allowedSpecialResponseStates }
        : {}),
      ...(q.allowedQualifiers ? { allowedQualifiers: q.allowedQualifiers } : {}),
      ...(q.priorityFollowUp
        ? {
            priorityFollowUp: {
              selectionCount: q.priorityFollowUp.selectionCount,
              unordered: true as const,
              minEligibleSelectionsBeforeDisplay:
                q.priorityFollowUp.minEligibleSelectionsBeforeDisplay ??
                q.priorityFollowUp.selectionCount,
              ...(excludedIndexes.length
                ? { excludedChoiceIndexes: excludedIndexes }
                : {}),
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

const live = BUNDLES.flatMap((b) => manifestEntry(b.category));
const manifest = {
  source: 'Forge Compatibility Profile structural manifest',
  note: 'Categories 1 through 10 reduced to 10 questions each (authoritative live catalog). Total 100.',
  questionCount: live.length,
  questions: live.sort(
    (
      a: { categoryNumber: number; questionNumber: number },
      b: { categoryNumber: number; questionNumber: number }
    ) =>
      a.categoryNumber === b.categoryNumber
        ? a.questionNumber - b.questionNumber
        : a.categoryNumber - b.categoryNumber
  ),
};
if (manifest.questionCount !== 100) {
  throw new Error(`Expected 100 questions, got ${manifest.questionCount}`);
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
  // Categories 2 through 9 use 8NQQ. Category 10 uses 8aQQ so the UUID group stays 4 hex chars.
  const categoryToken = categoryNumber === 10 ? 'a' : String(categoryNumber);
  return `44444444-4444-4444-8${categoryToken}${String(questionNumber).padStart(2, '0')}-${String(choiceOrder).padStart(12, '0')}`;
}

function structuredIdentitySql(q: QuestionDefinition): string {
  if (!q.structuredIdentity) return 'null';
  return `'${esc(JSON.stringify(q.structuredIdentity))}'::jsonb`;
}

function eligibilityRuleIdSql(q: QuestionDefinition): string {
  if (!q.eligibilityRuleId) return 'null';
  const uuid = ELIGIBILITY_UUIDS[q.eligibilityRuleId];
  if (!uuid) {
    throw new Error(`Unknown eligibility rule id: ${q.eligibilityRuleId}`);
  }
  return `'${uuid}'`;
}

function excludedChoiceKeysSql(q: QuestionDefinition): string {
  if (!q.priorityFollowUp?.excludedChoiceIds?.length) return 'null';
  return `'${esc(JSON.stringify(q.priorityFollowUp.excludedChoiceIds))}'::jsonb`;
}

function allowedQualifiersSql(q: QuestionDefinition): string {
  if (!q.allowedQualifiers?.length) return 'null';
  return `array[${q.allowedQualifiers.map((s) => `'${s}'`).join(', ')}]::public.questionnaire_response_qualifier[]`;
}

let sql = `-- ---------------------------------------------------------------------------
-- 6. Categories 1 through 10 seed
-- ---------------------------------------------------------------------------

insert into public.questionnaire_versions (id, version_key, specification_version, title, is_active)
values (
  '${VERSION_ID}',
  'compatibility_profile_v1',
  '${SPECIFICATION_VERSION}',
  'Compatibility Profile',
  true
)
on conflict (version_key) do update set
  specification_version = excluded.specification_version,
  title = excluded.title,
  is_active = excluded.is_active;

`;

for (const rule of ELIGIBILITY_RULES) {
  sql += `insert into public.questionnaire_eligibility_rules (
  id, version_id, rule_key, description, condition
) values (
  '${ELIGIBILITY_UUIDS[rule.id]}',
  '${VERSION_ID}',
  '${esc(rule.ruleKey)}',
  '${esc(rule.description)}',
  '${esc(JSON.stringify(rule.condition))}'::jsonb
)
on conflict (version_id, rule_key) do update set
  description = excluded.description,
  condition = excluded.condition;

`;
}

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
  allowed_special_response_states, allowed_qualifiers, display_order
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
  ${excludedChoiceKeysSql(q)},
  ${
    q.priorityFollowUp
      ? (q.priorityFollowUp.minEligibleSelectionsBeforeDisplay ??
        q.priorityFollowUp.selectionCount)
      : 'null'
  },
  ${states},
  ${allowedQualifiersSql(q)},
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
  priority_excluded_choice_keys = excluded.priority_excluded_choice_keys,
  priority_min_eligible_selections = excluded.priority_min_eligible_selections,
  allowed_special_response_states = excluded.allowed_special_response_states,
  allowed_qualifiers = excluded.allowed_qualifiers,
  display_order = excluded.display_order;

`;
    for (const c of q.choices) {
      sql += `insert into public.questionnaire_answer_choices (
  id, question_id, choice_key, label, display_order, mutually_exclusive, special_response_state,
  qualifier, qualifier_coexists_with_selections, opens_optional_context, optional_context_config
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
  },
  ${c.qualifier ? `'${c.qualifier}'::public.questionnaire_response_qualifier` : 'null'},
  ${c.qualifierCoexistsWithSelections ? 'true' : 'false'},
  ${c.opensOptionalContext ? 'true' : 'false'},
  ${
    c.optionalContext
      ? `'${esc(JSON.stringify(c.optionalContext))}'::jsonb`
      : 'null'
  }
)
on conflict (question_id, choice_key) do update set
  label = excluded.label,
  display_order = excluded.display_order,
  mutually_exclusive = excluded.mutually_exclusive,
  special_response_state = excluded.special_response_state,
  qualifier = excluded.qualifier,
  qualifier_coexists_with_selections = excluded.qualifier_coexists_with_selections,
  opens_optional_context = excluded.opens_optional_context,
  optional_context_config = excluded.optional_context_config;

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
    eligibilityRules: ELIGIBILITY_RULES.length,
  })
);
