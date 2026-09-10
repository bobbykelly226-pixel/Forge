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

describe('questionnaire core V3', () => {
  it('ships ten three-question categories with no priority follow-ups', () => {
    assert.equal(QUESTIONNAIRE_VERSION, 'compatibility_profile_v3');
    assert.equal(SPECIFICATION_VERSION, 'compatibility_profile_core_30_v1');
    assert.equal(catalog.categories.length, 10);
    assert.equal(allQuestions.length, 30);
    assert.equal(validateQuestionnaireCatalog(catalog).ok, true);

    for (const category of catalog.categories) {
      assert.equal(category.questions.length, 3);
      assert.deepEqual(
        category.questions.map((question) => question.number),
        [1, 2, 3]
      );
      assert.ok(category.questions.every((question) => !question.priorityFollowUp));
      assert.ok(category.questions.every((question) => !question.conditional));
    }
    assert.equal(catalog.eligibilityRules.length, 0);
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

  it('retains faith and worldview context without making every category religious', () => {
    const faith = catalog.categories[6]!;
    const copy = faith.questions
      .flatMap((question) => [question.prompt, ...question.choices.map((choice) => choice.label)])
      .join(' ');
    assert.match(copy, faithLanguage);
  });

  it('uses a forward-only V3 migration that preserves prior versions and copies stable responses', () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        'supabase/migrations/20260910125048_relationship_alignment_v3.sql'
      ),
      'utf8'
    );
    assert.match(migration, /compatibility_profile_v3/);
    assert.match(migration, /compatibility_profile_core_30_v1/);
    assert.match(migration, /user_questionnaire_responses/);
    assert.match(migration, /user_questionnaire_selected_choices/);
    assert.match(migration, /forge_recalculate_questionnaire_progress/);
    assert.doesNotMatch(migration, /\bdelete\s+from\b/i);
    assert.doesNotMatch(migration, /\btruncate\b/i);
    assert.doesNotMatch(migration, /\bdrop\s+table\b/i);
  });
});
