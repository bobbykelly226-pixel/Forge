import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  getQuestionnaireCatalog,
  QUESTIONNAIRE_VERSION,
  SPECIFICATION_VERSION,
} from '@/lib/questionnaire/catalog';
import { validateQuestionnaireCatalog } from '@/lib/questionnaire/validate';

const catalog = getQuestionnaireCatalog();
const allQuestions = catalog.categories.flatMap((category) => category.questions);
const faithLanguage =
  /faith|god|jesus|christian|prayer|pray|spiritual|religious|church|worldview|belief|principle/i;

describe('questionnaire calibration V2', () => {
  it('ships ten eight-question categories with no priority follow-ups', () => {
    assert.equal(QUESTIONNAIRE_VERSION, 'compatibility_profile_v2');
    assert.equal(SPECIFICATION_VERSION, 'compatibility_profile_calibrated_80_v1');
    assert.equal(catalog.categories.length, 10);
    assert.equal(allQuestions.length, 80);
    assert.equal(validateQuestionnaireCatalog(catalog).ok, true);

    for (const category of catalog.categories) {
      assert.equal(category.questions.length, 8);
      assert.deepEqual(
        category.questions.map((question) => question.number),
        [1, 2, 3, 4, 5, 6, 7, 8]
      );
      assert.ok(category.questions.every((question) => !question.priorityFollowUp));
    }
  });

  it('keeps capped multi-select answer lists concise', () => {
    const cappedMultiSelects = allQuestions.filter(
      (question) =>
        question.responseBehavior === 'multi_select' &&
        question.maxSelections !== null
    );
    assert.ok(cappedMultiSelects.length > 0);
    for (const question of cappedMultiSelects) {
      assert.ok(
        question.choices.length <= 8,
        `${question.id} has ${question.choices.length} choices`
      );
      assert.ok(question.choices.length >= question.maxSelections!);
    }
  });

  it('separates everyday communication from conflict and repair', () => {
    const communication = catalog.categories[2];
    const conflict = catalog.categories[3];

    assert.equal(communication.title, 'Communication & Emotional Connection');
    assert.equal(conflict.title, 'Conflict & Repair');
    assert.match(
      communication.questions.map((question) => question.prompt).join(' '),
      /talk|heard|contact|sharing|feelings|communication/i
    );
    assert.match(
      conflict.questions.map((question) => question.prompt).join(' '),
      /tension|disagreement|compromise|apology|forgiveness|conflict/i
    );
    assert.equal(
      communication.questions.some((question) =>
        conflict.questions.some((other) => other.prompt === question.prompt)
      ),
      false
    );
  });

  it('lists conservative political identities first in the approved order', () => {
    const politicalIdentity = catalog.categories[7].questions[0];
    assert.deepEqual(
      politicalIdentity.choices.slice(0, 8).map((choice) => choice.label),
      [
        'Conservative',
        'Libertarian',
        'Independent',
        'Moderate',
        'Centrist',
        'Politically mixed',
        'Liberal',
        'Progressive',
      ]
    );
  });

  it('includes natural faith-guided language in every category', () => {
    for (const category of catalog.categories) {
      const copy = category.questions
        .flatMap((question) => [
          question.prompt,
          ...question.choices.map((choice) => choice.label),
        ])
        .join(' ');
      assert.match(copy, faithLanguage, `Category ${category.number}`);
    }
  });

  it('uses a forward-only V2 seed that preserves V1 and carries no priority data', () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        'supabase/migrations/20260728040337_questionnaire_calibration_v2.sql'
      ),
      'utf8'
    );
    assert.match(migration, /compatibility_profile_v2/);
    assert.match(migration, /compatibility_profile_calibrated_80_v1/);
    assert.match(migration, /priority_follow_up_prompt[\s\S]*priority_selection_count = null/i);
    assert.doesNotMatch(migration, /\bdelete\s+from\b/i);
    assert.doesNotMatch(migration, /\btruncate\b/i);
    assert.doesNotMatch(migration, /\bdrop\s+table\b/i);
  });
});
