'use client';

import Link from 'next/link';

import { PROFILE_CARD_COPY } from '@/lib/questionnaire/persistence/copy';

export type ProfileCompatibilityCardProps = {
  completedCategories: number;
  totalCategories: number;
  completedQuestions: number;
  totalEligibleQuestions: number;
  action: 'start' | 'continue' | 'review';
};

export default function ProfileCompatibilityCard({
  completedCategories,
  totalCategories,
  completedQuestions,
  totalEligibleQuestions,
  action,
}: ProfileCompatibilityCardProps) {
  const actionLabel =
    action === 'review'
      ? PROFILE_CARD_COPY.review
      : action === 'continue'
        ? PROFILE_CARD_COPY.continue
        : PROFILE_CARD_COPY.start;

  return (
    <section className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
        {PROFILE_CARD_COPY.eyebrow}
      </p>
      <h2
        className="mt-3 text-xl font-semibold tracking-tight text-[#0B2D5C]"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {PROFILE_CARD_COPY.heading}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
        {PROFILE_CARD_COPY.body}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[#7A8494]">
        {PROFILE_CARD_COPY.supporting}
      </p>
      <p className="mt-4 text-sm font-medium text-[#0B2D5C]">
        {completedCategories} of {totalCategories} categories complete
      </p>
      <p className="mt-1 text-sm font-medium text-[#0B2D5C]">
        {completedQuestions} of {totalEligibleQuestions} questions complete
      </p>
      <Link
        href="/compatibility-profile"
        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#0B2D5C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
