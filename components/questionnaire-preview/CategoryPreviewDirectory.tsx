'use client';

import Link from 'next/link';

import PreviewNotice from '@/components/questionnaire-preview/PreviewNotice';
import type { CategoryDefinition } from '@/lib/questionnaire/types';
import { DIRECTORY_COPY } from '@/lib/questionnaire/preview/category-01-preview-flow';

type CategoryPreviewDirectoryProps = {
  categories: CategoryDefinition[];
  completedCategoryNumbers: ReadonlySet<number>;
  onOpenCategory: (categoryNumber: number) => void;
};

export default function CategoryPreviewDirectory({
  categories,
  completedCategoryNumbers,
  onOpenCategory,
}: CategoryPreviewDirectoryProps) {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <PreviewNotice className="mb-6" />
      <div className="rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-6 shadow-sm sm:p-10">
        <p className="forge-accent-red mb-3 text-xs font-semibold uppercase tracking-[0.14em]">
          {DIRECTORY_COPY.eyebrow}
        </p>
        <h1
          id="preview-question-heading"
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight text-[var(--forge-navy)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-preview-display), ui-serif, Georgia, serif' }}
        >
          {DIRECTORY_COPY.title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#3A4556] sm:text-lg">
          {DIRECTORY_COPY.body}
        </p>
        <p className="mt-4 text-sm font-medium text-[var(--forge-navy)]">
          {DIRECTORY_COPY.metadata}
        </p>

        <ul className="mt-8 space-y-3">
          {categories.map((category) => {
            const complete = completedCategoryNumbers.has(category.number);
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
                      {category.questions.length} questions
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--forge-navy)]">
                    {complete ? 'Previewed' : 'Open'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <Link
            href="/app"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] sm:w-auto"
          >
            Back to Forge
          </Link>
        </div>
      </div>
    </section>
  );
}
