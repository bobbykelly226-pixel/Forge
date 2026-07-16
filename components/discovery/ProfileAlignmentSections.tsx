'use client';

import { useCallback, useRef, useState } from 'react';

import AlignmentDetailsDrawer, {
  type AlignmentDetailsContent,
} from '@/components/AlignmentDetailsDrawer';
import PublicCharacterSignalsSection from '@/components/character-signals/PublicCharacterSignalsSection';
import ImportantAlignmentFactorsDrawer, {
  type ImportantAlignmentFactorDetail,
} from '@/components/ImportantAlignmentFactorsDrawer';
import type { CharacterSignalId } from '@/lib/character-signals-mock';
import {
  seedFactorSeverityLabel,
  type SeedAlignmentFactor,
  type SeedAlignmentItem,
} from '@/lib/seed/adapters';

export type ProfileAlignmentSectionsProps = {
  profileName: string;
  alignmentLabel: string;
  sharedStrengths: SeedAlignmentItem[];
  importantFactors: SeedAlignmentFactor[];
  importantFactorsSummary: string | null;
  characterSignalIds: CharacterSignalId[];
  incompleteAssessmentCopy?: string;
  noFactorsCopy?: string;
  whySurfacedCopy?: string;
  cardClassName?: string;
};

function toDrawerContent(props: ProfileAlignmentSectionsProps): AlignmentDetailsContent {
  const worthDiscussing = props.importantFactors
    .filter((factor) => factor.severity !== 'potential_dealbreaker')
    .map((factor) => ({
      title: factor.title,
      copy: factor.explanation,
    }));

  const dealbreaker = props.importantFactors.find((factor) => factor.isPotentialDealbreaker);

  return {
    alignmentLabel: props.alignmentLabel,
    intro:
      props.incompleteAssessmentCopy ??
      'Forge surfaced this profile because several meaningful areas of your lives appear to align.',
    strongAlignment: props.sharedStrengths,
    growingAlignment: worthDiscussing,
    moreInformation: props.incompleteAssessmentCopy
      ? [
          {
            title: 'Profile answers still incomplete',
            copy: 'Missing information is not treated as negative. Completing more answers would allow Forge to assess alignment responsibly.',
          },
        ]
      : [],
    importantFactorPreview: dealbreaker
      ? {
          title: dealbreaker.title,
          copy: dealbreaker.explanation,
          note: 'This is an Important Alignment Factor — not a judgment of either person.',
        }
      : null,
    incompleteCopy: props.incompleteAssessmentCopy,
    hideOnboardingLink: true,
  };
}

function toFactorDetails(
  factors: SeedAlignmentFactor[]
): ImportantAlignmentFactorDetail[] {
  return factors.map((factor) => ({
    title: factor.title,
    severityLabel: seedFactorSeverityLabel(factor.severity),
    explanation: factor.explanation,
    viewerAnswer: factor.viewerAnswer,
    partnerAnswer: factor.partnerAnswer,
  }));
}

/**
 * Qualitative Relationship Alignment + Important Alignment Factors + Character Signals
 * for profiles that provide enrichment (e.g. enriched seed profiles).
 * Reuses the approved drawers and Character Signals presentation.
 */
export default function ProfileAlignmentSections({
  profileName,
  alignmentLabel,
  sharedStrengths,
  importantFactors,
  importantFactorsSummary,
  characterSignalIds,
  incompleteAssessmentCopy,
  noFactorsCopy,
  whySurfacedCopy,
  cardClassName = 'rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6',
}: ProfileAlignmentSectionsProps) {
  const [alignmentOpen, setAlignmentOpen] = useState(false);
  const [factorsOpen, setFactorsOpen] = useState(false);
  const alignmentTriggerRef = useRef<HTMLButtonElement>(null);
  const factorsTriggerRef = useRef<HTMLButtonElement>(null);

  const closeAlignment = useCallback(() => {
    setAlignmentOpen(false);
    window.requestAnimationFrame(() => alignmentTriggerRef.current?.focus());
  }, []);

  const closeFactors = useCallback(() => {
    setFactorsOpen(false);
    window.requestAnimationFrame(() => factorsTriggerRef.current?.focus());
  }, []);

  const hasFactors = importantFactors.length > 0;
  const drawerContent = toDrawerContent({
    profileName,
    alignmentLabel,
    sharedStrengths,
    importantFactors,
    importantFactorsSummary,
    characterSignalIds,
    incompleteAssessmentCopy,
    noFactorsCopy,
  });

  return (
    <>
      <section className={cardClassName} aria-labelledby="alignment-title">
        <p
          id="alignment-title"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]"
        >
          Relationship Alignment
        </p>
        <h2
          className="mt-2 text-2xl text-[#0B2D5C]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          {alignmentLabel}
        </h2>
        {incompleteAssessmentCopy ? (
          <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
            {incompleteAssessmentCopy}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
            Based on shared values, life goals, and completed compatibility questions. This is
            qualitative guidance — not a numeric score.
          </p>
        )}
        <button
          ref={alignmentTriggerRef}
          type="button"
          onClick={() => {
            setFactorsOpen(false);
            setAlignmentOpen(true);
          }}
          className="mt-5 -mx-2 inline-flex w-[calc(100%+1rem)] min-h-11 items-center justify-between gap-3 rounded-2xl px-2 py-3 text-left text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#0B2D5C]/04 hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
          aria-haspopup="dialog"
          aria-expanded={alignmentOpen}
        >
          <span>See why you align</span>
          <span aria-hidden="true">→</span>
        </button>
      </section>

      {hasFactors ? (
        <button
          ref={factorsTriggerRef}
          type="button"
          onClick={() => {
            setAlignmentOpen(false);
            setFactorsOpen(true);
          }}
          aria-haspopup="dialog"
          aria-expanded={factorsOpen}
          className="mt-4 w-full rounded-[1.75rem] border-2 border-[#D62828] bg-[#FBF6EE] p-6 text-left shadow-[0_8px_28px_rgba(214,40,40,0.08)] transition hover:shadow-[0_10px_32px_rgba(214,40,40,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D62828]"
        >
          <div className="flex gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D62828] text-sm font-bold text-white"
              aria-hidden="true"
            >
              !
            </span>
            <div>
              <span className="block text-lg font-semibold tracking-tight text-[#0B2D5C]">
                Important Alignment Factors
              </span>
              <p className="mt-2 text-[15px] leading-relaxed text-[#5A6575]">
                {importantFactorsSummary ?? 'Review meaningful preference differences.'}
              </p>
              <p className="mt-4 text-sm font-semibold text-[#0B2D5C]">
                Tap to review the details
                <span aria-hidden="true"> →</span>
              </p>
            </div>
          </div>
        </button>
      ) : noFactorsCopy ? (
        <section className={`${cardClassName} mt-4`}>
          <h2
            className="text-lg text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Important Alignment Factors
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">{noFactorsCopy}</p>
        </section>
      ) : null}

      <section className={`${cardClassName} mt-4`} aria-labelledby="why-surfaced-heading">
        <h2
          id="why-surfaced-heading"
          className="text-xl text-[#0B2D5C]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          Why Forge surfaced this profile
        </h2>
        {whySurfacedCopy ? (
          <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">{whySurfacedCopy}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sharedStrengths.map((item) => (
              <li
                key={`${item.title}-${item.copy}`}
                className="flex items-start gap-3 text-[15px] leading-relaxed text-[#5A6575]"
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0B2D5C] text-[10px] font-bold text-white"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{item.copy}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PublicCharacterSignalsSection
        cardClassName={cardClassName}
        signals={characterSignalIds.map((signalId) => ({
          signalId,
          confirmationCount: 3,
        }))}
        emptyCopy="No public Character Signals yet"
      />

      <AlignmentDetailsDrawer
        open={alignmentOpen}
        onClose={closeAlignment}
        profileName={profileName}
        content={drawerContent}
      />
      <ImportantAlignmentFactorsDrawer
        open={factorsOpen}
        onClose={closeFactors}
        profileName={profileName}
        factors={toFactorDetails(importantFactors)}
        hideReviewAnswerLink
      />
    </>
  );
}
