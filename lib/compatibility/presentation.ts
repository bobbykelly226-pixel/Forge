/**
 * Maps Compatibility Engine results into existing Discovery presentation shapes.
 * UI components must not perform scoring — they only render this output.
 */

import type {
  SeedAlignmentFactor,
  SeedProfileAlignmentPresentation,
} from '@/lib/seed/adapters';

import type { CompatibilityEngineResult } from './types';

export function toAlignmentPresentation(
  result: CompatibilityEngineResult,
  options?: { characterSignalIds?: SeedProfileAlignmentPresentation['characterSignalIds'] }
): SeedProfileAlignmentPresentation {
  const importantFactors: SeedAlignmentFactor[] = [
    ...result.importantDifferences.map((item, index) => ({
      id: `engine-important-${item.categoryKey}-${index}`,
      title: item.title,
      severity: 'potential_dealbreaker' as const,
      summary: item.copy,
      explanation: item.copy,
      isPotentialDealbreaker: true,
    })),
    ...result.worthDiscussing.map((item, index) => ({
      id: `engine-discuss-${item.categoryKey}-${index}`,
      title: item.title,
      severity: 'worth_discussing' as const,
      summary: item.copy,
      explanation: item.copy,
      isPotentialDealbreaker: false,
    })),
  ];

  const sharedStrengths = [
    ...result.strengths.map((item) => ({
      title: item.title,
      copy: item.copy,
    })),
    // Compatible differences are useful alignment context, not conflicts.
    ...result.compatibleDifferences.map((item) => ({
      title: item.title,
      copy: item.copy,
    })),
  ];

  const incomplete =
    result.alignment.key === 'not_enough_information'
      ? (result.dataNote ??
        'Forge does not yet have enough completed answers to assess Relationship Alignment responsibly. Missing information is not treated as a mismatch.')
      : undefined;

  return {
    alignmentLabel: result.alignment.label,
    sharedStrengths,
    importantFactors,
    importantFactorsSummary:
      importantFactors.length > 0
        ? (importantFactors[0]?.summary ?? 'Review meaningful preference differences.')
        : null,
    characterSignalIds: options?.characterSignalIds ?? [],
    incompleteAssessmentCopy: incomplete,
    noFactorsCopy:
      importantFactors.length === 0 && result.alignment.key !== 'not_enough_information'
        ? 'No major alignment concerns surfaced from the information currently available.'
        : undefined,
    // Prefer list reasons from strengths/compatible differences in the existing UI.
    whySurfacedCopy:
      sharedStrengths.length === 0 ? result.alignment.summary : undefined,
  };
}

/** Feed-card fields derived from engine output (still no Confidence metric). */
export function toFeedAlignmentFields(result: CompatibilityEngineResult): {
  alignmentLabel: string;
  hasImportantFactors: boolean;
  importantFactorsSummary?: string;
} {
  return {
    alignmentLabel: result.alignment.label,
    hasImportantFactors: result.importantDifferences.length > 0,
    importantFactorsSummary:
      result.importantDifferences[0]?.copy ??
      result.worthDiscussing[0]?.copy ??
      undefined,
  };
}
