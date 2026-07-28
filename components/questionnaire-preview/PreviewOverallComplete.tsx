'use client';

import Link from 'next/link';
import { useState } from 'react';

import PreviewNotice from '@/components/questionnaire-preview/PreviewNotice';
import { OVERALL_COMPLETE_COPY } from '@/lib/questionnaire/preview/category-01-preview-flow';

type PreviewOverallCompleteProps = {
  totalQuestions: number;
  onReviewCategories: () => void;
  onRestartFullPreview: () => void;
};

export default function PreviewOverallComplete({
  totalQuestions,
  onReviewCategories,
  onRestartFullPreview,
}: PreviewOverallCompleteProps) {
  const [confirmRestart, setConfirmRestart] = useState(false);

  return (
    <section className="mx-auto w-full max-w-2xl">
      <PreviewNotice className="mb-6" />
      <div className="rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-6 shadow-sm sm:p-10">
        <p className="forge-accent-red mb-3 text-xs font-semibold uppercase tracking-[0.14em]">
          {OVERALL_COMPLETE_COPY.eyebrow}
        </p>
        <h1
          id="preview-question-heading"
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight text-[var(--forge-navy)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-preview-display), ui-serif, Georgia, serif' }}
        >
          {OVERALL_COMPLETE_COPY.heading}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#3A4556] sm:text-lg">
          {OVERALL_COMPLETE_COPY.body}
        </p>

        <ul className="mt-8 space-y-2 rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_45%,transparent)] bg-[var(--forge-surface-soft)] px-5 py-4 text-sm text-[var(--forge-navy)]">
          <li>
            {totalQuestions} of {totalQuestions} questions answered
          </li>
          <li>{OVERALL_COMPLETE_COPY.summaryCategories}</li>
          <li>{OVERALL_COMPLETE_COPY.summaryNotSaved}</li>
        </ul>

        {confirmRestart ? (
          <div
            role="alertdialog"
            aria-labelledby="restart-full-preview-title"
            aria-describedby="restart-full-preview-description"
            className="mt-8 rounded-2xl border border-[color-mix(in_srgb,var(--forge-navy)_25%,var(--forge-silver))] bg-[var(--forge-surface-soft)] px-5 py-4"
          >
            <p
              id="restart-full-preview-title"
              className="text-base font-semibold text-[var(--forge-navy)]"
            >
              {OVERALL_COMPLETE_COPY.restart}
            </p>
            <p
              id="restart-full-preview-description"
              className="mt-2 text-sm leading-relaxed text-[#3A4556]"
            >
              {OVERALL_COMPLETE_COPY.restartConfirm}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setConfirmRestart(false);
                  onRestartFullPreview();
                }}
                className="forge-btn-primary inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
              >
                Confirm restart
              </button>
              <button
                type="button"
                onClick={() => setConfirmRestart(false)}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
              >
                Keep answers
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={onReviewCategories}
              className="forge-btn-primary inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
            >
              {OVERALL_COMPLETE_COPY.review}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRestart(true)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
            >
              {OVERALL_COMPLETE_COPY.restart}
            </button>
            <Link
              href="/app"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold text-[var(--forge-navy)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
            >
              {OVERALL_COMPLETE_COPY.backToForge}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
