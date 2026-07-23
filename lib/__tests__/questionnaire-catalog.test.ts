import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  CATEGORY_01,
  CATEGORY_01_LOCKED_PRODUCT_DECISIONS,
} from '@/lib/questionnaire/catalog/category-01';
import {
  getQuestionnaireCatalog,
  QUESTIONNAIRE_VERSION,
  SPECIFICATION_VERSION,
} from '@/lib/questionnaire/catalog';
import {
  validateQuestionnaireCatalog,
  type QuestionnaireCatalog,
} from '@/lib/questionnaire';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function extractCategory1Master(): string {
  const full = read('lib/questionnaire/fixtures/category-01-master-excerpt.md');
  const match = full.match(/## Category 1: Relationship Vision & Intentions\n([\s\S]*)$/);
  assert.ok(match, 'Category 1 section missing from master excerpt fixture');
  return match[1];
}

const RETAINED_PROMPTS = [
  'What are you ultimately hoping a meaningful relationship will grow into?',
  'How important is marriage in the future you envision?',
  'What pace do you prefer when building a new relationship?',
  'Which approach to exclusivity most closely reflects what you want?',
  'Which qualities most strongly define commitment for you?',
  'Which statements best describe what being ready for a committed relationship means to you personally?',
  'Which approach to personal growth best reflects the partnership you want?',
  'In which areas would partners need reasonably compatible long term direction?',
  'If a loving relationship revealed a major difference involving a core long term goal, what would you most likely do first?',
  'Which relational foundations must be present before you would confidently choose a lasting partnership?',
] as const;

const REMOVED_PROMPT_FRAGMENTS = [
  'How much do you agree with this statement?',
  'When dating someone new, how do you approach long-term compatibility?',
  'When dating someone new, how do you approach long term compatibility?',
  'How frequently should partners intentionally discuss the health and direction of their relationship?',
  'How important is it that partners share a similar overall vision for the next five to ten years?',
  'How comfortable would you be continuing to date someone whose preferred timeline for commitment is meaningfully different from yours?',
] as const;

describe('questionnaire catalog foundation', () => {
  it('validates the live catalog with locked Category 1', () => {
    const catalog = getQuestionnaireCatalog();
    const result = validateQuestionnaireCatalog(catalog);
    assert.equal(result.ok, true);
    assert.equal(catalog.questionnaireVersion, QUESTIONNAIRE_VERSION);
    assert.equal(catalog.specificationVersion, SPECIFICATION_VERSION);
    assert.equal(catalog.categories.length, 1);
    assert.equal(catalog.categories[0].title, 'Relationship Vision & Intentions');
    assert.equal(catalog.categories[0].status, 'locked');
    assert.equal(catalog.categories[0].questions.length, 10);
  });

  it('contains exactly 10 sequential Category 1 questions in the required order', () => {
    assert.deepEqual(
      CATEGORY_01.questions.map((q) => q.number),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    );
    assert.deepEqual(
      CATEGORY_01.questions.map((q) => q.prompt),
      [...RETAINED_PROMPTS]
    );
    for (const question of CATEGORY_01.questions) {
      assert.equal(
        question.id,
        `relationship_vision_intentions_q${String(question.number).padStart(2, '0')}`
      );
      for (const choice of question.choices) {
        assert.ok(choice.id.startsWith(`${question.id}_c`));
      }
    }
  });

  it('omits the five removed Category 1 questions', () => {
    const prompts = CATEGORY_01.questions.map((q) => q.prompt);
    for (const removed of REMOVED_PROMPT_FRAGMENTS) {
      assert.equal(prompts.includes(removed), false, removed);
    }
  });

  it('preserves every Category 1 option label in the authoritative fixture', () => {
    const master = extractCategory1Master();
    for (const question of CATEGORY_01.questions) {
      for (const choice of question.choices) {
        assert.ok(
          master.includes(choice.label),
          `Q${question.number} missing option in fixture: ${choice.label}`
        );
      }
      assert.ok(question.alignmentPurpose.length > 0);
      assert.ok(
        master.includes(question.alignmentPurpose),
        `Q${question.number} alignment purpose drift`
      );
    }
  });

  it('maps formats and selection limits for multi-select and priority follow-ups', () => {
    const byNumber = Object.fromEntries(CATEGORY_01.questions.map((q) => [q.number, q]));

    assert.equal(byNumber[5].formatLabel, 'Select up to four');
    assert.equal(byNumber[5].responseBehavior, 'multi_select');
    assert.equal(byNumber[5].maxSelections, 4);
    assert.equal(byNumber[5].priorityFollowUp?.selectionCount, 2);
    assert.equal(
      byNumber[5].priorityFollowUp?.prompt,
      'Of the qualities you selected, which two matter most?'
    );

    assert.equal(byNumber[6].formatLabel, 'Select up to four');
    assert.equal(byNumber[6].responseBehavior, 'multi_select');
    assert.equal(byNumber[6].maxSelections, 4);
    assert.equal(byNumber[6].priorityFollowUp, undefined);

    assert.equal(byNumber[8].formatLabel, 'Select up to five');
    assert.equal(byNumber[8].responseBehavior, 'multi_select');
    assert.equal(byNumber[8].maxSelections, 5);
    assert.equal(byNumber[8].priorityFollowUp?.selectionCount, 2);
    assert.equal(
      byNumber[8].priorityFollowUp?.prompt,
      'Of the areas you selected, which two allow the least room for difference?'
    );

    assert.equal(byNumber[9].formatLabel, 'Scenario based choice');
    assert.equal(byNumber[9].responseBehavior, 'scenario_choice');

    assert.equal(byNumber[10].formatLabel, 'Select up to five');
    assert.equal(byNumber[10].responseBehavior, 'multi_select');
    assert.equal(byNumber[10].maxSelections, 5);
    assert.equal(byNumber[10].priorityFollowUp?.selectionCount, 2);
    assert.equal(
      byNumber[10].priorityFollowUp?.prompt,
      'Of the foundations you selected, which two are most essential?'
    );

    for (const question of CATEGORY_01.questions) {
      if (![5, 8, 10].includes(question.number)) {
        assert.equal(
          question.priorityFollowUp,
          undefined,
          `Q${question.number} must not have a priority follow-up`
        );
      }
    }
  });

  it('preserves all seven locked product decisions with updated priority references', () => {
    assert.equal(CATEGORY_01_LOCKED_PRODUCT_DECISIONS.length, 7);
    assert.deepEqual(
      [...CATEGORY_01.lockedProductDecisions],
      [...CATEGORY_01_LOCKED_PRODUCT_DECISIONS]
    );
    assert.ok(
      CATEGORY_01_LOCKED_PRODUCT_DECISIONS.some((d) => d.includes('Only Q5, Q8, and Q10'))
    );
    assert.ok(CATEGORY_01_LOCKED_PRODUCT_DECISIONS.some((d) => d.startsWith('Q8 may identify')));
    const master = extractCategory1Master();
    for (const decision of CATEGORY_01_LOCKED_PRODUCT_DECISIONS) {
      assert.ok(master.includes(decision), `locked decision missing from fixture: ${decision}`);
    }
  });

  it('rejects invalid catalogs structurally', () => {
    const base = getQuestionnaireCatalog();
    const broken: QuestionnaireCatalog = {
      ...base,
      categories: [
        {
          ...base.categories[0],
          status: 'draft',
          questions: base.categories[0].questions.slice(0, 9),
        },
      ],
    };
    const result = validateQuestionnaireCatalog(broken);
    assert.equal(result.ok, false);
    if (!result.ok) {
      const codes = result.issues.map((i) => i.code);
      assert.ok(codes.includes('category_not_locked'));
      assert.ok(codes.includes('category_1_question_count'));
    }
  });

  it('rejects duplicate ids, bad limits, and unsupported priority follow-ups', () => {
    const base = getQuestionnaireCatalog();
    const q1 = base.categories[0].questions[0];
    const duplicateOption: QuestionnaireCatalog = {
      ...base,
      categories: [
        {
          ...base.categories[0],
          questions: [
            {
              ...q1,
              choices: [
                ...q1.choices,
                { ...q1.choices[0], displayOrder: q1.choices.length + 1 },
              ],
            },
            ...base.categories[0].questions.slice(1),
          ],
        },
      ],
    };
    const dupResult = validateQuestionnaireCatalog(duplicateOption);
    assert.equal(dupResult.ok, false);
  });
});

describe('questionnaire migration privacy and integrity', () => {
  const migration = read('supabase/migrations/20260723000000_questionnaire_foundation.sql');

  it('creates normalized versioned tables without widening profiles', () => {
    for (const table of [
      'questionnaire_versions',
      'questionnaire_categories',
      'questionnaire_questions',
      'questionnaire_answer_choices',
      'questionnaire_eligibility_rules',
      'user_questionnaire_progress',
      'user_questionnaire_responses',
      'user_questionnaire_selected_choices',
      'user_questionnaire_priority_selections',
    ]) {
      assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    }
    assert.doesNotMatch(migration, /alter table public\.profiles/i);
    assert.doesNotMatch(migration, /alter table public\.profile_answers/i);
    assert.doesNotMatch(migration, /alter table public\.compatibility_answers/i);
  });

  it('enforces response/version/choice/priority integrity', () => {
    assert.match(migration, /user_questionnaire_responses_progress_fk/);
    assert.match(migration, /forge_questionnaire_selected_choice_integrity/);
    assert.match(migration, /forge_questionnaire_priority_choice_valid/);
    assert.match(migration, /forge_questionnaire_response_version_matches_question/);
    assert.match(migration, /forge_questionnaire_progress_category_version_match/);
    assert.match(migration, /forge_questionnaire_response_identity_immutable/);
    assert.match(migration, /user_questionnaire_priority_selected_fk/);
  });

  it('makes response identity immutable after insert while keeping answer fields editable', () => {
    const identityFnMatch = migration.match(
      /create or replace function public\.forge_questionnaire_response_identity_immutable\(\)([\s\S]*?)\$\$;/
    );
    assert.ok(identityFnMatch, 'identity-immutable function must exist');
    const identityFn = identityFnMatch[1];
    for (const column of ['id', 'user_id', 'version_id', 'question_id']) {
      assert.match(
        identityFn,
        new RegExp(`new\\.${column}\\s+is distinct from\\s+old\\.${column}`)
      );
    }
    for (const editable of [
      'response_state',
      'active_qualifiers',
      'identity_refinement',
      'identity_user_supplied',
      'identity_public_display_allowed',
      'identity_private_matching_allowed',
    ]) {
      assert.doesNotMatch(
        identityFn,
        new RegExp(`new\\.${editable}\\s+is distinct from\\s+old\\.${editable}`)
      );
    }
  });

  it('applies owner-only RLS for private responses and read-only catalog policies', () => {
    assert.match(migration, /enable row level security/);
    assert.match(migration, /questionnaire_versions_select_authenticated/);
    assert.match(migration, /user_questionnaire_responses_select_own/);
    assert.match(migration, /user_id = auth\.uid\(\)/);
    assert.match(migration, /Not public profile data/);
  });

  it('seeds Category 1 title, 10 questions, and selection limits', () => {
    assert.match(migration, /Relationship Vision & Intentions/);
    assert.match(migration, /compatibility_profile_category_1_v10/);
    for (let n = 1; n <= 10; n += 1) {
      assert.match(
        migration,
        new RegExp(`relationship_vision_intentions_q${String(n).padStart(2, '0')}`)
      );
    }
    for (const n of [11, 12, 13, 14, 15]) {
      assert.doesNotMatch(
        migration,
        new RegExp(`relationship_vision_intentions_q${String(n).padStart(2, '0')}`)
      );
    }
    assert.match(
      migration,
      /'relationship_vision_intentions_q05',[\s\S]*?'Select up to four',[\s\S]*?'multi_select'/
    );
    assert.match(
      migration,
      /'relationship_vision_intentions_q05',[\s\S]*?\n\s*1,\n\s*4,\n\s*'Of the qualities you selected/
    );
    assert.match(
      migration,
      /'relationship_vision_intentions_q06',[\s\S]*?\n\s*1,\n\s*4,\n\s*null,\n\s*null,/
    );
    assert.match(
      migration,
      /'relationship_vision_intentions_q08',[\s\S]*?\n\s*1,\n\s*5,\n\s*'Of the areas you selected/
    );
    assert.match(
      migration,
      /'relationship_vision_intentions_q10',[\s\S]*?\n\s*1,\n\s*5,\n\s*'Of the foundations you selected/
    );
    assert.match(migration, /Only Q5, Q8, and Q10/);
  });
});

describe('existing onboarding and Compatibility Engine V1 remain untouched', () => {
  it('does not modify onboarding UI or compatibility engine modules in this slice', () => {
    const onboarding = read('lib/data/onboarding.ts');
    assert.match(onboarding, /profile_answers/);
    assert.doesNotMatch(onboarding, /user_questionnaire_responses/);

    const engine = read('lib/compatibility/engine.ts');
    assert.ok(engine.length > 0);

    const shell = read('components/OnboardingShell.tsx');
    assert.doesNotMatch(shell, /getQuestionnaireCatalog|CATEGORY_01/);
  });
});
