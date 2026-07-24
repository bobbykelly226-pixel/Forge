'use client';

import Link from 'next/link';

import PreviewNotice from '@/components/questionnaire-preview/PreviewNotice';

type CategoryPreviewCompleteProps = {
  categoryTitle: string;
  totalQuestions: number;
  priorityFollowUpsCompleted: number;
  completeEyebrow: string;
  completeBody: string;
  onReview: () => void;
  onRestart: () => void;
  onBackToDirectory: () => void;
};

export default function CategoryPreviewComplete({
  categoryTitle,
  totalQuestions,
  priorityFollowUpsCompleted,
  completeEyebrow,
  completeBody,
  onReview,
  onRestart,
  onBackToDirectory,
}: CategoryPreviewCompleteProps) {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <PreviewNotice className="mb-6" />
      <div className="rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-6 shadow-sm sm:p-10">
        <p className="forge-accent-red mb-3 text-xs font-semibold uppercase tracking-[0.14em]">
          {completeEyebrow}
        </p>
        <h1
          id="preview-question-heading"
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight text-[var(--forge-navy)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-preview-display), ui-serif, Georgia, serif' }}
        >
          You completed {categoryTitle}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#3A4556] sm:text-lg">
          {completeBody}
        </p>

        <ul className="mt-8 space-y-2 rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_45%,transparent)] bg-[var(--forge-surface-soft)] px-5 py-4 text-sm text-[var(--forge-navy)]">
          <li>
            {totalQuestions} of {totalQuestions} questions answered
          </li>
          <li>
            {priorityFollowUpsCompleted} priority follow up
            {priorityFollowUpsCompleted === 1 ? '' : 's'} completed
          </li>
          <li>Preview answers were not saved</li>
        </ul>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onReview}
            className="forge-btn-primary inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          >
            Review Answers
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          >
            Restart Category
          </button>
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          >
            Back to categories
          </button>
          <Link
            href="/app"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold text-[var(--forge-navy)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          >
            Back to Forge
          </Link>
        </div>
      </div>
    </section>
  );
}
