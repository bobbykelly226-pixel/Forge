'use client';

import Link from 'next/link';

import {
  CATEGORY_ACTION_LABELS,
  CATEGORY_STATUS_LABELS,
  DIRECTORY_COPY,
} from '@/lib/questionnaire/persistence/copy';
import type { CategoryDefinition } from '@/lib/questionnaire/types';

export type CategoryDirectoryStatus = 'not_started' | 'in_progress' | 'complete';

export type CategoryDirectoryItem = {
  category: CategoryDefinition;
  availableCount: number;
  completedCount: number;
  status: CategoryDirectoryStatus;
};

type CompatibilityProfileDirectoryProps = {
  items: CategoryDirectoryItem[];
  onOpenCategory: (categoryNumber: number) => void;
  overallComplete?: boolean;
  onShowOverallComplete?: () => void;
};

export default function CompatibilityProfileDirectory({
  items,
  onOpenCategory,
  overallComplete = false,
  onShowOverallComplete,
}: CompatibilityProfileDirectoryProps) {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-6 shadow-sm sm:p-10">
        <p className="forge-accent-red mb-3 text-xs font-semibold uppercase tracking-[0.14em]">
          {DIRECTORY_COPY.eyebrow}
        </p>
        <h1
          id="compatibility-question-heading"
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight text-[var(--forge-navy)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-preview-display), ui-serif, Georgia, serif' }}
        >
          {DIRECTORY_COPY.title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#3A4556] sm:text-lg">
          {DIRECTORY_COPY.body}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--forge-graphite)]">
          {DIRECTORY_COPY.supporting}
        </p>

        {overallComplete && onShowOverallComplete ? (
          <button
            type="button"
            onClick={onShowOverallComplete}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-navy)_25%,var(--forge-silver))] bg-[var(--forge-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--forge-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          >
            View completion summary
          </button>
        ) : null}

        <ul className="mt-8 space-y-3">
          {items.map(({ category, availableCount, completedCount, status }) => {
            const action =
              status === 'complete'
                ? CATEGORY_ACTION_LABELS.review
                : status === 'in_progress'
                  ? CATEGORY_ACTION_LABELS.continue
                  : CATEGORY_ACTION_LABELS.start;
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => onOpenCategory(category.number)}
                  className="flex w-full items-start justify-between gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_55%,transparent)] bg-white px-4 py-4 text-left transition hover:border-[color-mix(in_srgb,var(--forge-navy)_35%,var(--forge-silver))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
                >
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--forge-graphite)]">
                      Category {category.number} of 10
                    </span>
                    <span className="mt-1 block text-lg font-semibold text-[var(--forge-navy)]">
                      {category.title}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--forge-graphite)]">
                      {completedCount} of {availableCount} questions complete
                    </span>
                    <span className="mt-1 block text-sm font-medium text-[var(--forge-navy)]">
                      {CATEGORY_STATUS_LABELS[status]}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--forge-navy)]">
                    {action}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <Link
            href="/profile"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] sm:w-auto"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    </section>
  );
}
