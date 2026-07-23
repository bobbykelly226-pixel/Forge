'use client';

import Link from 'next/link';

import PreviewNotice from '@/components/questionnaire-preview/PreviewNotice';
import { INTRO_COPY } from '@/lib/questionnaire/preview/category-01-preview-flow';

type CategoryPreviewIntroProps = {
  categoryTitle: string;
  questionCount: number;
  onBegin: () => void;
};

export default function CategoryPreviewIntro({
  categoryTitle,
  questionCount,
  onBegin,
}: CategoryPreviewIntroProps) {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <PreviewNotice className="mb-6" />
      <div className="rounded-3xl border border-[color-mix(in_srgb,var(--forge-silver)_50%,transparent)] bg-[var(--forge-surface)] p-6 shadow-sm sm:p-10">
        <p className="forge-accent-red mb-3 text-xs font-semibold uppercase tracking-[0.14em]">
          {INTRO_COPY.eyebrow}
        </p>
        <h1
          id="preview-question-heading"
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight text-[var(--forge-navy)] sm:text-4xl"
          style={{ fontFamily: 'var(--font-preview-display), ui-serif, Georgia, serif' }}
        >
          {categoryTitle}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#3A4556] sm:text-lg">
          {INTRO_COPY.body}
        </p>
        <p className="mt-4 text-base leading-relaxed text-[var(--forge-graphite)]">
          {INTRO_COPY.supporting}
        </p>
        <p className="mt-6 text-sm font-medium text-[var(--forge-navy)]">
          {questionCount} questions
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onBegin}
            className="forge-btn-primary inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] sm:w-auto"
          >
            {INTRO_COPY.primary}
          </button>
          <Link
            href="/app"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-6 py-3 text-base font-semibold text-[var(--forge-navy)] transition hover:bg-[var(--forge-surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)] sm:w-auto"
          >
            {INTRO_COPY.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
