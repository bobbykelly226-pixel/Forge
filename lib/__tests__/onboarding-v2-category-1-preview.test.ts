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
  isCategoryPreviewComplete,
  isMultiSelectAtMax,
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

describe('Category 1 onboarding preview flow', () => {
  it('uses all 15 live Category 1 questions in order', () => {
    assert.equal(CATEGORY_01.questions.length, 15);
    assert.equal(CATEGORY_01.title, 'Relationship Vision & Intentions');
    assert.deepEqual(
      CATEGORY_01.questions.map((q) => q.number),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    );

    let step: PreviewStep = { kind: 'intro' };
    const answers: PreviewAnswers = {};
    const seen: number[] = [];

    step = advanceStep(CATEGORY_01, step, answers);
    while (step.kind === 'question') {
      const question = CATEGORY_01.questions[step.questionIndex];
      if (step.phase === 'base') {
        seen.push(question.number);
        // Satisfy min selection with first N choices.
        const pick = question.choices
          .slice(0, question.minSelections)
          .map((c) => c.id);
        answers[question.id] = syncAnswerAfterBaseChange(question, pick, []);
        if (shouldShowPriorityFollowUp(question, answers[question.id].selectedChoiceIds)) {
          // Ensure enough eligible selections for priority questions.
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
    assert.deepEqual(seen, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
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
      if (question.statement) {
        assert.equal(
          joined.includes(question.statement),
          false,
          `statement duplicated for Q${question.number}`
        );
      }
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
    assert.equal(isMultiSelectAtMax(question, 3), false);

    assert.equal(selectionLimitGuidance(question, 4), SELECTION_LIMIT_MESSAGE);
    assert.equal(isMultiSelectAtMax(question, 4), true);
    assert.match(
      SELECTION_LIMIT_MESSAGE,
      /reached the selection limit\. Deselect one before selecting another/i
    );

    const questionSource = read('components/questionnaire-preview/QuestionnaireQuestion.tsx');
    assert.match(questionSource, /data-selection-limit-guidance/);
    assert.match(questionSource, /role="status"/);
    assert.match(questionSource, /SELECTION_LIMIT_MESSAGE|atMaxMessage/);
    assert.match(questionSource, /atMax \? \(/);
    assert.match(questionSource, /disabled=\{Boolean\(atMax && !selected\)\}/);
  });

  it('keeps selected answers removable while at the selection limit', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 5)!;
    let answer = emptyAnswer();
    for (let i = 0; i < 4; i += 1) {
      answer = toggleBaseSelection(question, answer, question.choices[i].id).answer;
    }
    assert.equal(isMultiSelectAtMax(question, answer.selectedChoiceIds.length), true);
    assert.equal(selectionLimitGuidance(question, answer.selectedChoiceIds.length), SELECTION_LIMIT_MESSAGE);

    const removed = toggleBaseSelection(question, answer, question.choices[0].id);
    assert.equal(removed.ok, true);
    assert.equal(removed.answer.selectedChoiceIds.includes(question.choices[0].id), false);
    assert.equal(removed.answer.selectedChoiceIds.length, 3);
    assert.equal(selectionLimitGuidance(question, removed.answer.selectedChoiceIds.length), null);
  });

  it('allows selected multi-select answers to be removed', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 9)!;
    let answer = emptyAnswer();
    answer = toggleBaseSelection(question, answer, question.choices[0].id).answer;
    answer = toggleBaseSelection(question, answer, question.choices[1].id).answer;
    answer = toggleBaseSelection(question, answer, question.choices[0].id).answer;
    assert.deepEqual(answer.selectedChoiceIds, [question.choices[1].id]);
  });

  it('limits priority follow-ups to Q5, Q12, and Q15', () => {
    assert.deepEqual(questionsWithPriorityFollowUp(CATEGORY_01), [5, 12, 15]);
    for (const question of CATEGORY_01.questions) {
      if ([5, 12, 15].includes(question.number)) {
        assert.ok(question.priorityFollowUp);
        assert.equal(question.priorityFollowUp?.selectionCount, 2);
        assert.equal(question.priorityFollowUp?.unordered, true);
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

    // Third priority ignored once required count reached.
    const unchanged = togglePrioritySelection(question, answer, selected[2]);
    assert.deepEqual(unchanged.priorityChoiceIds, [selected[0], selected[1]]);

    // Non-selected base choice cannot become a priority.
    const outsider = question.choices[8].id;
    const ignored = togglePrioritySelection(question, answer, outsider);
    assert.deepEqual(ignored.priorityChoiceIds, [selected[0], selected[1]]);

    const step: PreviewStep = { kind: 'question', questionIndex: 4, phase: 'priority' };
    const answers: PreviewAnswers = { [question.id]: answer };
    assert.equal(canContinueFromStep(CATEGORY_01, step, answers), true);

    answers[question.id] = { ...answer, priorityChoiceIds: [selected[0]] };
    assert.equal(canContinueFromStep(CATEGORY_01, step, answers), false);
  });

  it('removes a priority when its base choice is removed and bypasses follow-up below two', () => {
    const question = CATEGORY_01.questions.find((q) => q.number === 12)!;
    const selected = question.choices.slice(0, 2).map((c) => c.id);
    let answer = syncAnswerAfterBaseChange(question, selected, []);
    answer = {
      ...answer,
      priorityChoiceIds: [...selected],
    };
    assert.equal(shouldShowPriorityFollowUp(question, answer.selectedChoiceIds), true);

    answer = toggleBaseSelection(question, answer, selected[0]).answer;
    assert.equal(answer.selectedChoiceIds.includes(selected[0]), false);
    assert.equal(answer.priorityChoiceIds.includes(selected[0]), false);
    assert.equal(shouldShowPriorityFollowUp(question, answer.selectedChoiceIds), false);
    assert.deepEqual(answer.priorityChoiceIds, []);

    // With one remaining selection, advance skips the priority substep.
    const answers: PreviewAnswers = { [question.id]: answer };
    const fromBase: PreviewStep = { kind: 'question', questionIndex: 11, phase: 'base' };
    const next = advanceStep(CATEGORY_01, fromBase, answers);
    assert.deepEqual(next, { kind: 'question', questionIndex: 12, phase: 'base' });
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

  it('requires valid answers for all 15 questions before completion', () => {
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

    // Break one priority.
    const q5 = CATEGORY_01.questions.find((q) => q.number === 5)!;
    answers[q5.id] = {
      ...answers[q5.id],
      priorityChoiceIds: answers[q5.id].priorityChoiceIds.slice(0, 1),
    };
    assert.equal(isCategoryPreviewComplete(CATEGORY_01, answers), false);
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
      assert.doesNotMatch(source, /compatibility_answers|Compatibility Engine/);
    }

    const appPage = read('app/app/page.tsx');
    assert.match(appPage, /Preview Onboarding 2\.0/);
    assert.match(appPage, /href="\/onboarding-v2-preview"/);
    assert.match(appPage, /href="\/onboarding"/);

    const proxy = read('proxy.ts');
    assert.match(proxy, /onboarding-v2-preview/);

    const page = read('app/onboarding-v2-preview/page.tsx');
    assert.match(page, /redirect\('\/login\?redirectTo=\/onboarding-v2-preview'\)/);
    assert.match(page, /CATEGORY_01/);
    assert.match(page, /ForgeAppCanvas/);
    assert.doesNotMatch(page, /loadOnboardingBootstrap|finishOnboarding/);
  });

  it('keeps mobile and desktop context panels mutually exclusive (no duplicate progress)', () => {
    const shell = read('components/questionnaire-preview/Category01PreviewShell.tsx');
    const panel = read('components/questionnaire-preview/PreviewContextPanel.tsx');

    assert.match(shell, /variant="desktop"/);
    assert.match(shell, /variant="mobile"/);
    assert.equal((shell.match(/PreviewContextPanel/g) || []).length >= 2, true);

    // Desktop sidebar hidden below lg; mobile strip hidden at lg+.
    assert.match(panel, /variant === 'desktop'/);
    assert.match(panel, /hidden[\s\S]*lg:block/);
    assert.match(panel, /lg:hidden/);
    assert.match(panel, /data-preview-context=\{variant\}/);

    // Each variant includes progress, notice, and exit exactly once in the shared panel.
    assert.equal((panel.match(/<QuestionnaireProgress\b/g) || []).length, 1);
    assert.equal((panel.match(/<PreviewNotice\b/g) || []).length, 1);
    assert.match(panel, />\s*Exit preview\s*</);
    assert.equal((panel.match(/Exit preview/g) || []).length, 1);

    // Shell no longer embeds a second inline QuestionnaireProgress.
    assert.doesNotMatch(shell, /<QuestionnaireProgress/);
    assert.doesNotMatch(shell, /lg:hidden>\s*<QuestionnaireProgress/);
  });
});
