'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import CategoryPreviewComplete from '@/components/questionnaire-preview/CategoryPreviewComplete';
import CategoryPreviewDirectory from '@/components/questionnaire-preview/CategoryPreviewDirectory';
import CategoryPreviewIntro from '@/components/questionnaire-preview/CategoryPreviewIntro';
import PreviewContextPanel from '@/components/questionnaire-preview/PreviewContextPanel';
import PriorityFollowUp from '@/components/questionnaire-preview/PriorityFollowUp';
import QuestionnaireQuestion from '@/components/questionnaire-preview/QuestionnaireQuestion';
import type { CategoryDefinition } from '@/lib/questionnaire/types';
import {
  advanceStep,
  canContinueFromStep,
  clearCategoryAnswers,
  countCompletedPriorityFollowUps,
  eligibleSelectedChoiceIds,
  fromCategoryFlowStep,
  getAnswer,
  getCategoryAnswers,
  getCompleteCopy,
  getIntroCopy,
  isCategorySessionComplete,
  progressFraction,
  retreatStep,
  selectionLimitGuidance,
  toCategoryFlowStep,
  toggleBaseSelection,
  togglePrioritySelection,
  type PreviewAnswersByCategory,
  type PreviewStep,
} from '@/lib/questionnaire/preview/category-01-preview-flow';

type CompatibilityProfilePreviewShellProps = {
  categories: CategoryDefinition[];
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

export default function CompatibilityProfilePreviewShell({
  categories,
}: CompatibilityProfilePreviewShellProps) {
  const [step, setStep] = useState<PreviewStep>({ kind: 'directory' });
  const [answersByCategory, setAnswersByCategory] = useState<PreviewAnswersByCategory>({});
  const stepKeyRef = useRef('directory');

  const categoriesByNumber = useMemo(() => {
    return new Map(categories.map((category) => [category.number, category]));
  }, [categories]);

  const completedCategoryNumbers = useMemo(() => {
    const completed = new Set<number>();
    for (const category of categories) {
      if (isCategorySessionComplete(category, answersByCategory)) {
        completed.add(category.number);
      }
    }
    return completed;
  }, [answersByCategory, categories]);

  useEffect(() => {
    const key =
      step.kind === 'question'
        ? `q-${step.categoryNumber}-${step.questionIndex}-${step.phase}`
        : step.kind === 'intro' || step.kind === 'complete'
          ? `${step.kind}-${step.categoryNumber}`
          : step.kind;
    if (stepKeyRef.current === key) return;
    stepKeyRef.current = key;
    const frame = window.requestAnimationFrame(() => {
      focusQuestionHeading();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  function openCategory(categoryNumber: number) {
    setStep({ kind: 'intro', categoryNumber });
  }

  function backToDirectory() {
    setStep({ kind: 'directory' });
  }

  function handleBegin(categoryNumber: number) {
    setStep({
      kind: 'question',
      categoryNumber,
      questionIndex: 0,
      phase: 'base',
    });
  }

  function handleRestart(categoryNumber: number) {
    setAnswersByCategory((prev) => clearCategoryAnswers(prev, categoryNumber));
    setStep({ kind: 'intro', categoryNumber });
  }

  function handleReview(categoryNumber: number) {
    setStep({
      kind: 'question',
      categoryNumber,
      questionIndex: 0,
      phase: 'base',
    });
  }

  function updateCategoryAnswer(
    categoryNumber: number,
    questionId: string,
    answer: ReturnType<typeof getAnswer>
  ) {
    setAnswersByCategory((prev) => ({
      ...prev,
      [categoryNumber]: {
        ...getCategoryAnswers(prev, categoryNumber),
        [questionId]: answer,
      },
    }));
  }

  function handleToggleBase(
    category: CategoryDefinition,
    questionId: string,
    choiceId: string
  ) {
    const question = category.questions.find((q) => q.id === questionId);
    if (!question) return;
    const answers = getCategoryAnswers(answersByCategory, category.number);
    const current = getAnswer(answers, questionId);
    const result = toggleBaseSelection(question, current, choiceId);
    if (!result.ok) return;
    updateCategoryAnswer(category.number, questionId, result.answer);
  }

  function handleTogglePriority(
    category: CategoryDefinition,
    questionId: string,
    choiceId: string
  ) {
    const question = category.questions.find((q) => q.id === questionId);
    if (!question) return;
    const answers = getCategoryAnswers(answersByCategory, category.number);
    const current = getAnswer(answers, questionId);
    const next = togglePrioritySelection(question, current, choiceId);
    updateCategoryAnswer(category.number, questionId, next);
  }

  function handleContinue(category: CategoryDefinition) {
    const flowStep = toCategoryFlowStep(step);
    if (!flowStep) return;
    const answers = getCategoryAnswers(answersByCategory, category.number);
    if (!canContinueFromStep(category, flowStep, answers)) return;
    const next = advanceStep(category, flowStep, answers);
    setStep(fromCategoryFlowStep(category.number, next));
  }

  function handleBack(category: CategoryDefinition) {
    const flowStep = toCategoryFlowStep(step);
    if (!flowStep) return;
    const answers = getCategoryAnswers(answersByCategory, category.number);
    const next = retreatStep(category, flowStep, answers);
    setStep(fromCategoryFlowStep(category.number, next));
  }

  if (step.kind === 'directory') {
    return (
      <CategoryPreviewDirectory
        categories={categories}
        completedCategoryNumbers={completedCategoryNumbers}
        onOpenCategory={openCategory}
      />
    );
  }

  const category = categoriesByNumber.get(step.categoryNumber);
  if (!category) {
    return (
      <CategoryPreviewDirectory
        categories={categories}
        completedCategoryNumbers={completedCategoryNumbers}
        onOpenCategory={openCategory}
      />
    );
  }

  const answers = getCategoryAnswers(answersByCategory, category.number);
  const intro = getIntroCopy(category.number);
  const complete = getCompleteCopy(category.number);

  if (step.kind === 'intro') {
    return (
      <CategoryPreviewIntro
        categoryTitle={category.title}
        questionCount={category.questions.length}
        intro={intro}
        onBegin={() => handleBegin(category.number)}
        onBackToDirectory={backToDirectory}
      />
    );
  }

  if (step.kind === 'complete') {
    return (
      <CategoryPreviewComplete
        categoryTitle={category.title}
        totalQuestions={category.questions.length}
        priorityFollowUpsCompleted={countCompletedPriorityFollowUps(category, answers)}
        completeEyebrow={complete.eyebrow}
        completeBody={complete.body}
        onReview={() => handleReview(category.number)}
        onRestart={() => handleRestart(category.number)}
        onBackToDirectory={backToDirectory}
      />
    );
  }

  const flowStep = toCategoryFlowStep(step);
  const canContinue = flowStep
    ? canContinueFromStep(category, flowStep, answers)
    : false;
  const question = category.questions[step.questionIndex];
  const answer = getAnswer(answers, question.id);
  const eligibleIds = eligibleSelectedChoiceIds(question, answer.selectedChoiceIds);
  const eligibleChoices = question.choices.filter((c) => eligibleIds.includes(c.id));
  const progress = flowStep ? progressFraction(category, flowStep) : 0;
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
    onBackToDirectory: backToDirectory,
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
            onToggleChoice={(choiceId) =>
              handleToggleBase(category, question.id, choiceId)
            }
          />
        ) : (
          <PriorityFollowUp
            question={question}
            answer={answer}
            eligibleChoices={eligibleChoices}
            onToggleChoice={(choiceId) =>
              handleTogglePriority(category, question.id, choiceId)
            }
          />
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => handleBack(category)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => handleContinue(category)}
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
