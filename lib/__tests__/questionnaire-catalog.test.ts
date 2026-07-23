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
    assert.equal(catalog.categories[0].questions.length, 15);
  });

  it('imports exactly 15 sequential Category 1 questions with HQ prompts', () => {
    const master = extractCategory1Master();
    const prompts = [...master.matchAll(/^### (\d+)\. (.+)$/gm)].map((m) => ({
      number: Number(m[1]),
      prompt: m[2],
    }));
    assert.equal(prompts.length, 15);
    assert.deepEqual(
      CATEGORY_01.questions.map((q) => q.number),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    );
    for (const expected of prompts) {
      const actual = CATEGORY_01.questions.find((q) => q.number === expected.number);
      assert.ok(actual, `missing Q${expected.number}`);
      assert.equal(actual.prompt, expected.prompt);
    }
  });

  it('preserves every Category 1 option label exactly', () => {
    const master = extractCategory1Master();
    for (const question of CATEGORY_01.questions) {
      for (const choice of question.choices) {
        assert.ok(
          master.includes(choice.label),
          `Q${question.number} missing option in master: ${choice.label}`
        );
      }
      assert.equal(
        question.alignmentPurpose.length > 0,
        true,
        `Q${question.number} missing alignment purpose`
      );
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
    assert.equal(byNumber[5].priorityFollowUp?.unordered, true);
    assert.equal(
      byNumber[5].priorityFollowUp?.prompt,
      'Of the qualities you selected, which two matter most?'
    );

    assert.equal(byNumber[9].formatLabel, 'Select up to four');
    assert.equal(byNumber[9].responseBehavior, 'multi_select');
    assert.equal(byNumber[9].maxSelections, 4);
    assert.equal(byNumber[9].priorityFollowUp, undefined);

    assert.equal(byNumber[12].formatLabel, 'Select up to five');
    assert.equal(byNumber[12].responseBehavior, 'multi_select');
    assert.equal(byNumber[12].maxSelections, 5);
    assert.equal(byNumber[12].priorityFollowUp?.selectionCount, 2);
    assert.equal(byNumber[12].priorityFollowUp?.unordered, true);

    assert.equal(byNumber[15].formatLabel, 'Select up to five');
    assert.equal(byNumber[15].responseBehavior, 'multi_select');
    assert.equal(byNumber[15].maxSelections, 5);
    assert.equal(byNumber[15].priorityFollowUp?.selectionCount, 2);
    assert.equal(byNumber[15].priorityFollowUp?.unordered, true);

    for (const question of CATEGORY_01.questions) {
      if (![5, 12, 15].includes(question.number)) {
        assert.equal(
          question.priorityFollowUp,
          undefined,
          `Q${question.number} must not have a priority follow-up`
        );
      }
    }
  });

  it('preserves all seven locked product decisions', () => {
    assert.equal(CATEGORY_01_LOCKED_PRODUCT_DECISIONS.length, 7);
    assert.deepEqual(
      [...CATEGORY_01.lockedProductDecisions],
      [...CATEGORY_01_LOCKED_PRODUCT_DECISIONS]
    );
    const master = extractCategory1Master();
    for (const decision of CATEGORY_01_LOCKED_PRODUCT_DECISIONS) {
      assert.ok(master.includes(decision), `locked decision missing from master: ${decision}`);
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
          questions: base.categories[0].questions.slice(0, 14),
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

    const badPriority: QuestionnaireCatalog = {
      ...base,
      categories: [
        {
          ...base.categories[0],
          questions: base.categories[0].questions.map((q) =>
            q.number === 1
              ? {
                  ...q,
                  priorityFollowUp: {
                    prompt: 'Should not be allowed',
                    selectionCount: 2,
                    unordered: true,
                  },
                }
              : q
          ),
        },
      ],
    };
    const priorityResult = validateQuestionnaireCatalog(badPriority);
    assert.equal(priorityResult.ok, false);
    if (!priorityResult.ok) {
      assert.ok(
        priorityResult.issues.some((i) => i.code === 'priority_follow_up_unsupported')
      );
    }
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
    assert.match(migration, /user_questionnaire_priority_selected_fk/);
    assert.match(migration, /priority selections exceed configured selection count/);
    assert.match(migration, /selected choices exceed max_selections/);
    assert.match(migration, /mutually exclusive choice cannot combine/);
  });

  it('applies owner-only RLS for private responses and read-only catalog policies', () => {
    assert.match(migration, /enable row level security/);
    assert.match(migration, /questionnaire_versions_select_authenticated/);
    assert.match(migration, /user_questionnaire_responses_select_own/);
    assert.match(migration, /user_id = auth\.uid\(\)/);
    assert.match(
      migration,
      /revoke insert, update, delete on public\.questionnaire_questions from authenticated, anon/
    );
    assert.match(migration, /Not public profile data/);
  });

  it('seeds Category 1 title, 15 questions, and selection limits', () => {
    assert.match(migration, /Relationship Vision & Intentions/);
    assert.equal(
      (migration.match(/relationship_vision_intentions_q\d{2}/g) || []).length >= 15,
      true
    );
    for (let n = 1; n <= 15; n += 1) {
      assert.match(
        migration,
        new RegExp(`relationship_vision_intentions_q${String(n).padStart(2, '0')}`)
      );
    }
    // Q5/Q9 max 4, Q12/Q15 max 5 with format_label + response_behavior
    assert.match(migration, /'relationship_vision_intentions_q05',[\s\S]*?'Select up to four',[\s\S]*?'multi_select'/);
    assert.match(migration, /'relationship_vision_intentions_q05',[\s\S]*?\n\s*1,\n\s*4,\n\s*'Of the qualities you selected/);
    assert.match(migration, /'relationship_vision_intentions_q09',[\s\S]*?\n\s*1,\n\s*4,\n\s*null,\n\s*null,/);
    assert.match(migration, /'relationship_vision_intentions_q12',[\s\S]*?\n\s*1,\n\s*5,\n\s*'Of the areas you selected/);
    assert.match(migration, /'relationship_vision_intentions_q15',[\s\S]*?\n\s*1,\n\s*5,\n\s*'Of the foundations you selected/);
  });
});

describe('existing onboarding and Compatibility Engine V1 remain untouched', () => {
  it('does not modify onboarding UI or compatibility engine modules in this slice', () => {
    // Guard: foundation files exist, and classic onboarding paths still reference profile_answers.
    const onboarding = read('lib/data/onboarding.ts');
    assert.match(onboarding, /profile_answers/);
    assert.doesNotMatch(onboarding, /user_questionnaire_responses/);

    const engine = read('lib/compatibility/engine.ts');
    assert.ok(engine.length > 0);

    const shell = read('components/OnboardingShell.tsx');
    assert.doesNotMatch(shell, /getQuestionnaireCatalog|CATEGORY_01/);
  });
});
