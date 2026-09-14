'use client';

import { useCallback, useRef, useState } from 'react';

import AlignmentDetailsDrawer, {
  type AlignmentDetailsContent,
} from '@/components/AlignmentDetailsDrawer';
import PublicCharacterSignalsSection from '@/components/character-signals/PublicCharacterSignalsSection';
import ImportantAlignmentFactorsDrawer, {
  type ImportantAlignmentFactorDetail,
} from '@/components/ImportantAlignmentFactorsDrawer';
import type { CharacterSignalId } from '@/lib/character-signals/catalog';
import type {
  PublicCharacterSignal,
  RecognitionRecipient,
} from '@/lib/character-signals/types';
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
  characterSignals?: PublicCharacterSignal[];
  recognitionRecipient?: RecognitionRecipient | null;
  incompleteAssessmentCopy?: string;
  noFactorsCopy?: string;
  /** Optional paragraph when list reasons are not available (e.g. incomplete assessment). */
  whySurfacedCopy?: string;
  cardClassName?: string;
};

const WHY_SURFACED_PREVIEW_COUNT = 3;
const WHY_SURFACED_INTRO =
  'Meaningful common ground appears across:';

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
    answerContextMode: factor.answerContextMode,
  }));
}

/**
 * Qualitative Relationship Alignment + Important Alignment Factors +
 * Why Forge Introduced You + Character Signals for enriched profiles.
 * See Why You Align remains a separate drawer experience.
 */
export default function ProfileAlignmentSections({
  profileName,
  alignmentLabel,
  sharedStrengths,
  importantFactors,
  importantFactorsSummary,
  characterSignalIds,
  characterSignals,
  recognitionRecipient,
  incompleteAssessmentCopy,
  noFactorsCopy,
  whySurfacedCopy,
  cardClassName = 'border-t border-[#C9CBCE] py-5',
}: ProfileAlignmentSectionsProps) {
  const [alignmentOpen, setAlignmentOpen] = useState(false);
  const [factorsOpen, setFactorsOpen] = useState(false);
  const [whySurfacedExpanded, setWhySurfacedExpanded] = useState(false);
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
  const hasAlignmentReasons = sharedStrengths.length > 0 || Boolean(incompleteAssessmentCopy);
  const hasWhySurfacedOverflow =
    !whySurfacedCopy && sharedStrengths.length > WHY_SURFACED_PREVIEW_COUNT;
  const visibleStrengths =
    whySurfacedExpanded || !hasWhySurfacedOverflow
      ? sharedStrengths
      : sharedStrengths.slice(0, WHY_SURFACED_PREVIEW_COUNT);
  const showWhySurfaced =
    Boolean(whySurfacedCopy) || sharedStrengths.length > 0;
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
          className="mt-2.5 text-2xl font-medium tracking-[-0.01em] text-[#0B2D5C]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          {alignmentLabel}
        </h2>
        {incompleteAssessmentCopy ? (
          <p className="mt-3 text-sm leading-relaxed text-black">
            {incompleteAssessmentCopy}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-black">
            Based on your shared values, life goals, and profile answers.
          </p>
        )}
        {hasAlignmentReasons ? (
          <button
            ref={alignmentTriggerRef}
            type="button"
            onClick={() => {
              setFactorsOpen(false);
              setAlignmentOpen(true);
            }}
            className="mt-5 inline-flex min-h-11 items-center text-left text-sm font-semibold text-[#0B2D5C] underline decoration-[#0B2D5C]/55 underline-offset-[5px] transition hover:text-[#D62828] hover:decoration-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
            aria-haspopup="dialog"
            aria-expanded={alignmentOpen}
          >
            See Why You Align
          </button>
        ) : null}
      </section>

      {hasFactors ? (
        <button
          ref={factorsTriggerRef}
          data-profile-factor
          type="button"
          onClick={() => {
            setAlignmentOpen(false);
            setFactorsOpen(true);
          }}
          aria-haspopup="dialog"
          aria-expanded={factorsOpen}
          className="mt-4 w-full rounded-lg border border-[#C9CBCE] border-l-4 border-l-[#C92027] bg-[#F7F7F7] p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D62828]"
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
              <p className="mt-2 text-[15px] leading-relaxed text-black">
                {importantFactorsSummary ?? 'Review meaningful preference differences.'}
              </p>
              <p className="mt-4 text-sm font-semibold text-[#0B2D5C] underline decoration-[#0B2D5C]/55 underline-offset-[5px]">
                Review the Details
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
          <p className="mt-3 text-[15px] leading-relaxed text-black">{noFactorsCopy}</p>
        </section>
      ) : null}

      {showWhySurfaced ? (
        <details className={`${cardClassName} mt-4`}>
          <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold text-[#0B2D5C]">Why Forge Introduced You</summary>
          {whySurfacedCopy ? (
            <p className="mt-3 text-[15px] leading-relaxed text-black">{whySurfacedCopy}</p>
          ) : (
            <>
              <p className="mt-3 text-[15px] leading-relaxed text-black">{WHY_SURFACED_INTRO}</p>
              <ul className="mt-3 space-y-2.5">
                {visibleStrengths.map((item) => (
                  <li
                    key={`${item.title}-${item.copy}`}
                    className="flex items-start gap-2.5 text-[15px] leading-snug text-black"
                  >
                    <span
                      className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B2D5C]"
                      aria-hidden="true"
                    />
                    <span>{item.copy}</span>
                  </li>
                ))}
              </ul>
              {hasWhySurfacedOverflow ? (
                <button
                  type="button"
                  onClick={() => setWhySurfacedExpanded((open) => !open)}
                  className="mt-3 inline-flex min-h-11 items-center text-left text-sm font-semibold text-[#0B2D5C] underline decoration-[#0B2D5C]/55 underline-offset-[5px] transition hover:text-[#D62828] hover:decoration-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                  aria-expanded={whySurfacedExpanded}
                >
                  {whySurfacedExpanded ? 'Show Less' : 'Show More'}
                </button>
              ) : null}
            </>
          )}
        </details>
      ) : null}

      <PublicCharacterSignalsSection
        cardClassName={cardClassName}
        recognitionRecipient={recognitionRecipient}
        signals={characterSignals ?? characterSignalIds.map((signalId) => ({
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
        reviewAnswerHref="/compatibility-profile"
      />
    </>
  );
}
