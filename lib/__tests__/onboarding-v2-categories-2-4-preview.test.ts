import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { CATEGORY_01 } from '@/lib/questionnaire/catalog/category-01';
import { CATEGORY_02 } from '@/lib/questionnaire/catalog/category-02';
import { CATEGORY_03 } from '@/lib/questionnaire/catalog/category-03';
import { CATEGORY_04 } from '@/lib/questionnaire/catalog/category-04';
import {
  getPreviewCategories,
  getQuestionnaireCatalog,
  SPECIFICATION_VERSION,
} from '@/lib/questionnaire/catalog';
import {
  advanceStep,
  canContinueFromStep,
  CATEGORY_INTRO_COPY,
  clearCategoryAnswers,
  DIRECTORY_COPY,
  getCategoryAnswers,
  getCompleteCopy,
  getIntroCopy,
  isCategoryPreviewComplete,
  isCategorySessionComplete,
  PREVIEW_NOTICE,
  PREVIEW_PAGE_DESCRIPTION,
  questionsWithPriorityFollowUp,
  retreatStep,
  shouldShowPriorityFollowUp,
  syncAnswerAfterBaseChange,
  type CategoryFlowStep,
  type PreviewAnswers,
  type PreviewAnswersByCategory,
} from '@/lib/questionnaire/preview/category-01-preview-flow';
import type { CategoryDefinition } from '@/lib/questionnaire/types';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const DASH_OR_HYPHEN_PATTERN = /[\u2010-\u2015\u2212—–-]/;

function assertNoDash(label: string, value: string) {
  assert.equal(
    DASH_OR_HYPHEN_PATTERN.test(value),
    false,
    `${label}: ${value.slice(0, 160)}`
  );
}

function completeCategoryAnswers(category: CategoryDefinition): PreviewAnswers {
  const answers: PreviewAnswers = {};
  for (const question of category.questions) {
    const pickCount = Math.max(
      question.minSelections,
      question.priorityFollowUp?.selectionCount ?? question.minSelections
    );
    const selected = question.choices.slice(0, pickCount).map((c) => c.id);
    let answer = syncAnswerAfterBaseChange(question, selected, []);
    if (shouldShowPriorityFollowUp(question, answer.selectedChoiceIds)) {
      answer = {
        ...answer,
        priorityChoiceIds: answer.selectedChoiceIds.slice(
          0,
          question.priorityFollowUp!.selectionCount
        ),
      };
    }
    answers[question.id] = answer;
  }
  return answers;
}

function walkCategory(category: CategoryDefinition) {
  const answers = completeCategoryAnswers(category);
  let step: CategoryFlowStep = { kind: 'intro' };
  const seen: number[] = [];
  step = advanceStep(category, step, answers);
  while (step.kind === 'question') {
    if (step.phase === 'base') seen.push(category.questions[step.questionIndex].number);
    assert.equal(canContinueFromStep(category, step, answers), true);
    step = advanceStep(category, step, answers);
  }
  assert.equal(step.kind, 'complete');
  assert.equal(isCategoryPreviewComplete(category, answers), true);
  return seen;
}

describe('Categories 2 through 4 live catalogs', () => {
  it('exports exactly ten questions per category with consecutive IDs', () => {
    for (const category of [CATEGORY_02, CATEGORY_03, CATEGORY_04]) {
      assert.equal(category.questions.length, 10);
      assert.deepEqual(
        category.questions.map((q) => q.number),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      );
      for (const question of category.questions) {
        assert.equal(
          question.id,
          `${category.id}_q${String(question.number).padStart(2, '0')}`
        );
        for (const choice of question.choices) {
          assert.equal(
            choice.id,
            `${question.id}_c${String(choice.displayOrder).padStart(2, '0')}`
          );
        }
      }
    }
  });

  it('keeps only the listed priority follow ups', () => {
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_02), [1, 9]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_03), [3, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_04), [6, 9, 10]);
    assert.equal(CATEGORY_04.questions.find((q) => q.number === 3)?.priorityFollowUp, undefined);
  });

  it('matches exact retained Category 2 prompts and excludes removed questions', () => {
    assert.deepEqual(
      CATEGORY_02.questions.map((q) => q.prompt),
      [
        'Which principles most strongly guide the way you try to live?',
        'If you realize you have acted against one of your own values, what are you most likely to do first?',
        'When keeping a commitment becomes substantially harder than expected, what do you generally believe someone should do?',
        'When your intentions were good but your actions still hurt someone, what matters most?',
        'When someone repeatedly makes choices you disagree with, how do you usually try to respond?',
        'Which approach to personal responsibility most closely reflects your beliefs?',
        'How comfortable are you admitting that an important belief or judgment of yours was wrong?',
        'When loyalty to someone conflicts with doing what you believe is right, which principle should generally come first?',
        'Which qualities are most important in the character of a long term partner?',
        "If a partner's behavior conflicted with a value they claimed to hold, what would matter most in deciding how you viewed it?",
      ]
    );
    const joined = CATEGORY_02.questions.map((q) => q.prompt).join('\n');
    assert.doesNotMatch(joined, /honesty when truth/i);
    assert.doesNotMatch(joined, /socially desirable/i);
  });

  it('matches exact retained Category 3 and 4 first and last prompts', () => {
    assert.equal(
      CATEGORY_03.questions[0].prompt,
      'When something important is bothering you in a relationship, how do you usually prefer to address it?'
    );
    assert.equal(
      CATEGORY_03.questions[9].prompt,
      'Which communication behaviors are most important in a long term partner?'
    );
    assert.equal(
      CATEGORY_04.questions[0].prompt,
      'When tension first develops between you and a partner, what are you most likely to do?'
    );
    assert.equal(
      CATEGORY_04.questions[9].prompt,
      'Which conflict patterns would most seriously threaten your willingness to remain in a relationship?'
    );
  });

  it('matches fixture excerpts for Categories 2 through 4', () => {
    for (const [category, file] of [
      [CATEGORY_02, 'category-02-master-excerpt.md'],
      [CATEGORY_03, 'category-03-master-excerpt.md'],
      [CATEGORY_04, 'category-04-master-excerpt.md'],
    ] as const) {
      const fixture = read(`lib/questionnaire/fixtures/${file}`);
      for (const question of category.questions) {
        assert.match(fixture, new RegExp(question.prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.match(
          fixture,
          new RegExp(`\\*\\*Format:\\*\\* ${question.formatLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
        );
        for (const choice of question.choices) {
          assert.match(fixture, new RegExp(choice.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        }
        if (question.priorityFollowUp) {
          assert.match(
            fixture,
            new RegExp(
              question.priorityFollowUp.prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            )
          );
        }
      }
    }
  });

  it('walks each category flow including priority substeps', () => {
    assert.deepEqual(walkCategory(CATEGORY_02), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(walkCategory(CATEGORY_03), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(walkCategory(CATEGORY_04), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('multi-category preview session behavior', () => {
  it('exposes Categories 1 through 4 in the preview directory set', () => {
    const preview = getPreviewCategories();
    assert.deepEqual(
      preview.map((c) => c.number),
      [1, 2, 3, 4]
    );
    assert.equal(getQuestionnaireCatalog().specificationVersion, SPECIFICATION_VERSION);
    assert.equal(SPECIFICATION_VERSION, 'compatibility_profile_categories_1_4_v10');
  });

  it('preserves in memory answers across category switches and clears only on restart', () => {
    let answersByCategory: PreviewAnswersByCategory = {
      2: completeCategoryAnswers(CATEGORY_02),
      3: completeCategoryAnswers(CATEGORY_03),
    };
    assert.equal(isCategorySessionComplete(CATEGORY_02, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_03, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_04, answersByCategory), false);

    const cat2Before = getCategoryAnswers(answersByCategory, 2);
    answersByCategory = {
      ...answersByCategory,
      4: completeCategoryAnswers(CATEGORY_04),
    };
    assert.deepEqual(getCategoryAnswers(answersByCategory, 2), cat2Before);
    assert.equal(isCategorySessionComplete(CATEGORY_04, answersByCategory), true);

    answersByCategory = clearCategoryAnswers(answersByCategory, 3);
    assert.equal(isCategorySessionComplete(CATEGORY_03, answersByCategory), false);
    assert.equal(isCategorySessionComplete(CATEGORY_02, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_04, answersByCategory), true);
  });

  it('preserves Category 1 wording and priority locations', () => {
    assert.equal(CATEGORY_01.title, 'Relationship Vision & Intentions');
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_01), [5, 8, 10]);
    assert.equal(getIntroCopy(1).supporting, CATEGORY_INTRO_COPY[1].supporting);
    assert.match(getIntroCopy(1).supporting, /There are no wrong answers/);
    assert.equal(
      getCompleteCopy(1).body,
      'This is the first part of the larger Forge Compatibility Profile. Your responses will eventually help Forge explain meaningful alignment while leaving the decision and the conversation to you.'
    );
  });

  it('keeps user facing Category 2 through 4 and preview copy free of dash punctuation', () => {
    const values: Array<{ label: string; value: string }> = [
      { label: 'directory title', value: DIRECTORY_COPY.title },
      { label: 'directory body', value: DIRECTORY_COPY.body },
      { label: 'directory metadata', value: DIRECTORY_COPY.metadata },
      { label: 'preview notice', value: PREVIEW_NOTICE },
      { label: 'preview page description', value: PREVIEW_PAGE_DESCRIPTION },
    ];

    for (const category of [CATEGORY_02, CATEGORY_03, CATEGORY_04]) {
      values.push({ label: `C${category.number} title`, value: category.title });
      const intro = getIntroCopy(category.number);
      values.push(
        { label: `C${category.number} intro body`, value: intro.body },
        { label: `C${category.number} intro supporting`, value: intro.supporting },
        { label: `C${category.number} intro metadata`, value: intro.metadata }
      );
      const complete = getCompleteCopy(category.number);
      values.push(
        { label: `C${category.number} complete eyebrow`, value: complete.eyebrow },
        { label: `C${category.number} complete body`, value: complete.body }
      );
      for (const question of category.questions) {
        values.push(
          { label: `C${category.number} Q${question.number} prompt`, value: question.prompt },
          {
            label: `C${category.number} Q${question.number} format`,
            value: question.formatLabel,
          }
        );
        if (question.priorityFollowUp) {
          values.push({
            label: `C${category.number} Q${question.number} priority`,
            value: question.priorityFollowUp.prompt,
          });
        }
        for (const choice of question.choices) {
          values.push({
            label: `C${category.number} Q${question.number} c${choice.displayOrder}`,
            value: choice.label,
          });
        }
      }
    }

    for (const { label, value } of values) {
      assertNoDash(label, value);
    }
  });

  it('does not introduce questionnaire database writes in preview modules', () => {
    const files = [
      'components/questionnaire-preview/CompatibilityProfilePreviewShell.tsx',
      'components/questionnaire-preview/CategoryPreviewDirectory.tsx',
      'app/onboarding-v2-preview/page.tsx',
      'lib/questionnaire/preview/category-01-preview-flow.ts',
    ];
    for (const file of files) {
      const source = read(file);
      assert.doesNotMatch(source, /saveProfileAnswer|finishOnboarding|profile_answers/);
      assert.doesNotMatch(
        source,
        /user_questionnaire_progress|user_questionnaire_responses|user_questionnaire_selected_choices|user_questionnaire_priority_selections/
      );
    }
  });

  it('supports retreat into priority substeps after base answers exist', () => {
    const answers = completeCategoryAnswers(CATEGORY_04);
    let step: CategoryFlowStep = { kind: 'question', questionIndex: 6, phase: 'base' };
    step = retreatStep(CATEGORY_04, step, answers);
    assert.deepEqual(step, { kind: 'question', questionIndex: 5, phase: 'priority' });
  });
});
