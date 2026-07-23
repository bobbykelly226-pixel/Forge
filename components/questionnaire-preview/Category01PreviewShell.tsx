'use client';

import { useEffect, useRef, useState } from 'react';

import CategoryPreviewComplete from '@/components/questionnaire-preview/CategoryPreviewComplete';
import CategoryPreviewIntro from '@/components/questionnaire-preview/CategoryPreviewIntro';
import PreviewContextPanel from '@/components/questionnaire-preview/PreviewContextPanel';
import PriorityFollowUp from '@/components/questionnaire-preview/PriorityFollowUp';
import QuestionnaireQuestion from '@/components/questionnaire-preview/QuestionnaireQuestion';
import type { CategoryDefinition } from '@/lib/questionnaire/types';
import {
  advanceStep,
  canContinueFromStep,
  countCompletedPriorityFollowUps,
  eligibleSelectedChoiceIds,
  getAnswer,
  progressFraction,
  retreatStep,
  selectionLimitGuidance,
  toggleBaseSelection,
  togglePrioritySelection,
  type PreviewAnswers,
  type PreviewStep,
} from '@/lib/questionnaire/preview/category-01-preview-flow';

type Category01PreviewShellProps = {
  category: CategoryDefinition;
};

function focusQuestionHeading() {
  const heading = document.getElementById('preview-question-heading');
  if (heading instanceof HTMLElement) {
    heading.focus({ preventScroll: true });
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: 0,
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
}

export default function Category01PreviewShell({ category }: Category01PreviewShellProps) {
  const [step, setStep] = useState<PreviewStep>({ kind: 'intro' });
  const [answers, setAnswers] = useState<PreviewAnswers>({});
  const stepKeyRef = useRef('intro');

  useEffect(() => {
    const key =
      step.kind === 'question'
        ? `q-${step.questionIndex}-${step.phase}`
        : step.kind;
    if (stepKeyRef.current === key) return;
    stepKeyRef.current = key;
    const frame = window.requestAnimationFrame(() => {
      focusQuestionHeading();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const canContinue = canContinueFromStep(category, step, answers);

  function handleBegin() {
    setStep({ kind: 'question', questionIndex: 0, phase: 'base' });
  }

  function handleRestart() {
    setAnswers({});
    setStep({ kind: 'intro' });
  }

  function handleReview() {
    setStep({ kind: 'question', questionIndex: 0, phase: 'base' });
  }

  function handleToggleBase(questionId: string, choiceId: string) {
    const question = category.questions.find((q) => q.id === questionId);
    if (!question) return;
    const current = getAnswer(answers, questionId);
    const result = toggleBaseSelection(question, current, choiceId);
    if (!result.ok) {
      // Limit guidance is shown from derived state; do not replace selections.
      return;
    }
    setAnswers((prev) => ({ ...prev, [questionId]: result.answer }));
  }

  function handleTogglePriority(questionId: string, choiceId: string) {
    const question = category.questions.find((q) => q.id === questionId);
    if (!question) return;
    const current = getAnswer(answers, questionId);
    const next = togglePrioritySelection(question, current, choiceId);
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
  }

  function handleContinue() {
    if (!canContinue) return;
    setStep((current) => advanceStep(category, current, answers));
  }

  function handleBack() {
    setStep((current) => retreatStep(category, current, answers));
  }

  if (step.kind === 'intro') {
    return (
      <CategoryPreviewIntro
        categoryTitle={category.title}
        questionCount={category.questions.length}
        onBegin={handleBegin}
      />
    );
  }

  if (step.kind === 'complete') {
    return (
      <CategoryPreviewComplete
        categoryTitle={category.title}
        totalQuestions={category.questions.length}
        priorityFollowUpsCompleted={countCompletedPriorityFollowUps(category, answers)}
        onReview={handleReview}
        onRestart={handleRestart}
      />
    );
  }

  const question = category.questions[step.questionIndex];
  const answer = getAnswer(answers, question.id);
  const eligibleIds = eligibleSelectedChoiceIds(question, answer.selectedChoiceIds);
  const eligibleChoices = question.choices.filter((c) => eligibleIds.includes(c.id));
  const progress = progressFraction(category, step);
  const phaseLabel = step.phase === 'priority' ? 'Priority follow up' : undefined;
  const limitMessage =
    step.phase === 'base'
      ? selectionLimitGuidance(question, answer.selectedChoiceIds.length)
      : null;

  const contextProps = {
    categoryNumber: category.number,
    totalCategories: 10,
    categoryTitle: category.title,
    questionNumber: question.number,
    totalQuestions: category.questions.length,
    progress,
    phaseLabel,
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start">
      <PreviewContextPanel variant="desktop" {...contextProps} />

      <section className="rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-5 shadow-sm sm:p-8">
        <PreviewContextPanel variant="mobile" {...contextProps} />

        {step.phase === 'base' ? (
          <QuestionnaireQuestion
            question={question}
            answer={answer}
            atMaxMessage={limitMessage}
            onToggleChoice={(choiceId) => handleToggleBase(question.id, choiceId)}
          />
        ) : (
          <PriorityFollowUp
            question={question}
            answer={answer}
            eligibleChoices={eligibleChoices}
            onToggleChoice={(choiceId) => handleTogglePriority(question.id, choiceId)}
          />
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="forge-btn-primary inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}
