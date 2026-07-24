'use client';

import Link from 'next/link';

import PreviewNotice from '@/components/questionnaire-preview/PreviewNotice';
import QuestionnaireProgress from '@/components/questionnaire-preview/QuestionnaireProgress';

type PreviewContextPanelProps = {
  categoryNumber: number;
  totalCategories: number;
  categoryTitle: string;
  questionNumber: number;
  totalQuestions: number;
  progress: number;
  phaseLabel?: string;
  onBackToDirectory?: () => void;
  /** `desktop` is lg+ sidebar; `mobile` is below-lg context strip. */
  variant: 'desktop' | 'mobile';
};

/**
 * Shared progress / notice / exit cluster.
 * Desktop and mobile mounts are mutually exclusive via Tailwind breakpoints.
 */
export default function PreviewContextPanel({
  categoryNumber,
  totalCategories,
  categoryTitle,
  questionNumber,
  totalQuestions,
  progress,
  phaseLabel,
  onBackToDirectory,
  variant,
}: PreviewContextPanelProps) {
  const rootClass =
    variant === 'desktop'
      ? 'hidden rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-5 shadow-sm lg:sticky lg:top-6 lg:block'
      : 'mb-6 rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-5 shadow-sm lg:hidden';

  return (
    <aside
      data-preview-context={variant}
      className={rootClass}
    >
      <QuestionnaireProgress
        categoryNumber={categoryNumber}
        totalCategories={totalCategories}
        categoryTitle={categoryTitle}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        progress={progress}
        phaseLabel={phaseLabel}
      />
      <PreviewNotice className="mt-5" />
      {onBackToDirectory ? (
        <button
          type="button"
          onClick={onBackToDirectory}
          className="mt-5 inline-flex text-sm font-semibold text-[var(--forge-navy)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
        >
          Back to categories
        </button>
      ) : null}
      <Link
        href="/app"
        className={`${onBackToDirectory ? 'mt-3' : 'mt-5'} inline-flex text-sm font-semibold text-[var(--forge-navy)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]`}
      >
        Exit preview
      </Link>
    </aside>
  );
}
