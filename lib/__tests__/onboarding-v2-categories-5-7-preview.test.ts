import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { CATEGORY_01 } from '@/lib/questionnaire/catalog/category-01';
import { CATEGORY_02 } from '@/lib/questionnaire/catalog/category-02';
import { CATEGORY_03 } from '@/lib/questionnaire/catalog/category-03';
import { CATEGORY_04 } from '@/lib/questionnaire/catalog/category-04';
import { CATEGORY_05 } from '@/lib/questionnaire/catalog/category-05';
import { CATEGORY_06 } from '@/lib/questionnaire/catalog/category-06';
import {
  CATEGORY_07,
  CATEGORY_07_PARENTING_ELIGIBILITY,
} from '@/lib/questionnaire/catalog/category-07';
import {
  getPreviewCategories,
  getQuestionnaireCatalog,
  SPECIFICATION_VERSION,
} from '@/lib/questionnaire/catalog';
import {
  advanceStep,
  canContinueFromStep,
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

describe('Categories 5 through 7 live catalogs', () => {
  it('exports exactly ten questions per category with consecutive IDs', () => {
    for (const category of [CATEGORY_05, CATEGORY_06, CATEGORY_07]) {
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
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_05), [1, 8]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_06), [2, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_07), [5, 6, 10]);
  });

  it('matches exact retained Category 5 prompts and choice counts', () => {
    assert.deepEqual(
      CATEGORY_05.questions.map((q) => q.prompt),
      [
        'Once two people have agreed to an exclusive relationship, what does exclusivity generally require?',
        'How should responsibilities generally be divided within a long term relationship?',
        'When one partner is carrying significantly more responsibility for a period of time, what should happen?',
        'How much independence should each person maintain within a committed relationship?',
        'Which areas should partners generally discuss before making a decision?',
        'When partners strongly disagree about a major decision affecting both people, how should the final decision be made?',
        'If one partner receives a major opportunity that would significantly disrupt the other person\'s life, what should matter most?',
        'What does reliability from a long term partner mean most to you?',
        'When one partner needs substantial emotional or practical support, what level of responsibility should the other partner generally assume?',
        'If a committed relationship becomes difficult for an extended period, what should determine whether the couple continues working on it?',
      ]
    );
    assert.equal(CATEGORY_05.questions[0].choices.length, 9);
    assert.equal(CATEGORY_05.questions[0].maxSelections, 4);
    assert.equal(
      CATEGORY_05.questions[0].priorityFollowUp?.prompt,
      'Of the expectations you selected, which two allow the least room for compromise?'
    );
    assert.equal(
      CATEGORY_05.questions[7].priorityFollowUp?.prompt,
      'Of the qualities you selected, which two matter most?'
    );
  });

  it('matches exact retained Category 6 and 7 first and last prompts', () => {
    assert.equal(
      CATEGORY_06.questions[0].prompt,
      'What role would you ideally like extended family to have in your long term relationship?'
    );
    assert.equal(
      CATEGORY_06.questions[9].prompt,
      'Which family or parenting differences would most seriously threaten long term compatibility?'
    );
    assert.equal(
      CATEGORY_07.questions[0].prompt,
      'Which description most closely reflects your current relationship with faith or spirituality?'
    );
    assert.equal(
      CATEGORY_07.questions[9].prompt,
      'Which faith, spiritual, or worldview related differences would most seriously threaten long term compatibility?'
    );
  });

  it('locks Category 6 select all and Category 7 structured identity / conditional metadata', () => {
    const familyPaths = CATEGORY_06.questions.find((q) => q.number === 4);
    assert.equal(familyPaths?.formatLabel, 'Select all that apply');
    assert.equal(familyPaths?.selectAllThatApply, true);
    assert.equal(familyPaths?.minSelections, 0);
    assert.equal(familyPaths?.maxSelections, null);

    const identity = CATEGORY_07.questions.find((q) => q.number === 2);
    assert.equal(identity?.formatLabel, 'Structured identity selection');
    assert.equal(identity?.responseBehavior, 'structured_identity');
    assert.equal(identity?.structuredIdentity?.allowsRefinement, true);
    assert.equal(identity?.structuredIdentity?.allowsUserSuppliedIdentity, true);
    assert.equal(identity?.structuredIdentity?.privacy.userControlsPublicDisplay, true);
    assert.equal(
      identity?.structuredIdentity?.privacy.userControlsPrivateMatchingUse,
      false
    );
    assert.ok(identity?.choices.some((c) => c.label === 'Baháʼí Faith'));

    const practices = CATEGORY_07.questions.find((q) => q.number === 3);
    assert.equal(practices?.selectAllThatApply, true);
    assert.equal(practices?.maxSelections, null);

    const parenting = CATEGORY_07.questions.find((q) => q.number === 9);
    assert.equal(parenting?.formatLabel, 'Conditional scenario based choice');
    assert.equal(parenting?.eligibilityRuleId, CATEGORY_07_PARENTING_ELIGIBILITY.id);
    assert.equal(parenting?.conditional?.kind, 'conditional_scenario');
    assert.equal(
      parenting?.conditional?.requiresEligibilityRuleId,
      CATEGORY_07_PARENTING_ELIGIBILITY.id
    );
  });

  it('matches fixture excerpts for Categories 5 through 7', () => {
    for (const [category, file] of [
      [CATEGORY_05, 'category-05-master-excerpt.md'],
      [CATEGORY_06, 'category-06-master-excerpt.md'],
      [CATEGORY_07, 'category-07-master-excerpt.md'],
    ] as const) {
      const fixture = read(`lib/questionnaire/fixtures/${file}`);
      for (const question of category.questions) {
        assert.match(fixture, new RegExp(question.prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        assert.match(
          fixture,
          new RegExp(
            `\\*\\*Format:\\*\\* ${question.formatLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
          )
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
    assert.deepEqual(walkCategory(CATEGORY_05), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(walkCategory(CATEGORY_06), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(walkCategory(CATEGORY_07), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('Categories 5 through 7 preview session behavior', () => {
  it('exposes Categories 1 through 7 with the Categories 1 to 7 specification version', () => {
    const preview = getPreviewCategories();
    assert.deepEqual(
      preview.map((c) => c.number),
      [1, 2, 3, 4, 5, 6, 7]
    );
    assert.equal(getQuestionnaireCatalog().specificationVersion, SPECIFICATION_VERSION);
    assert.equal(SPECIFICATION_VERSION, 'compatibility_profile_categories_1_7_v10');
    assert.equal(getQuestionnaireCatalog().eligibilityRules.length, 1);
    assert.match(DIRECTORY_COPY.body, /first seven/);
    assert.match(DIRECTORY_COPY.metadata, /1 through 7/);
    assert.match(PREVIEW_PAGE_DESCRIPTION, /1 through 7/);
  });

  it('preserves in memory answers across category switches and clears only on restart', () => {
    let answersByCategory: PreviewAnswersByCategory = {
      5: completeCategoryAnswers(CATEGORY_05),
      6: completeCategoryAnswers(CATEGORY_06),
    };
    assert.equal(isCategorySessionComplete(CATEGORY_05, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_06, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_07, answersByCategory), false);

    const cat5Before = getCategoryAnswers(answersByCategory, 5);
    answersByCategory = {
      ...answersByCategory,
      7: completeCategoryAnswers(CATEGORY_07),
    };
    assert.deepEqual(getCategoryAnswers(answersByCategory, 5), cat5Before);
    assert.equal(isCategorySessionComplete(CATEGORY_07, answersByCategory), true);

    answersByCategory = clearCategoryAnswers(answersByCategory, 6);
    assert.equal(isCategorySessionComplete(CATEGORY_06, answersByCategory), false);
    assert.equal(isCategorySessionComplete(CATEGORY_05, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_07, answersByCategory), true);
  });

  it('preserves Categories 1 through 4 wording and priority locations', () => {
    assert.equal(CATEGORY_01.title, 'Relationship Vision & Intentions');
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_01), [5, 8, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_02), [1, 9]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_03), [3, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_04), [6, 9, 10]);
    assert.equal(CATEGORY_02.questions.length, 10);
    assert.equal(CATEGORY_03.questions.length, 10);
    assert.equal(CATEGORY_04.questions.length, 10);
  });

  it('keeps user facing Category 5 through 7 and preview copy free of dash punctuation', () => {
    const values: Array<{ label: string; value: string }> = [
      { label: 'directory title', value: DIRECTORY_COPY.title },
      { label: 'directory body', value: DIRECTORY_COPY.body },
      { label: 'directory metadata', value: DIRECTORY_COPY.metadata },
      { label: 'preview notice', value: PREVIEW_NOTICE },
      { label: 'preview page description', value: PREVIEW_PAGE_DESCRIPTION },
    ];

    for (const category of [CATEGORY_05, CATEGORY_06, CATEGORY_07]) {
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
        if (question.contextNote) {
          values.push({
            label: `C${category.number} Q${question.number} context`,
            value: question.contextNote,
          });
        }
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
      'components/questionnaire-preview/QuestionnaireQuestion.tsx',
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
    const answers = completeCategoryAnswers(CATEGORY_05);
    let step: CategoryFlowStep = { kind: 'question', questionIndex: 8, phase: 'base' };
    step = retreatStep(CATEGORY_05, step, answers);
    assert.deepEqual(step, { kind: 'question', questionIndex: 7, phase: 'priority' });
  });
});
