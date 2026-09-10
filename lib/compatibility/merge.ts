import { ALIGNMENT_SCORE_THRESHOLDS } from './weights';
import { RELATIONSHIP_ALIGNMENT_LABELS } from './types';
import type {
  AlignmentExplanationItem,
  CompatibilityEngineResult,
  RelationshipAlignmentKey,
} from './types';

/**
 * Profile/onboarding facts supplement the ten-category questionnaire without
 * becoming a second full questionnaire. The scale gives concrete profile
 * signals meaningful influence while keeping the normalized core primary.
 */
const PROFILE_EVIDENCE_SCALE = 0.35;

function alignmentForScore(score: number): RelationshipAlignmentKey {
  if (score >= ALIGNMENT_SCORE_THRESHOLDS.strong) return 'strong_alignment';
  if (score >= ALIGNMENT_SCORE_THRESHOLDS.promising) return 'promising_alignment';
  return 'more_to_discover';
}

function uniqueItems(items: AlignmentExplanationItem[]): AlignmentExplanationItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.categoryKey}:${item.copy}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summaryFor(
  key: RelationshipAlignmentKey,
  hasImportantFactors: boolean
): string {
  const factorNote = hasImportantFactors
    ? ' A specific stated boundary is shown separately so you can discuss it directly.'
    : '';
  switch (key) {
    case 'strong_alignment':
      return `Your completed answers show broad, meaningful common ground across relationship life.${factorNote}`;
    case 'promising_alignment':
      return `Your completed answers show encouraging alignment, with some areas worth understanding together.${factorNote}`;
    case 'more_to_discover':
      return `Your completed answers point to several areas that deserve more conversation before drawing conclusions.${factorNote}`;
    case 'not_enough_information':
      return 'Forge does not yet have enough comparable information to assess Relationship Alignment responsibly.';
  }
}

export function mergeCompatibilityResults(
  questionnaire: CompatibilityEngineResult,
  profile: CompatibilityEngineResult
): CompatibilityEngineResult {
  const questionnaireWeight = questionnaire.calculation.weight;
  const profileWeight = profile.calculation.weight * PROFILE_EVIDENCE_SCALE;
  const totalWeight = questionnaireWeight + profileWeight;
  const weightedScore =
    totalWeight > 0
      ? (questionnaire.calculation.weightedScore * questionnaireWeight +
          profile.calculation.weightedScore * profileWeight) /
        totalWeight
      : 0;
  const alignmentKey = alignmentForScore(weightedScore);

  const strengths = uniqueItems([...questionnaire.strengths, ...profile.strengths]);
  const compatibleDifferences = uniqueItems([
    ...questionnaire.compatibleDifferences,
    ...profile.compatibleDifferences,
  ]);
  const worthDiscussing = uniqueItems([
    ...questionnaire.worthDiscussing,
    ...profile.worthDiscussing,
  ]);
  const importantDifferences = uniqueItems([
    ...questionnaire.importantDifferences,
    ...profile.importantDifferences,
  ]);

  return {
    alignment: {
      key: alignmentKey,
      label: RELATIONSHIP_ALIGNMENT_LABELS[alignmentKey],
      summary: summaryFor(alignmentKey, importantDifferences.length > 0),
    },
    strengths,
    compatibleDifferences,
    worthDiscussing,
    importantDifferences,
    whyForgeIntroducedYou: [...strengths, ...compatibleDifferences]
      .map((item) => item.copy)
      .slice(0, 6),
    dataNote: questionnaire.dataNote ?? profile.dataNote,
    evaluatedCategories: [
      ...new Set([
        ...questionnaire.evaluatedCategories,
        ...profile.evaluatedCategories,
      ]),
    ],
    skippedCategories: [
      ...new Set([
        ...questionnaire.skippedCategories,
        ...profile.skippedCategories,
      ]),
    ].filter(
      (category) =>
        !questionnaire.evaluatedCategories.includes(category) &&
        !profile.evaluatedCategories.includes(category)
    ),
    calculation: { weightedScore, weight: totalWeight },
  };
}
