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
import { CATEGORY_07 } from '@/lib/questionnaire/catalog/category-07';
import {
  CATEGORY_08,
  CATEGORY_08_PARENTING_ELIGIBILITY,
} from '@/lib/questionnaire/catalog/category-08';
import {
  CATEGORY_09,
  CATEGORY_09_PARENTING_ELIGIBILITY,
} from '@/lib/questionnaire/catalog/category-09';
import { CATEGORY_10 } from '@/lib/questionnaire/catalog/category-10';
import {
  getPreviewCategories,
  getQuestionnaireCatalog,
  SPECIFICATION_VERSION,
} from '@/lib/questionnaire/catalog';
import {
  advanceStep,
  areAllCategoriesSessionComplete,
  canContinueFromStep,
  clearAllPreviewAnswers,
  clearCategoryAnswers,
  countAllCompletedPriorityFollowUps,
  countAnsweredBaseQuestions,
  DIRECTORY_COPY,
  emptyAnswer,
  getCategoryAnswers,
  getCompleteCopy,
  getIntroCopy,
  isCategoryPreviewComplete,
  isCategorySessionComplete,
  OVERALL_COMPLETE_COPY,
  PREVIEW_NOTICE,
  PREVIEW_PAGE_DESCRIPTION,
  questionsWithPriorityFollowUp,
  retreatStep,
  shouldShowPriorityFollowUp,
  syncAnswerAfterBaseChange,
  toggleBaseSelection,
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

const ALL_CATEGORIES = [
  CATEGORY_01,
  CATEGORY_02,
  CATEGORY_03,
  CATEGORY_04,
  CATEGORY_05,
  CATEGORY_06,
  CATEGORY_07,
  CATEGORY_08,
  CATEGORY_09,
  CATEGORY_10,
];

describe('Categories 8 through 10 live catalogs', () => {
  it('exports exactly ten questions per category with consecutive IDs', () => {
    for (const category of [CATEGORY_08, CATEGORY_09, CATEGORY_10]) {
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
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_08), [4, 5, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_09), [3, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_10), [1, 10]);
  });

  it('matches exact retained Category 8 prompts and choice counts', () => {
    assert.deepEqual(
      CATEGORY_08.questions.map((q) => q.prompt),
      [
        'How would you describe your current political identity?',
        'How important is it that a long term partner shares your general political outlook?',
        'Which aspects of political or civic life are currently part of how you participate?',
        'Which political or civic principles matter most to you in a long term relationship?',
        'Which public issues would be most important for you and a partner to approach compatibly?',
        'When you and a partner disagree about a political or social issue, what should guide the conversation most strongly?',
        'What level of political discussion would you ideally want within a long term relationship?',
        'How should a couple handle voting, political affiliation, and personal civic choices?',
        'If children were part of the relationship, how should politics and civic life primarily be approached in their upbringing?',
        'Which political or civic differences would most seriously threaten long term compatibility?',
      ]
    );
    assert.equal(CATEGORY_08.questions[0].choices.length, 13);
    assert.equal(CATEGORY_08.questions[0].responseBehavior, 'structured_identity');
    assert.equal(
      CATEGORY_08.questions[0].structuredIdentity?.privacy.userControlsPrivateMatchingUse,
      true
    );
    assert.equal(CATEGORY_08.questions[3].maxSelections, 5);
    assert.equal(
      CATEGORY_08.questions[3].priorityFollowUp?.prompt,
      'Of the principles you selected, which two allow the least room for compromise?'
    );
    assert.equal(
      CATEGORY_08.questions[4].priorityFollowUp?.prompt,
      'Of the issues you selected, which two would be most difficult to navigate if you and your partner substantially disagreed?'
    );
    assert.equal(
      CATEGORY_08.questions[9].priorityFollowUp?.prompt,
      'Of the differences you selected, which two would be most difficult for you to move past?'
    );
  });

  it('matches exact retained Category 9 and 10 first and last prompts', () => {
    assert.equal(
      CATEGORY_09.questions[0].prompt,
      'How significant a role does service or contribution to others currently play in your life?'
    );
    assert.equal(
      CATEGORY_09.questions[9].prompt,
      'Which service related differences would most seriously threaten long term compatibility?'
    );
    assert.equal(
      CATEGORY_10.questions[0].prompt,
      'Which behaviors most strongly build trust for you?'
    );
    assert.equal(
      CATEGORY_10.questions[9].prompt,
      'Which integrity related behaviors would most seriously threaten long term compatibility?'
    );
  });

  it('removes the retired former questions from Categories 8 through 10', () => {
    const allPrompts = [CATEGORY_08, CATEGORY_09, CATEGORY_10].flatMap((c) =>
      c.questions.map((q) => q.prompt)
    );
    for (const removed of [
      'How important is politics or civic life in your identity?',
      'Which forms of contribution would you most want a partner to respect or support?',
      'How important is honesty in a long term relationship?',
      'Which integrity related differences could you genuinely accept in a long term partner?',
    ]) {
      assert.equal(allPrompts.includes(removed), false, removed);
    }
  });

  it('locks Category 8 through 10 advanced metadata', () => {
    const identity = CATEGORY_08.questions.find((q) => q.number === 1)!;
    assert.equal(identity.formatLabel, 'Structured identity selection');
    assert.equal(identity.structuredIdentity?.allowsRefinement, true);
    assert.equal(identity.structuredIdentity?.allowsUserSuppliedIdentity, true);

    const civic = CATEGORY_08.questions.find((q) => q.number === 3)!;
    assert.equal(civic.selectAllThatApply, true);
    assert.equal(civic.maxSelections, null);
    assert.equal(
      civic.choices.find((c) => c.label === 'None of these currently apply to me')
        ?.mutuallyExclusive,
      true
    );

    const discussion = CATEGORY_08.questions.find((q) => q.number === 7)!;
    assert.equal(
      discussion.formatLabel,
      'Discussion frequency range with separate no preference response'
    );
    assert.ok(discussion.allowedSpecialResponseStates?.includes('no_preference'));
    assert.equal(
      discussion.choices.find((c) => c.label.startsWith('No particular preference'))
        ?.specialResponseState,
      'no_preference'
    );

    const parenting8 = CATEGORY_08.questions.find((q) => q.number === 9)!;
    assert.equal(parenting8.eligibilityRuleId, CATEGORY_08_PARENTING_ELIGIBILITY.id);
    assert.equal(parenting8.conditional?.kind, 'conditional_scenario');

    const serviceForms = CATEGORY_09.questions.find((q) => q.number === 2)!;
    assert.equal(serviceForms.selectAllThatApply, true);
    assert.ok(serviceForms.allowedQualifiers?.includes('limited_capacity_contribution'));
    assert.equal(
      serviceForms.choices.find((c) => c.label === 'None of these currently apply to me')
        ?.mutuallyExclusive,
      true
    );
    assert.equal(
      serviceForms.choices.find((c) => c.label === 'Another form of contribution')
        ?.opensOptionalContext,
      true
    );

    const motivations = CATEGORY_09.questions.find((q) => q.number === 3)!;
    assert.deepEqual(motivations.priorityFollowUp?.excludedChoiceIds, [
      'service_community_contribution_q03_c14',
      'service_community_contribution_q03_c15',
    ]);
    assert.equal(
      motivations.choices.find(
        (c) => c.label === 'Service is not currently a major personal priority'
      )?.specialResponseState,
      'current_priority'
    );

    const parenting9 = CATEGORY_09.questions.find((q) => q.number === 9)!;
    assert.equal(parenting9.eligibilityRuleId, CATEGORY_09_PARENTING_ELIGIBILITY.id);

    const disclosure = CATEGORY_10.questions.find((q) => q.number === 2)!;
    assert.equal(disclosure.selectAllThatApply, true);
    assert.equal(
      disclosure.choices.find((c) =>
        c.label.startsWith('Nothing beyond what each partner voluntarily chooses')
      )?.mutuallyExclusive,
      true
    );

    const privacy = CATEGORY_10.questions.find((q) => q.number === 3)!;
    assert.equal(privacy.formatLabel, 'Privacy boundary range');
    assert.equal(
      privacy.choices.find((c) => c.label.startsWith('No fixed approach'))
        ?.specialResponseState,
      'context_dependent'
    );

    const repair = CATEGORY_10.questions.find((q) => q.number === 7)!;
    assert.equal(
      repair.formatLabel,
      'Trust repair posture with a separate context dependent state'
    );
    assert.equal(
      repair.choices.find((c) => c.label.startsWith('The appropriate response depends'))
        ?.specialResponseState,
      'context_dependent'
    );
  });

  it('enforces Category 9 Q3 priority exclusion and current priority mutual exclusivity', () => {
    const motivations = CATEGORY_09.questions.find((q) => q.number === 3)!;
    const specificA = motivations.choices[0]!;
    const specificB = motivations.choices[1]!;
    const nonspecific = motivations.choices.find(
      (c) => c.label === 'I contribute without needing one particular motivation'
    )!;
    const notPriority = motivations.choices.find(
      (c) => c.label === 'Service is not currently a major personal priority'
    )!;

    let answer = emptyAnswer();
    answer = toggleBaseSelection(motivations, answer, specificA.id).answer;
    answer = toggleBaseSelection(motivations, answer, specificB.id).answer;
    answer = toggleBaseSelection(motivations, answer, nonspecific.id).answer;
    assert.equal(shouldShowPriorityFollowUp(motivations, answer.selectedChoiceIds), true);

    answer = toggleBaseSelection(motivations, answer, notPriority.id).answer;
    assert.deepEqual(answer.selectedChoiceIds, [notPriority.id]);
    assert.equal(shouldShowPriorityFollowUp(motivations, answer.selectedChoiceIds), false);
  });

  it('matches fixture excerpts for Categories 8 through 10', () => {
    for (const [category, file] of [
      [CATEGORY_08, 'category-08-master-excerpt.md'],
      [CATEGORY_09, 'category-09-master-excerpt.md'],
      [CATEGORY_10, 'category-10-master-excerpt.md'],
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
    assert.deepEqual(walkCategory(CATEGORY_08), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(walkCategory(CATEGORY_09), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(walkCategory(CATEGORY_10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('enforces Category 10 protections in catalog and preview surfaces', () => {
    const locked = CATEGORY_10.lockedProductDecisions.join(' ');
    assert.match(locked, /honesty score/i);
    assert.match(locked, /trust ranking/i);
    assert.match(locked, /integrity percentage/i);
    assert.match(locked, /moral judgment/i);
    assert.match(locked, /safety diagnosis/i);
    assert.match(locked, /must not be interpreted as evidence/);

    const previewFiles = [
      'components/questionnaire-preview/CompatibilityProfilePreviewShell.tsx',
      'components/questionnaire-preview/CategoryPreviewDirectory.tsx',
      'components/questionnaire-preview/QuestionnaireQuestion.tsx',
      'components/questionnaire-preview/PreviewOverallComplete.tsx',
      'lib/questionnaire/preview/category-01-preview-flow.ts',
    ];
    for (const file of previewFiles) {
      const source = read(file);
      assert.doesNotMatch(source, /Honesty score|Trust ranking|Integrity percentage/i);
      assert.doesNotMatch(source, /moral judgment|safety diagnosis/i);
    }
  });
});

describe('Categories 8 through 10 preview session behavior', () => {
  it('exposes all ten categories with the final specification version', () => {
    const preview = getPreviewCategories();
    assert.deepEqual(
      preview.map((c) => c.number),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    );
    assert.equal(getQuestionnaireCatalog().specificationVersion, SPECIFICATION_VERSION);
    assert.equal(SPECIFICATION_VERSION, 'compatibility_profile_calibrated_80_v1');
    assert.equal(getQuestionnaireCatalog().eligibilityRules.length, 3);
    assert.match(DIRECTORY_COPY.body, /all ten/);
    assert.match(DIRECTORY_COPY.metadata, /1 through 10/);
    assert.match(PREVIEW_PAGE_DESCRIPTION, /all ten/);
  });

  it('preserves in memory answers across category switches and clears only on restart', () => {
    let answersByCategory: PreviewAnswersByCategory = {
      8: completeCategoryAnswers(CATEGORY_08),
      9: completeCategoryAnswers(CATEGORY_09),
    };
    assert.equal(isCategorySessionComplete(CATEGORY_08, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_09, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_10, answersByCategory), false);

    const cat8Before = getCategoryAnswers(answersByCategory, 8);
    answersByCategory = {
      ...answersByCategory,
      10: completeCategoryAnswers(CATEGORY_10),
    };
    assert.deepEqual(getCategoryAnswers(answersByCategory, 8), cat8Before);
    assert.equal(isCategorySessionComplete(CATEGORY_10, answersByCategory), true);

    answersByCategory = clearCategoryAnswers(answersByCategory, 9);
    assert.equal(isCategorySessionComplete(CATEGORY_09, answersByCategory), false);
    assert.equal(isCategorySessionComplete(CATEGORY_08, answersByCategory), true);
    assert.equal(isCategorySessionComplete(CATEGORY_10, answersByCategory), true);
  });

  it('requires all ten categories and 100 valid answers for overall completion', () => {
    let answersByCategory: PreviewAnswersByCategory = {};
    for (const category of ALL_CATEGORIES) {
      answersByCategory = {
        ...answersByCategory,
        [category.number]: completeCategoryAnswers(category),
      };
    }
    assert.equal(areAllCategoriesSessionComplete(ALL_CATEGORIES, answersByCategory), true);
    assert.equal(countAnsweredBaseQuestions(ALL_CATEGORIES, answersByCategory), 100);
    assert.equal(countAllCompletedPriorityFollowUps(ALL_CATEGORIES, answersByCategory), 24);

    answersByCategory = clearCategoryAnswers(answersByCategory, 10);
    assert.equal(areAllCategoriesSessionComplete(ALL_CATEGORIES, answersByCategory), false);
    assert.equal(isCategorySessionComplete(CATEGORY_10, answersByCategory), false);
    // Select all questions with minSelections 0 remain valid when empty, so the
    // cleared category can still contribute those auto valid rows to the count.
    assert.equal(countAnsweredBaseQuestions(ALL_CATEGORIES, answersByCategory), 91);
    assert.ok(countAnsweredBaseQuestions(ALL_CATEGORIES, answersByCategory) < 100);
  });

  it('full restart confirmation clears all preview responses', () => {
    let answersByCategory: PreviewAnswersByCategory = {
      1: completeCategoryAnswers(CATEGORY_01),
      8: completeCategoryAnswers(CATEGORY_08),
      10: completeCategoryAnswers(CATEGORY_10),
    };
    answersByCategory = clearAllPreviewAnswers();
    assert.deepEqual(answersByCategory, {});
    assert.equal(areAllCategoriesSessionComplete(ALL_CATEGORIES, answersByCategory), false);

    const overall = read('components/questionnaire-preview/PreviewOverallComplete.tsx');
    assert.match(overall, /Confirm restart/);
    assert.match(overall, /alertdialog/);
    assert.match(overall, /OVERALL_COMPLETE_COPY\.restartConfirm/);
  });

  it('directory and overall completion copy remain exact', () => {
    assert.equal(OVERALL_COMPLETE_COPY.eyebrow, 'Compatibility Profile Preview Complete');
    assert.equal(OVERALL_COMPLETE_COPY.heading, 'You completed all ten categories');
    assert.equal(OVERALL_COMPLETE_COPY.summaryQuestions, '100 of 100 questions answered');
    assert.equal(OVERALL_COMPLETE_COPY.summaryCategories, '10 of 10 categories completed');
    assert.equal(OVERALL_COMPLETE_COPY.summaryNotSaved, 'Preview answers were not saved');
    assert.equal(PREVIEW_NOTICE, 'Preview mode. Your answers are not being saved yet.');
  });

  it('preserves Categories 1 through 7 wording and priority locations', () => {
    assert.equal(CATEGORY_01.title, 'Relationship Vision & Intentions');
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_01), [5, 8, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_02), [1, 9]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_03), [3, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_04), [6, 9, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_05), [1, 8]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_06), [2, 10]);
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_07), [5, 6, 10]);
    for (const category of [
      CATEGORY_01,
      CATEGORY_02,
      CATEGORY_03,
      CATEGORY_04,
      CATEGORY_05,
      CATEGORY_06,
      CATEGORY_07,
    ]) {
      assert.equal(category.questions.length, 10);
    }
  });

  it('keeps user facing Category 8 through 10 and preview copy free of dash punctuation', () => {
    const values: Array<{ label: string; value: string }> = [
      { label: 'directory title', value: DIRECTORY_COPY.title },
      { label: 'directory body', value: DIRECTORY_COPY.body },
      { label: 'directory metadata', value: DIRECTORY_COPY.metadata },
      { label: 'preview notice', value: PREVIEW_NOTICE },
      { label: 'preview page description', value: PREVIEW_PAGE_DESCRIPTION },
      { label: 'overall eyebrow', value: OVERALL_COMPLETE_COPY.eyebrow },
      { label: 'overall heading', value: OVERALL_COMPLETE_COPY.heading },
      { label: 'overall body', value: OVERALL_COMPLETE_COPY.body },
      { label: 'overall restart confirm', value: OVERALL_COMPLETE_COPY.restartConfirm },
    ];

    for (const category of [CATEGORY_08, CATEGORY_09, CATEGORY_10]) {
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
        if (question.statement) {
          values.push({
            label: `C${category.number} Q${question.number} statement`,
            value: question.statement,
          });
        }
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
      'components/questionnaire-preview/PreviewOverallComplete.tsx',
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

  it('keeps the structural manifest at exactly 100 with no synthetic placeholders', () => {
    const manifest = JSON.parse(
      read('lib/questionnaire/fixtures/master-structure-manifest.json')
    ) as {
      questionCount: number;
      note: string;
      questions: Array<{ categoryNumber: number; formatLabel: string }>;
    };
    assert.equal(manifest.questionCount, 100);
    assert.match(manifest.note, /Total 100/);
    assert.doesNotMatch(manifest.note, /15 until later/);
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      assert.equal(
        manifest.questions.filter((q) => q.categoryNumber === n).length,
        10
      );
    }
    assert.equal(
      getQuestionnaireCatalog().categories.every((c) => !c.id.startsWith('synth_')),
      true
    );
  });

  it('supports retreat into priority substeps after base answers exist', () => {
    const answers = completeCategoryAnswers(CATEGORY_08);
    let step: CategoryFlowStep = { kind: 'question', questionIndex: 5, phase: 'base' };
    step = retreatStep(CATEGORY_08, step, answers);
    assert.deepEqual(step, { kind: 'question', questionIndex: 4, phase: 'priority' });
  });

  it('seeds Categories 8 through 10 and eligibility rules in the migration', () => {
    const migration = read('supabase/migrations/20260723000000_questionnaire_foundation.sql');
    assert.match(migration, /politics_civic_life_social_issues/);
    assert.match(migration, /service_community_contribution/);
    assert.match(migration, /integrity_honesty_trust/);
    assert.match(migration, /parenting_role_display_c08/);
    assert.match(migration, /parenting_role_display_c09/);
    assert.match(migration, /compatibility_profile_categories_1_10_v10/);
    assert.match(migration, /'service_community_contribution_q02_c19'/);
    assert.match(
      migration,
      /'service_community_contribution_q02_c19',[\s\S]{0,400}?true,\n\s*'\{"kind":"free_text"/
    );
  });
});
