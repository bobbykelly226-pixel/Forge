import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { getQuestionnaireCatalog } from '@/lib/questionnaire/catalog';
import { emptyPersistedAnswer } from '@/lib/questionnaire/persistence/answer-state';
import { toggleBaseSelection } from '@/lib/questionnaire/preview/category-01-preview-flow';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('rapid capped multi-select answers', () => {
  const catalog = getQuestionnaireCatalog();

  it('allows every capped multi-select question to reach its configured maximum', () => {
    const cappedQuestions = catalog.categories
      .flatMap((category) => category.questions)
      .filter(
        (question) =>
          question.responseBehavior === 'multi_select' &&
          question.maxSelections !== null &&
          question.maxSelections > 1
      );

    assert.ok(cappedQuestions.length > 0);

    for (const question of cappedQuestions) {
      let answer = emptyPersistedAnswer();
      const choices = question.choices
        .filter((choice) => !choice.mutuallyExclusive)
        .slice(0, question.maxSelections ?? 0);

      assert.equal(
        choices.length,
        question.maxSelections,
        `${question.id} does not have enough compatible choices`
      );

      for (const choice of choices) {
        const result = toggleBaseSelection(
          question,
          {
            selectedChoiceIds: answer.selectedChoiceIds,
            priorityChoiceIds: answer.priorityChoiceIds,
          },
          choice.id
        );
        assert.equal(result.ok, true, `${question.id} blocked ${choice.id} too early`);
        answer = {
          ...answer,
          selectedChoiceIds: result.answer.selectedChoiceIds,
          priorityChoiceIds: result.answer.priorityChoiceIds,
        };
      }

      assert.equal(
        answer.selectedChoiceIds.length,
        question.maxSelections,
        `${question.id} did not reach its advertised selection limit`
      );
    }
  });

  it('reads rapid taps from the eagerly updated answer snapshot', () => {
    const shell = read(
      'components/compatibility-profile/CompatibilityProfileShell.tsx'
    );
    const toggleHandler = shell.slice(
      shell.indexOf('async function handleToggleBase'),
      shell.indexOf('async function handleTogglePriority')
    );

    assert.match(shell, /const answersByCategoryRef = useRef\(initialAnswersByCategory\)/);
    assert.match(toggleHandler, /answersByCategoryRef\.current/);
    assert.doesNotMatch(toggleHandler, /answersByCategory\[category\.number\]/);
    assert.match(
      shell,
      /const next = update\(answersByCategoryRef\.current\);\s*answersByCategoryRef\.current = next;\s*setAnswersByCategory\(next\);/
    );
  });
});
