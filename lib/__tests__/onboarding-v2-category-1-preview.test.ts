import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { CATEGORY_01 } from '@/lib/questionnaire/catalog/category-01';
import {
  advanceStep,
  canContinueFromStep,
  emptyAnswer,
  getAnswer,
  INTRO_COPY,
  isCategoryPreviewComplete,
  isMultiSelectAtMax,
  PREVIEW_NOTICE,
  questionsWithPriorityFollowUp,
  retreatStep,
  SELECTION_LIMIT_MESSAGE,
  selectionLimitGuidance,
  shouldShowPriorityFollowUp,
  syncAnswerAfterBaseChange,
  toggleBaseSelection,
  togglePrioritySelection,
  type PreviewAnswers,
  type PreviewStep,
} from '@/lib/questionnaire/preview/category-01-preview-flow';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function listFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFilesRecursive(full));
    else files.push(full);
  }
  return files;
}

const DASH_PATTERN = /[\u2010-\u2015\u2212—–]/;
const FORBIDDEN_HYPHEN_PHRASES = [
  'long-term',
  'follow-through',
  'non-negotiable',
  'Extended-family',
  'fast-moving',
  'follow-up',
  'Priority follow-up',
];

describe('Category 1 onboarding preview flow', () => {
  it('uses all 10 live Category 1 questions in order', () => {
    assert.equal(CATEGORY_01.questions.length, 10);
    assert.equal(CATEGORY_01.title, 'Relationship Vision & Intentions');
    assert.deepEqual(
      CATEGORY_01.questions.map((q) => q.number),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    );

    let step: PreviewStep = { kind: 'intro' };
    const answers: PreviewAnswers = {};
    const seen: number[] = [];

    step = advanceStep(CATEGORY_01, step, answers);
    while (step.kind === 'question') {
      const question = CATEGORY_01.questions[step.questionIndex];
      if (step.phase === 'base') {
        seen.push(question.number);
        const pick = question.choices.slice(0, question.minSelections).map((c) => c.id);
        answers[question.id] = syncAnswerAfterBaseChange(question, pick, []);
        if (shouldShowPriorityFollowUp(question, answers[question.id].selectedChoiceIds)) {
          const need =
            question.priorityFollowUp?.minEligibleSelectionsBeforeDisplay ??
            question.priorityFollowUp?.selectionCount ??
            2;
          const enough = question.choices.slice(0, need).map((c) => c.id);
          answers[question.id] = syncAnswerAfterBaseChange(question, enough, []);
        }
      } else {
        const required = question.priorityFollowUp!.selectionCount;
        answers[question.id] = {
          ...getAnswer(answers, question.id),
          priorityChoiceIds: getAnswer(answers, question.id).selectedChoiceIds.slice(
            0,
            required
          ),
        };
      }
      assert.equal(canContinueFromStep(CATEGORY_01, step, answers), true);
      step = advanceStep(CATEGORY_01, step, answers);
    }

    assert.equal(step.kind, 'complete');
    assert.deepEqual(seen, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('does not duplicate Category 1 question wording in the preview implementation', () => {
    const previewFiles = [
      ...listFilesRecursive(join(process.cwd(), 'components/questionnaire-preview')),
      join(process.cwd(), 'app/onboarding-v2-preview/page.tsx'),
      join(process.cwd(), 'lib/questionnaire/preview/category-01-preview-flow.ts'),
    ].map((p) => readFileSync(p, 'utf8'));
    const joined = previewFiles.join('\n');

    for (const question of CATEGORY_01.questions) {
      assert.equal(
        joined.includes(question.prompt),
        false,
        `prompt duplicated for Q${question.number}`
      );
      if (question.priorityFollowUp) {
        assert.equal(
          joined.includes(question.priorityFollowUp.prompt),
          false,
          `priority prompt duplicated for Q${question.number}`
        );
      }
      for (const choice of question.choices) {
        assert.equal(
          joined.includes(choice.label),
          false,
          `choice label duplicated for ${choice.id}`
        );
      }
    }
  });

  it('replaces prior choices for single-choice answers', () => {
    const question = CATEGORY_01.questions[0];
    let answer = emptyAnswer();
    let result = toggleBaseSelection(question, answer, question.choices[0].id);
    assert.equal(result.ok, true);
    answer = result.answer;
    result = toggleBaseSelection(question, answer, question.choices[2].id);
    assert.equal(result.ok, true);
    assert.deepEqual(result.answer.selectedChoiceIds, [question.choices[2].id]);
  });

  it('enforces multi-select maximum limits without silent replacement', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 5)!;
    let answer = emptyAnswer();
    for (let i = 0; i < 4; i += 1) {
      const result = toggleBaseSelection(question, answer, question.choices[i].id);
      assert.equal(result.ok, true);
      answer = result.answer;
    }
    assert.equal(answer.selectedChoiceIds.length, 4);
    const blocked = toggleBaseSelection(question, answer, question.choices[4].id);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.reason, 'at_max');
    assert.deepEqual(blocked.answer.selectedChoiceIds, answer.selectedChoiceIds);
  });

  it('produces visible selection-limit guidance immediately at max without requiring another click', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 5)!;
    assert.equal(selectionLimitGuidance(question, 3), null);
    assert.equal(selectionLimitGuidance(question, 4), SELECTION_LIMIT_MESSAGE);
    assert.equal(isMultiSelectAtMax(question, 4), true);
  });

  it('keeps selected answers removable while at the selection limit', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 5)!;
    let answer = emptyAnswer();
    for (let i = 0; i < 4; i += 1) {
      answer = toggleBaseSelection(question, answer, question.choices[i].id).answer;
    }
    const removed = toggleBaseSelection(question, answer, question.choices[0].id);
    assert.equal(removed.ok, true);
    assert.equal(removed.answer.selectedChoiceIds.length, 3);
    assert.equal(selectionLimitGuidance(question, removed.answer.selectedChoiceIds.length), null);
  });

  it('allows selected multi-select answers to be removed', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 6)!;
    let answer = emptyAnswer();
    answer = toggleBaseSelection(question, answer, question.choices[0].id).answer;
    answer = toggleBaseSelection(question, answer, question.choices[1].id).answer;
    answer = toggleBaseSelection(question, answer, question.choices[0].id).answer;
    assert.deepEqual(answer.selectedChoiceIds, [question.choices[1].id]);
  });

  it('limits priority follow-ups to Q5, Q8, and Q10', () => {
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_01), [5, 8, 10]);
    for (const question of CATEGORY_01.questions) {
      if ([5, 8, 10].includes(question.number)) {
        assert.ok(question.priorityFollowUp);
        assert.equal(question.priorityFollowUp?.selectionCount, 2);
      } else {
        assert.equal(question.priorityFollowUp, undefined);
      }
    }
  });

  it('requires priority choices from base selections only and exactly two when shown', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 5)!;
    const selected = question.choices.slice(0, 3).map((c) => c.id);
    let answer = syncAnswerAfterBaseChange(question, selected, []);
    assert.equal(shouldShowPriorityFollowUp(question, answer.selectedChoiceIds), true);

    answer = togglePrioritySelection(question, answer, selected[0]);
    answer = togglePrioritySelection(question, answer, selected[1]);
    assert.deepEqual(answer.priorityChoiceIds, [selected[0], selected[1]]);

    const unchanged = togglePrioritySelection(question, answer, selected[2]);
    assert.deepEqual(unchanged.priorityChoiceIds, [selected[0], selected[1]]);

    const step: PreviewStep = { kind: 'question', questionIndex: 4, phase: 'priority' };
    const answers: PreviewAnswers = { [question.id]: answer };
    assert.equal(canContinueFromStep(CATEGORY_01, step, answers), true);
  });

  it('removes a priority when its base choice is removed and bypasses follow-up below two', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 8)!;
    const selected = question.choices.slice(0, 2).map((c) => c.id);
    let answer = syncAnswerAfterBaseChange(question, selected, []);
    answer = { ...answer, priorityChoiceIds: [...selected] };
    assert.equal(shouldShowPriorityFollowUp(question, answer.selectedChoiceIds), true);

    answer = toggleBaseSelection(question, answer, selected[0]).answer;
    assert.equal(answer.priorityChoiceIds.includes(selected[0]), false);
    assert.equal(shouldShowPriorityFollowUp(question, answer.selectedChoiceIds), false);
    assert.deepEqual(answer.priorityChoiceIds, []);

    const answers: PreviewAnswers = { [question.id]: answer };
    const fromBase: PreviewStep = { kind: 'question', questionIndex: 7, phase: 'base' };
    const next = advanceStep(CATEGORY_01, fromBase, answers);
    assert.deepEqual(next, { kind: 'question', questionIndex: 8, phase: 'base' });
  });

  it('preserves in-memory responses across back/forward navigation', () => {
    const q1 = CATEGORY_01.questions[0];
    const q2 = CATEGORY_01.questions[1];
    const answers: PreviewAnswers = {
      [q1.id]: syncAnswerAfterBaseChange(q1, [q1.choices[1].id], []),
      [q2.id]: syncAnswerAfterBaseChange(q2, [q2.choices[3].id], []),
    };

    let step: PreviewStep = { kind: 'question', questionIndex: 1, phase: 'base' };
    step = retreatStep(CATEGORY_01, step, answers);
    assert.deepEqual(step, { kind: 'question', questionIndex: 0, phase: 'base' });
    assert.deepEqual(getAnswer(answers, q1.id).selectedChoiceIds, [q1.choices[1].id]);

    step = advanceStep(CATEGORY_01, step, answers);
    assert.deepEqual(step, { kind: 'question', questionIndex: 1, phase: 'base' });
    assert.deepEqual(getAnswer(answers, q2.id).selectedChoiceIds, [q2.choices[3].id]);
  });

  it('keeps priority choices valid after backward edits to earlier questions', () => {
    const q5 = CATEGORY_01.questions.find((q) => q.number === 5)!;
    const q6 = CATEGORY_01.questions.find((q) => q.number === 6)!;
    const selected = q5.choices.slice(0, 3).map((c) => c.id);
    const answers: PreviewAnswers = {
      [q5.id]: {
        selectedChoiceIds: selected,
        priorityChoiceIds: [selected[0], selected[1]],
      },
      [q6.id]: syncAnswerAfterBaseChange(q6, [q6.choices[0].id], []),
    };

    let step: PreviewStep = { kind: 'question', questionIndex: 5, phase: 'base' };
    step = retreatStep(CATEGORY_01, step, answers);
    assert.deepEqual(step, { kind: 'question', questionIndex: 4, phase: 'priority' });
    assert.deepEqual(getAnswer(answers, q5.id).priorityChoiceIds, [selected[0], selected[1]]);
    assert.equal(canContinueFromStep(CATEGORY_01, step, answers), true);
  });

  it('requires valid answers for all 10 questions before completion', () => {
    const answers: PreviewAnswers = {};
    assert.equal(isCategoryPreviewComplete(CATEGORY_01, answers), false);

    for (const question of CATEGORY_01.questions) {
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

    assert.equal(isCategoryPreviewComplete(CATEGORY_01, answers), true);
  });

  it('uses 10 question intro and completion metadata with wrong answers wording', () => {
    assert.equal(INTRO_COPY.metadata, '10 questions');
    assert.match(INTRO_COPY.supporting, /There are no wrong answers\./);
    assert.doesNotMatch(INTRO_COPY.supporting, /There are no right answers\./);
    assert.equal(PREVIEW_NOTICE, 'Preview mode. Your answers are not being saved yet.');
  });

  it('keeps Category 1 and preview user facing strings free of dash punctuation', () => {
    const catalogStrings: string[] = [];
    for (const question of CATEGORY_01.questions) {
      catalogStrings.push(question.prompt);
      if (question.statement) catalogStrings.push(question.statement);
      if (question.priorityFollowUp) catalogStrings.push(question.priorityFollowUp.prompt);
      for (const choice of question.choices) catalogStrings.push(choice.label);
    }
    catalogStrings.push(
      INTRO_COPY.body,
      INTRO_COPY.supporting,
      INTRO_COPY.metadata,
      PREVIEW_NOTICE,
      SELECTION_LIMIT_MESSAGE,
      read('components/questionnaire-preview/PreviewNotice.tsx'),
      read('components/questionnaire-preview/PriorityFollowUp.tsx'),
      read('components/questionnaire-preview/CategoryPreviewComplete.tsx'),
      read('lib/questionnaire/preview/category-01-preview-flow.ts')
    );

    for (const value of catalogStrings) {
      assert.equal(DASH_PATTERN.test(value), false, value.slice(0, 120));
      for (const phrase of FORBIDDEN_HYPHEN_PHRASES) {
        assert.equal(
          value.includes(phrase),
          false,
          `forbidden phrase "${phrase}" in: ${value.slice(0, 120)}`
        );
      }
    }
  });

  it('preview code does not call legacy onboarding saves or questionnaire DB writes', () => {
    const files = [
      ...listFilesRecursive(join(process.cwd(), 'components/questionnaire-preview')),
      join(process.cwd(), 'app/onboarding-v2-preview/page.tsx'),
      join(process.cwd(), 'lib/questionnaire/preview/category-01-preview-flow.ts'),
    ];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      assert.doesNotMatch(source, /saveProfileAnswer|finishOnboarding|profile_answers/);
      assert.doesNotMatch(
        source,
        /user_questionnaire_progress|user_questionnaire_responses|user_questionnaire_selected_choices|user_questionnaire_priority_selections/
      );
      assert.doesNotMatch(source, /\.from\(['"]user_questionnaire_/);
    }

    const appPage = read('app/app/page.tsx');
    assert.match(appPage, /Preview Onboarding 2\.0/);
    assert.match(appPage, /href="\/onboarding-v2-preview"/);
    assert.match(appPage, /href="\/onboarding"/);
  });

  it('keeps mobile and desktop context panels mutually exclusive (no duplicate progress)', () => {
    const shell = read('components/questionnaire-preview/Category01PreviewShell.tsx');
    const panel = read('components/questionnaire-preview/PreviewContextPanel.tsx');
    assert.match(shell, /variant="desktop"/);
    assert.match(shell, /variant="mobile"/);
    assert.match(panel, /hidden[\s\S]*lg:block/);
    assert.match(panel, /lg:hidden/);
    assert.equal((panel.match(/<QuestionnaireProgress\b/g) || []).length, 1);
    assert.equal((panel.match(/<PreviewNotice\b/g) || []).length, 1);
    assert.match(panel, />\s*Exit preview\s*</);
    assert.doesNotMatch(shell, /<QuestionnaireProgress/);
  });
});
