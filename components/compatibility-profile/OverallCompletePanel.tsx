'use client';

import Link from 'next/link';

import ConfirmDialog from '@/components/compatibility-profile/ConfirmDialog';
import {
  OVERALL_COMPLETE_COPY,
  RESTART_FULL_COPY,
} from '@/lib/questionnaire/persistence/copy';

type OverallCompletePanelProps = {
  eligibleQuestionsCompleted: number;
  priorityFollowUpsCompleted: number;
  showRestartConfirm: boolean;
  restartBusy?: boolean;
  onReviewCategories: () => void;
  onRequestRestart: () => void;
  onConfirmRestart: () => void;
  onCancelRestart: () => void;
};

export default function OverallCompletePanel({
  eligibleQuestionsCompleted,
  priorityFollowUpsCompleted,
  showRestartConfirm,
  restartBusy = false,
  onReviewCategories,
  onRequestRestart,
  onConfirmRestart,
  onCancelRestart,
}: OverallCompletePanelProps) {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-6 shadow-sm sm:p-10">
        <p className="forge-accent-red mb-3 text-xs font-semibold uppercase tracking-[0.14em]">
          {OVERALL_COMPLETE_COPY.eyebrow}
        </p>
        <h1
          id="compatibility-question-heading"
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight text-[var(--forge-navy)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-preview-display), ui-serif, Georgia, serif' }}
        >
          {OVERALL_COMPLETE_COPY.heading}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#3A4556] sm:text-lg">
          {OVERALL_COMPLETE_COPY.body}
        </p>
        <ul className="mt-6 space-y-2 text-sm text-[var(--forge-navy)]">
          <li>{eligibleQuestionsCompleted} eligible questions completed</li>
          <li>Ten of ten categories completed</li>
          <li>{priorityFollowUpsCompleted} priority follow ups completed</li>
          <li>{OVERALL_COMPLETE_COPY.summarySaved}</li>
        </ul>

        {showRestartConfirm ? (
          <div className="mt-8">
            <ConfirmDialog
              heading={RESTART_FULL_COPY.heading}
              body={RESTART_FULL_COPY.body}
              confirmLabel={RESTART_FULL_COPY.confirm}
              cancelLabel={RESTART_FULL_COPY.cancel}
              onConfirm={onConfirmRestart}
              onCancel={onCancelRestart}
              busy={restartBusy}
            />
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={onReviewCategories}
              className="forge-btn-primary inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
            >
              {OVERALL_COMPLETE_COPY.review}
            </button>
            <Link
              href="/profile"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
            >
              {OVERALL_COMPLETE_COPY.backToProfile}
            </Link>
            <button
              type="button"
              onClick={onRequestRestart}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-[var(--forge-graphite)] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
            >
              {OVERALL_COMPLETE_COPY.restart}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
