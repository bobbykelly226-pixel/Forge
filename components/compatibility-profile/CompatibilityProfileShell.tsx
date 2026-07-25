'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import CategoryCompletePanel from '@/components/compatibility-profile/CategoryCompletePanel';
import CategoryIntroPanel from '@/components/compatibility-profile/CategoryIntroPanel';
import CompatibilityProfileDirectory, {
  type CategoryDirectoryItem,
} from '@/components/compatibility-profile/CompatibilityProfileDirectory';
import OptionalContextFields from '@/components/compatibility-profile/OptionalContextFields';
import OverallCompletePanel from '@/components/compatibility-profile/OverallCompletePanel';
import SaveStatus, {
  type SaveStatusKind,
} from '@/components/compatibility-profile/SaveStatus';
import StructuredIdentityFields from '@/components/compatibility-profile/StructuredIdentityFields';
import PreviewContextPanel from '@/components/questionnaire-preview/PreviewContextPanel';
import PriorityFollowUp from '@/components/questionnaire-preview/PriorityFollowUp';
import QuestionnaireQuestion from '@/components/questionnaire-preview/QuestionnaireQuestion';
import {
  restartCompatibilityCategoryAction,
  restartCompatibilityProfileAction,
  saveCompatibilityAnswerAction,
  saveCompatibilityProgressAction,
} from '@/app/actions/questionnaire';
import type { ParentingEligibilityProfile } from '@/lib/questionnaire/eligibility';
import {
  emptyPersistedAnswer,
  sanitizeAnswerAgainstCatalog,
  type PersistedQuestionAnswer,
} from '@/lib/questionnaire/persistence/answer-state';
import {
  areAllCategoriesComplete,
  countAllCompletedEligibleQuestions,
  countAllCompletedPriorities,
  countAllEligibleQuestions,
  countCompletedEligibleQuestions,
  countCompletedPrioritiesInCategory,
  getEligibleQuestions,
  isCategoryComplete,
} from '@/lib/questionnaire/persistence/completion';
import {
  advanceEligible,
  canContinueEligible,
  eligibleProgressFraction,
  firstIncompleteEligibleIndex,
  retreatEligible,
  toEligibleCategoryView,
} from '@/lib/questionnaire/persistence/eligible-flow';
import { SAVE_STATUS_COPY } from '@/lib/questionnaire/persistence/copy';
import { QuestionSaveQueue } from '@/lib/questionnaire/persistence/save-queue';
import type { LoadedQuestionnaireProgress } from '@/lib/data/questionnaire';
import type { CategoryDefinition } from '@/lib/questionnaire/types';
import {
  eligibleSelectedChoiceIds,
  fromCategoryFlowStep,
  getIntroCopy,
  selectionLimitGuidance,
  toCategoryFlowStep,
  toggleBaseSelection,
  togglePrioritySelection,
  type PreviewStep,
} from '@/lib/questionnaire/preview/category-01-preview-flow';

type CompatibilityProfileShellProps = {
  categories: CategoryDefinition[];
  initialAnswersByCategory: Record<number, Record<string, PersistedQuestionAnswer>>;
  initialProgress: LoadedQuestionnaireProgress;
  initialWriteGeneration: number;
  parentingProfile: ParentingEligibilityProfile | null;
};

function focusQuestionHeading() {
  const heading =
    document.getElementById('compatibility-question-heading') ||
    document.getElementById('preview-question-heading');
  if (heading instanceof HTMLElement) {
    heading.focus({ preventScroll: true });
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: 0,
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
}

function categoryStatus(
  category: CategoryDefinition,
  answers: Record<string, PersistedQuestionAnswer>,
  profile: ParentingEligibilityProfile | null
): CategoryDirectoryItem['status'] {
  if (isCategoryComplete(category, answers, profile)) return 'complete';
  const hasAny = Object.values(answers).some(
    (answer) => answer.selectedChoiceIds.length > 0
  );
  return hasAny ? 'in_progress' : 'not_started';
}

export default function CompatibilityProfileShell({
  categories,
  initialAnswersByCategory,
  initialProgress,
  initialWriteGeneration,
  parentingProfile,
}: CompatibilityProfileShellProps) {
  const [step, setStep] = useState<PreviewStep>({ kind: 'directory' });
  const [answersByCategory, setAnswersByCategory] = useState(initialAnswersByCategory);
  const [writeGeneration, setWriteGeneration] = useState(initialWriteGeneration);
  const [saveStatus, setSaveStatus] = useState<SaveStatusKind>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [continueBusy, setContinueBusy] = useState(false);
  const [showCategoryRestart, setShowCategoryRestart] = useState(false);
  const [showFullRestart, setShowFullRestart] = useState(false);
  const [restartBusy, setRestartBusy] = useState(false);
  const [pendingProgress, setPendingProgress] = useState<{
    categoryKey?: string | null;
    questionKey?: string | null;
    phase?: 'intro' | 'base' | 'priority' | 'complete' | null;
  } | null>(null);
  const saveQueueRef = useRef(new QuestionSaveQueue());
  const saveTokenRef = useRef(new Map<string, number>());
  const pendingAnswerRef = useRef<{
    questionKey: string;
    answer: PersistedQuestionAnswer;
  } | null>(null);
  const writeGenerationRef = useRef(initialWriteGeneration);
  const stepKeyRef = useRef('directory');

  useEffect(() => {
    writeGenerationRef.current = writeGeneration;
  }, [writeGeneration]);

  const categoriesByNumber = useMemo(
    () => new Map(categories.map((category) => [category.number, category])),
    [categories]
  );

  const directoryItems = useMemo<CategoryDirectoryItem[]>(() => {
    return categories.map((category) => {
      const answers = answersByCategory[category.number] ?? {};
      const availableCount = getEligibleQuestions(category, parentingProfile).length;
      const completedCount = countCompletedEligibleQuestions(
        category,
        answers,
        parentingProfile
      );
      return {
        category,
        availableCount,
        completedCount,
        status: categoryStatus(category, answers, parentingProfile),
      };
    });
  }, [answersByCategory, categories, parentingProfile]);

  const overallComplete = useMemo(
    () => areAllCategoriesComplete(categories, answersByCategory, parentingProfile),
    [answersByCategory, categories, parentingProfile]
  );

  const totalEligible = useMemo(
    () => countAllEligibleQuestions(categories, parentingProfile),
    [categories, parentingProfile]
  );

  const totalCompleted = useMemo(
    () =>
      countAllCompletedEligibleQuestions(
        categories,
        answersByCategory,
        parentingProfile
      ),
    [answersByCategory, categories, parentingProfile]
  );

  const totalPriorities = useMemo(
    () =>
      countAllCompletedPriorities(categories, answersByCategory, parentingProfile),
    [answersByCategory, categories, parentingProfile]
  );

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

  async function persistProgress(input: {
    categoryKey?: string | null;
    questionKey?: string | null;
    phase?: 'intro' | 'base' | 'priority' | 'complete' | null;
  }): Promise<boolean> {
    setPendingProgress(input);
    setSaveStatus('saving');
    setSaveError(null);
    const outcome = await saveCompatibilityProgressAction({
      ...input,
      expectedWriteGeneration: writeGenerationRef.current,
    });
    if (!outcome.success) {
      setSaveStatus('error');
      setSaveError(outcome.message || SAVE_STATUS_COPY.progressError);
      return false;
    }
    if (typeof outcome.data?.writeGeneration === 'number') {
      setWriteGeneration(outcome.data.writeGeneration);
      writeGenerationRef.current = outcome.data.writeGeneration;
    }
    setPendingProgress(null);
    setSaveStatus('saved');
    return true;
  }

  async function persistAnswer(
    question: CategoryDefinition['questions'][number],
    answer: PersistedQuestionAnswer
  ): Promise<boolean> {
    const sanitized = sanitizeAnswerAgainstCatalog(question, answer);
    const nextToken = (saveTokenRef.current.get(question.id) ?? 0) + 1;
    saveTokenRef.current.set(question.id, nextToken);
    pendingAnswerRef.current = {
      questionKey: question.id,
      answer: sanitized,
    };
    setSaveStatus('saving');
    setSaveError(null);

    const result = await saveQueueRef.current.enqueue(
      question.id,
      nextToken,
      async () => {
        const outcome = await saveCompatibilityAnswerAction({
          questionKey: question.id,
          answer: sanitized,
          expectedWriteGeneration: writeGenerationRef.current,
        });
        if (!outcome.success) {
          return { success: false as const, message: outcome.message };
        }
        return {
          success: true as const,
          data: outcome.data ?? {
            revision: sanitized.revision + 1,
            writeGeneration: writeGenerationRef.current,
          },
        };
      }
    );

    if (result.ok && result.superseded) {
      return true;
    }
    if (!result.ok) {
      setSaveStatus('error');
      setSaveError(result.message || SAVE_STATUS_COPY.error);
      return false;
    }

    setAnswersByCategory((prev) => {
      const category = categories.find((item) =>
        item.questions.some((q) => q.id === question.id)
      );
      if (!category) return prev;
      return {
        ...prev,
        [category.number]: {
          ...(prev[category.number] ?? {}),
          [question.id]: {
            ...sanitized,
            revision: result.data.revision,
          },
        },
      };
    });
    if (typeof result.data.writeGeneration === 'number') {
      setWriteGeneration(result.data.writeGeneration);
      writeGenerationRef.current = result.data.writeGeneration;
    }
    setSaveStatus('saved');
    return true;
  }

  function updateLocalAnswer(
    categoryNumber: number,
    questionId: string,
    answer: PersistedQuestionAnswer
  ) {
    setAnswersByCategory((prev) => ({
      ...prev,
      [categoryNumber]: {
        ...(prev[categoryNumber] ?? {}),
        [questionId]: answer,
      },
    }));
  }

  async function openCategory(categoryNumber: number) {
    const category = categoriesByNumber.get(categoryNumber);
    if (!category) return;
    const answers = answersByCategory[categoryNumber] ?? {};
    const status = categoryStatus(category, answers, parentingProfile);

    if (status === 'not_started') {
      const saved = await persistProgress({
        categoryKey: category.id,
        questionKey: null,
        phase: 'intro',
      });
      if (!saved) return;
      setStep({ kind: 'intro', categoryNumber });
      return;
    }

    if (status === 'complete') {
      const saved = await persistProgress({
        categoryKey: category.id,
        questionKey: null,
        phase: 'complete',
      });
      if (!saved) return;
      setStep({ kind: 'complete', categoryNumber });
      return;
    }

    const eligible = toEligibleCategoryView(category, parentingProfile);
    let questionIndex = firstIncompleteEligibleIndex(
      category,
      answers,
      parentingProfile
    );
    let phase: 'base' | 'priority' = 'base';

    if (
      initialProgress.categoryKey === category.id &&
      initialProgress.questionKey &&
      (initialProgress.phase === 'base' || initialProgress.phase === 'priority')
    ) {
      const resumed = eligible.questions.findIndex(
        (question) => question.id === initialProgress.questionKey
      );
      if (resumed >= 0) {
        questionIndex = resumed;
        phase = initialProgress.phase;
      }
    }

    const question = eligible.questions[questionIndex];
    const saved = await persistProgress({
      categoryKey: category.id,
      questionKey: question?.id ?? null,
      phase,
    });
    if (!saved) return;
    setStep({
      kind: 'question',
      categoryNumber,
      questionIndex,
      phase,
    });
  }

  async function backToDirectory() {
    const saved = await persistProgress({
      categoryKey: null,
      questionKey: null,
      phase: null,
    });
    if (!saved) return;
    setShowCategoryRestart(false);
    setStep({ kind: 'directory' });
  }

  async function handleBegin(categoryNumber: number) {
    const category = categoriesByNumber.get(categoryNumber);
    if (!category) return;
    const eligible = toEligibleCategoryView(category, parentingProfile);
    const question = eligible.questions[0];
    setStep({
      kind: 'question',
      categoryNumber,
      questionIndex: 0,
      phase: 'base',
    });
    const saved = await persistProgress({
      categoryKey: category.id,
      questionKey: question?.id ?? null,
      phase: 'base',
    });
    if (!saved) return;
  }

  async function handleToggleBase(
    category: CategoryDefinition,
    questionId: string,
    choiceId: string
  ) {
    const question = category.questions.find((item) => item.id === questionId);
    if (!question) return;
    const current =
      answersByCategory[category.number]?.[questionId] ?? emptyPersistedAnswer();
    const result = toggleBaseSelection(
      question,
      {
        selectedChoiceIds: current.selectedChoiceIds,
        priorityChoiceIds: current.priorityChoiceIds,
      },
      choiceId
    );
    if (!result.ok) return;
    const next = sanitizeAnswerAgainstCatalog(question, {
      ...current,
      selectedChoiceIds: result.answer.selectedChoiceIds,
      priorityChoiceIds: result.answer.priorityChoiceIds,
      revision: current.revision,
    });
    updateLocalAnswer(category.number, questionId, next);
    await persistAnswer(question, next);
  }

  async function handleTogglePriority(
    category: CategoryDefinition,
    questionId: string,
    choiceId: string
  ) {
    const question = category.questions.find((item) => item.id === questionId);
    if (!question) return;
    const current =
      answersByCategory[category.number]?.[questionId] ?? emptyPersistedAnswer();
    const toggled = togglePrioritySelection(
      question,
      {
        selectedChoiceIds: current.selectedChoiceIds,
        priorityChoiceIds: current.priorityChoiceIds,
      },
      choiceId
    );
    const next = sanitizeAnswerAgainstCatalog(question, {
      ...current,
      selectedChoiceIds: toggled.selectedChoiceIds,
      priorityChoiceIds: toggled.priorityChoiceIds,
      revision: current.revision,
    });
    updateLocalAnswer(category.number, questionId, next);
    await persistAnswer(question, next);
  }

  async function handleIdentityChange(
    category: CategoryDefinition,
    questionId: string,
    identity: PersistedQuestionAnswer['identity']
  ) {
    const question = category.questions.find((item) => item.id === questionId);
    if (!question) return;
    const current =
      answersByCategory[category.number]?.[questionId] ?? emptyPersistedAnswer();
    const next = sanitizeAnswerAgainstCatalog(question, {
      ...current,
      identity,
      revision: current.revision,
    });
    updateLocalAnswer(category.number, questionId, next);
    if (next.selectedChoiceIds.length > 0) {
      await persistAnswer(question, next);
    }
  }

  async function handleContextChange(
    category: CategoryDefinition,
    questionId: string,
    choiceId: string,
    text: string
  ) {
    const question = category.questions.find((item) => item.id === questionId);
    if (!question) return;
    const current =
      answersByCategory[category.number]?.[questionId] ?? emptyPersistedAnswer();
    const next = sanitizeAnswerAgainstCatalog(question, {
      ...current,
      choiceContexts: {
        ...current.choiceContexts,
        [choiceId]: text,
      },
      revision: current.revision,
    });
    updateLocalAnswer(category.number, questionId, next);
    if (next.selectedChoiceIds.length > 0) {
      await persistAnswer(question, next);
    }
  }

  async function handleContinue(category: CategoryDefinition) {
    const flowStep = toCategoryFlowStep(step);
    if (!flowStep) return;
    const answers = answersByCategory[category.number] ?? {};
    if (!canContinueEligible(category, flowStep, answers, parentingProfile)) return;

    setContinueBusy(true);
    try {
      if (flowStep.kind === 'question') {
        const eligible = toEligibleCategoryView(category, parentingProfile);
        const question = eligible.questions[flowStep.questionIndex];
        const answer = answers[question.id] ?? emptyPersistedAnswer();
        const saved = await persistAnswer(question, {
          ...answer,
          revision: answer.revision,
        });
        if (!saved) return;
      }

      const next = advanceEligible(
        category,
        flowStep,
        answersByCategory[category.number] ?? {},
        parentingProfile
      );
      const nextStep = fromCategoryFlowStep(category.number, next);
      setStep(nextStep);

      if (next.kind === 'complete') {
        const nextAnswers = {
          ...answersByCategory,
          [category.number]: answersByCategory[category.number] ?? {},
        };
        const allDone = areAllCategoriesComplete(
          categories,
          nextAnswers,
          parentingProfile
        );
        const progressSaved = await persistProgress({
          categoryKey: category.id,
          questionKey: null,
          phase: 'complete',
        });
        if (!progressSaved) return;
        if (allDone) {
          setStep({ kind: 'all_complete' });
        }
        return;
      }

      if (next.kind === 'question') {
        const eligible = toEligibleCategoryView(category, parentingProfile);
        const question = eligible.questions[next.questionIndex];
        const progressSaved = await persistProgress({
          categoryKey: category.id,
          questionKey: question?.id ?? null,
          phase: next.phase,
        });
        if (!progressSaved) return;
      }
    } finally {
      setContinueBusy(false);
    }
  }

  function handleBack(category: CategoryDefinition) {
    const flowStep = toCategoryFlowStep(step);
    if (!flowStep) return;
    const answers = answersByCategory[category.number] ?? {};
    const next = retreatEligible(category, flowStep, answers, parentingProfile);
    setStep(fromCategoryFlowStep(category.number, next));
  }

  async function confirmCategoryRestart(category: CategoryDefinition) {
    setRestartBusy(true);
    const result = await restartCompatibilityCategoryAction({
      categoryKey: category.id,
      expectedWriteGeneration: writeGenerationRef.current,
    });
    setRestartBusy(false);
    if (!result.success) {
      setSaveStatus('error');
      setSaveError(result.message);
      return;
    }
    if (typeof result.data?.writeGeneration === 'number') {
      setWriteGeneration(result.data.writeGeneration);
      writeGenerationRef.current = result.data.writeGeneration;
    }
    setAnswersByCategory((prev) => ({
      ...prev,
      [category.number]: {},
    }));
    setShowCategoryRestart(false);
    setStep({ kind: 'intro', categoryNumber: category.number });
    await persistProgress({
      categoryKey: category.id,
      questionKey: null,
      phase: 'intro',
    });
  }

  async function confirmFullRestart() {
    setRestartBusy(true);
    const result = await restartCompatibilityProfileAction({
      expectedWriteGeneration: writeGenerationRef.current,
    });
    setRestartBusy(false);
    if (!result.success) {
      setSaveStatus('error');
      setSaveError(result.message);
      return;
    }
    if (typeof result.data?.writeGeneration === 'number') {
      setWriteGeneration(result.data.writeGeneration);
      writeGenerationRef.current = result.data.writeGeneration;
    }
    setAnswersByCategory({});
    setShowFullRestart(false);
    setStep({ kind: 'directory' });
  }

  async function retryPendingSave() {
    if (pendingProgress) {
      await persistProgress(pendingProgress);
      return;
    }
    const pending = pendingAnswerRef.current;
    if (!pending) return;
    const located = categories
      .flatMap((category) =>
        category.questions.map((question) => ({ category, question }))
      )
      .find((item) => item.question.id === pending.questionKey);
    if (!located) return;
    await persistAnswer(located.question, pending.answer);
  }

  if (step.kind === 'directory') {
    return (
      <CompatibilityProfileDirectory
        items={directoryItems}
        onOpenCategory={(categoryNumber) => void openCategory(categoryNumber)}
        overallComplete={overallComplete}
        onShowOverallComplete={() => setStep({ kind: 'all_complete' })}
      />
    );
  }

  if (step.kind === 'all_complete') {
    return (
      <OverallCompletePanel
        eligibleQuestionsCompleted={totalCompleted}
        priorityFollowUpsCompleted={totalPriorities}
        showRestartConfirm={showFullRestart}
        restartBusy={restartBusy}
        onReviewCategories={() => void backToDirectory()}
        onRequestRestart={() => setShowFullRestart(true)}
        onConfirmRestart={() => void confirmFullRestart()}
        onCancelRestart={() => setShowFullRestart(false)}
      />
    );
  }

  const category = categoriesByNumber.get(step.categoryNumber);
  if (!category) {
    return (
      <CompatibilityProfileDirectory
        items={directoryItems}
        onOpenCategory={(categoryNumber) => void openCategory(categoryNumber)}
      />
    );
  }

  const answers = answersByCategory[category.number] ?? {};
  const eligible = toEligibleCategoryView(category, parentingProfile);
  const intro = getIntroCopy(category.number);

  if (step.kind === 'intro') {
    return (
      <CategoryIntroPanel
        categoryTitle={category.title}
        questionCount={eligible.questions.length}
        intro={intro}
        onBegin={() => void handleBegin(category.number)}
        onBackToDirectory={() => void backToDirectory()}
      />
    );
  }

  if (step.kind === 'complete') {
    return (
      <CategoryCompletePanel
        categoryTitle={category.title}
        eligibleQuestionsCompleted={countCompletedEligibleQuestions(
          category,
          answers,
          parentingProfile
        )}
        priorityFollowUpsCompleted={countCompletedPrioritiesInCategory(
          category,
          answers,
          parentingProfile
        )}
        showRestartConfirm={showCategoryRestart}
        restartBusy={restartBusy}
        onReview={() =>
          setStep({
            kind: 'question',
            categoryNumber: category.number,
            questionIndex: 0,
            phase: 'base',
          })
        }
        onBackToCategories={
          overallComplete ? () => setStep({ kind: 'all_complete' }) : backToDirectory
        }
        onRequestRestart={() => setShowCategoryRestart(true)}
        onConfirmRestart={() => void confirmCategoryRestart(category)}
        onCancelRestart={() => setShowCategoryRestart(false)}
      />
    );
  }

  const flowStep = toCategoryFlowStep(step);
  const canContinue = flowStep
    ? canContinueEligible(category, flowStep, answers, parentingProfile)
    : false;
  const question = eligible.questions[step.questionIndex];
  if (!question) {
    return (
      <CompatibilityProfileDirectory
        items={directoryItems}
        onOpenCategory={(categoryNumber) => void openCategory(categoryNumber)}
      />
    );
  }
  const answer = answers[question.id] ?? emptyPersistedAnswer();
  const eligibleIds = eligibleSelectedChoiceIds(question, answer.selectedChoiceIds);
  const eligibleChoices = question.choices.filter((choice) =>
    eligibleIds.includes(choice.id)
  );
  const progress = flowStep
    ? eligibleProgressFraction(category, flowStep, parentingProfile)
    : 0;
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
    totalQuestions: eligible.questions.length,
    progress,
    phaseLabel,
    onBackToDirectory: () => void backToDirectory(),
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start">
      <PreviewContextPanel variant="desktop" {...contextProps} />

      <section className="rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-5 shadow-sm sm:p-8">
        <PreviewContextPanel variant="mobile" {...contextProps} />

        {step.phase === 'base' ? (
          <>
            <QuestionnaireQuestion
              question={question}
              answer={answer}
              atMaxMessage={limitMessage}
              onToggleChoice={(choiceId) =>
                void handleToggleBase(category, question.id, choiceId)
              }
            />
            <OptionalContextFields
              question={question}
              selectedChoiceIds={answer.selectedChoiceIds}
              choiceContexts={answer.choiceContexts}
              onChange={(choiceId, text) =>
                void handleContextChange(category, question.id, choiceId, text)
              }
            />
            <StructuredIdentityFields
              question={question}
              identity={answer.identity}
              onChange={(identity) =>
                void handleIdentityChange(category, question.id, identity)
              }
            />
          </>
        ) : (
          <PriorityFollowUp
            question={question}
            answer={answer}
            eligibleChoices={eligibleChoices}
            onToggleChoice={(choiceId) =>
              void handleTogglePriority(category, question.id, choiceId)
            }
          />
        )}

        <SaveStatus
          status={saveStatus}
          errorMessage={saveError}
          onRetry={() => void retryPendingSave()}
        />

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
            onClick={() => void handleContinue(category)}
            disabled={!canContinue || continueBusy || saveStatus === 'saving'}
            className="forge-btn-primary inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {continueBusy || saveStatus === 'saving' ? 'Saving' : 'Continue'}
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--forge-graphite)]">
          {totalCompleted} of {totalEligible} eligible questions complete across your
          Compatibility Profile
        </p>
      </section>
    </div>
  );
}
