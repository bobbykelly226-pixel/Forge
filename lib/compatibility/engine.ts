import type {
  AlignmentExplanationItem,
  CategoryEvaluation,
  CompatibilityEngineResult,
  CompatibilityEvaluator,
  CompatibilityPersonInput,
  RelationshipAlignmentKey,
} from './types';
import { RELATIONSHIP_ALIGNMENT_LABELS } from './types';
import { DEFAULT_COMPATIBILITY_EVALUATORS } from './evaluators';
import {
  ALIGNMENT_SCORE_THRESHOLDS,
  FACTOR_STATUS_SCORES,
  HIGH_IMPACT_CATEGORIES,
  MIN_SCOREABLE_CATEGORIES,
} from './weights';

function sortEvaluators(
  evaluators: readonly CompatibilityEvaluator[]
): CompatibilityEvaluator[] {
  // Deterministic order by category key regardless of registration order.
  return [...evaluators].sort((a, b) => a.key.localeCompare(b.key));
}

function toExplanation(evaluation: CategoryEvaluation): AlignmentExplanationItem {
  return {
    categoryKey: evaluation.categoryKey,
    title: evaluation.categoryLabel,
    copy: evaluation.explanation,
    viewerAnswer: evaluation.viewerSummary,
    partnerAnswer: evaluation.partnerSummary,
  };
}

function mapOverallAlignment(input: {
  scoreable: CategoryEvaluation[];
  weightedScore: number;
  hasHighImpactConflict: boolean;
  hasAnyImportantDifference: boolean;
}): RelationshipAlignmentKey {
  if (input.scoreable.length < MIN_SCOREABLE_CATEGORIES) {
    return 'not_enough_information';
  }

  if (input.hasHighImpactConflict) {
    return 'more_to_discover';
  }

  if (input.weightedScore >= ALIGNMENT_SCORE_THRESHOLDS.strong) {
    // Lifestyle important differences still prevent Strong Alignment.
    if (input.hasAnyImportantDifference) return 'promising_alignment';
    return 'strong_alignment';
  }

  if (input.weightedScore >= ALIGNMENT_SCORE_THRESHOLDS.promising) {
    return 'promising_alignment';
  }

  return 'more_to_discover';
}

function alignmentSummary(
  key: RelationshipAlignmentKey,
  strengths: AlignmentExplanationItem[],
  important: AlignmentExplanationItem[],
  dataNote: string | null
): string {
  switch (key) {
    case 'strong_alignment':
      return strengths.length > 0
        ? 'Your relationship goals and everyday lifestyles align in several meaningful ways.'
        : 'Several completed answers point toward meaningful alignment.';
    case 'promising_alignment':
      return important.length > 0
        ? 'There is real promise here, with a few differences worth understanding early.'
        : 'There are encouraging areas of alignment, with room still to learn more about each other.';
    case 'more_to_discover':
      return important.length > 0
        ? 'Forge surfaced important differences alongside areas that may still connect. Understanding those differences matters.'
        : 'There are signals worth exploring, and more profile detail would sharpen the picture.';
    case 'not_enough_information':
      return (
        dataNote ??
        'Forge does not yet have enough completed answers from both people to assess Relationship Alignment responsibly.'
      );
  }
}

function buildWhyIntroduced(
  strengths: AlignmentExplanationItem[],
  compatible: AlignmentExplanationItem[],
  key: RelationshipAlignmentKey
): string[] {
  const reasons = [
    ...strengths.map((item) => item.copy),
    ...compatible.map((item) => item.copy),
  ];
  if (reasons.length > 0) return reasons.slice(0, 6);

  if (key === 'not_enough_information') {
    return [];
  }

  return [
    'This profile is active in Discovery and shares enough completed context to be worth a thoughtful look.',
  ];
}

/**
 * Run Compatibility Engine V1 against two normalized profiles.
 * Pure / deterministic — no I/O, no UI scoring logic.
 */
export function evaluateCompatibility(
  viewer: CompatibilityPersonInput,
  partner: CompatibilityPersonInput,
  evaluators: readonly CompatibilityEvaluator[] = DEFAULT_COMPATIBILITY_EVALUATORS
): CompatibilityEngineResult {
  const ordered = sortEvaluators(evaluators);
  const evaluations = ordered.map((evaluator) => evaluator.evaluate(viewer, partner));

  const scoreable = evaluations.filter(
    (item) => item.status !== 'insufficient_information' && item.hasEnoughInformation
  );
  const skipped = evaluations
    .filter((item) => item.status === 'insufficient_information')
    .map((item) => item.categoryKey);

  let weightedTotal = 0;
  let weightSum = 0;
  for (const item of scoreable) {
    const statusScore =
      FACTOR_STATUS_SCORES[
        item.status as Exclude<keyof typeof FACTOR_STATUS_SCORES, never>
      ];
    if (statusScore == null) continue;
    weightedTotal += statusScore * item.weight;
    weightSum += item.weight;
  }
  const weightedScore = weightSum > 0 ? weightedTotal / weightSum : 0;

  const importantDifferences = evaluations
    .filter((item) => item.appearAsImportantDifference)
    .map(toExplanation);
  const hasHighImpactConflict = evaluations.some(
    (item) =>
      item.appearAsImportantDifference &&
      (item.isHighImpact || HIGH_IMPACT_CATEGORIES.has(item.categoryKey))
  );
  const hasAnyImportantDifference = importantDifferences.length > 0;

  const alignmentKey = mapOverallAlignment({
    scoreable,
    weightedScore,
    hasHighImpactConflict,
    hasAnyImportantDifference,
  });

  const strengths = evaluations.filter((item) => item.appearAsStrength).map(toExplanation);
  const compatibleDifferences = evaluations
    .filter((item) => item.appearAsCompatibleDifference)
    .map(toExplanation);
  const worthDiscussing = evaluations
    .filter((item) => item.appearAsWorthDiscussing)
    .map(toExplanation);

  const limitedData =
    skipped.length > 0 && scoreable.length < evaluators.length
      ? 'Some areas still need more profile details before Forge can compare them.'
      : null;

  const dataNote =
    alignmentKey === 'not_enough_information'
      ? 'Not enough completed answers are available yet. Missing information is not treated as a mismatch.'
      : limitedData;

  return {
    alignment: {
      key: alignmentKey,
      label: RELATIONSHIP_ALIGNMENT_LABELS[alignmentKey],
      summary: alignmentSummary(
        alignmentKey,
        strengths,
        importantDifferences,
        dataNote
      ),
    },
    strengths,
    compatibleDifferences,
    worthDiscussing,
    importantDifferences,
    whyForgeIntroducedYou: buildWhyIntroduced(
      strengths,
      compatibleDifferences,
      alignmentKey
    ),
    dataNote,
    evaluatedCategories: scoreable.map((item) => item.categoryKey),
    skippedCategories: skipped,
  };
}

/** Test helper: expose internal score mapping without a public percentage API. */
export function __debugWeightedScore(
  viewer: CompatibilityPersonInput,
  partner: CompatibilityPersonInput,
  evaluators: readonly CompatibilityEvaluator[] = DEFAULT_COMPATIBILITY_EVALUATORS
): number {
  const resultEvaluations = sortEvaluators(evaluators).map((evaluator) =>
    evaluator.evaluate(viewer, partner)
  );
  const scoreable = resultEvaluations.filter(
    (item) => item.status !== 'insufficient_information'
  );
  let weightedTotal = 0;
  let weightSum = 0;
  for (const item of scoreable) {
    const statusScore =
      FACTOR_STATUS_SCORES[
        item.status as Exclude<keyof typeof FACTOR_STATUS_SCORES, never>
      ];
    if (statusScore == null) continue;
    weightedTotal += statusScore * item.weight;
    weightSum += item.weight;
  }
  return weightSum > 0 ? weightedTotal / weightSum : 0;
}
