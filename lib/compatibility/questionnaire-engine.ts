import type {
  AlignmentExplanationItem,
  CompatibilityEngineResult,
  FactorStatus,
  RelationshipAlignmentKey,
} from './types';
import { RELATIONSHIP_ALIGNMENT_LABELS } from './types';
import type {
  QuestionnaireAlignmentComparison,
  QuestionnaireComparisonQuestion,
  QuestionnaireCompatibilityCategoryKey,
} from './questionnaire-types';

const MIN_COMPARABLE_QUESTIONS = 12;
const MIN_COMPARABLE_CATEGORIES = 3;

const CATEGORY_WEIGHTS: Record<QuestionnaireCompatibilityCategoryKey, number> = {
  relationship_vision_intentions: 1.3,
  values_character: 1.05,
  communication_emotional_connection: 1,
  conflict_repair: 1.1,
  commitment_partnership: 1.15,
  family_children_parenting: 1.25,
  faith_spirituality_worldview: 1.15,
  politics_civic_life_social_issues: 0.95,
  service_community_contribution: 0.8,
  integrity_honesty_trust: 1.1,
};

type EvaluatedQuestion = QuestionnaireComparisonQuestion & {
  score: number;
};

type EvaluatedCategory = {
  key: QuestionnaireCompatibilityCategoryKey;
  title: string;
  score: number;
  status: FactorStatus;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function scoreQuestion(question: QuestionnaireComparisonQuestion): number {
  if (!question.comparable) return 0;
  if (question.exactMatch) return 1;

  if (
    question.responseBehavior === 'scale_range' &&
    question.ordinalDistance != null &&
    question.ordinalSpan != null
  ) {
    return clamp(1 - question.ordinalDistance / question.ordinalSpan);
  }

  if (question.responseBehavior === 'multi_select') {
    const base = question.selectedOverlap ?? 0;
    return question.priorityOverlap == null
      ? clamp(base)
      : clamp(base * 0.65 + question.priorityOverlap * 0.35);
  }

  // Different categorical/scenario answers can still coexist. Treat them as
  // something to understand, never as an inferred dealbreaker.
  return 0.5;
}

function statusForScore(score: number, allExact: boolean): FactorStatus {
  if (allExact && score >= 0.78) return 'strong_alignment';
  if (score >= 0.58) return 'compatible_difference';
  return 'worth_discussing';
}

function explanationItem(
  category: EvaluatedCategory,
  copy: string,
  privateComparison = false
): AlignmentExplanationItem {
  return {
    categoryKey: category.key,
    title: category.title,
    copy,
    ...(privateComparison
      ? { answerContextMode: 'private_comparison' as const }
      : {}),
  };
}

function categoryCopy(category: EvaluatedCategory): string {
  switch (category.status) {
    case 'strong_alignment':
      return `${category.title}: meaningful common ground.`;
    case 'compatible_difference':
      return `${category.title}: different answers with workable room.`;
    case 'worth_discussing':
      return `${category.title}: worth a thoughtful conversation.`;
    case 'important_difference':
      return `Your completed answers point in different directions on a high-impact part of ${category.title.toLowerCase()}. This deserves direct conversation, not judgment.`;
    case 'insufficient_information':
      return `More completed answers are needed around ${category.title.toLowerCase()}.`;
  }
}

function evaluateCategories(
  questions: QuestionnaireComparisonQuestion[]
): EvaluatedCategory[] {
  const byCategory = new Map<
    QuestionnaireCompatibilityCategoryKey,
    { title: string; questions: EvaluatedQuestion[] }
  >();

  for (const question of questions) {
    if (!question.comparable) continue;
    const score = scoreQuestion(question);
    const current = byCategory.get(question.categoryKey) ?? {
      title: question.categoryTitle,
      questions: [],
    };
    current.questions.push({ ...question, score });
    byCategory.set(question.categoryKey, current);
  }

  return [...byCategory.entries()]
    .map(([key, group]) => {
      const priorityWeighted = group.questions.map((question) => ({
        score: question.score,
        weight: question.priorityOverlap == null ? 1 : 1.25,
      }));
      const denominator = priorityWeighted.reduce((sum, item) => sum + item.weight, 0);
      const score =
        denominator > 0
          ? priorityWeighted.reduce(
              (sum, item) => sum + item.score * item.weight,
              0
            ) / denominator
          : 0;
      return {
        key,
        title: group.title,
        score,
        status: statusForScore(
          score,
          group.questions.every((question) => question.exactMatch)
        ),
      } satisfies EvaluatedCategory;
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

function overallAlignment(
  categories: EvaluatedCategory[]
): RelationshipAlignmentKey {
  const denominator = categories.reduce(
    (sum, category) => sum + CATEGORY_WEIGHTS[category.key],
    0
  );
  const weighted =
    denominator > 0
      ? categories.reduce(
          (sum, category) =>
            sum + category.score * CATEGORY_WEIGHTS[category.key],
          0
        ) / denominator
      : 0;

  if (weighted >= 0.8) return 'strong_alignment';
  if (weighted >= 0.58) return 'promising_alignment';
  return 'more_to_discover';
}

function summaryFor(
  key: RelationshipAlignmentKey,
  strengths: AlignmentExplanationItem[],
  important: AlignmentExplanationItem[]
): string {
  if (key === 'strong_alignment') {
    return 'Your completed Compatibility Profile answers show meaningful common ground across several parts of relationship life.';
  }
  if (key === 'promising_alignment') {
    return 'Your completed answers show encouraging alignment, with a few areas that would benefit from conversation.';
  }
  if (important.length > 0) {
    return 'Forge found meaningful common ground and a high-impact difference worth understanding directly.';
  }
  if (strengths.length > 0) {
    return 'There are real areas of alignment here, alongside differences worth exploring with curiosity.';
  }
  return 'Your completed answers suggest several topics worth understanding before drawing conclusions.';
}

/**
 * Evaluates privacy-safe comparison metrics. Returns null until both people
 * have enough comparable questionnaire coverage; callers may then retain an
 * existing profile-based presentation without treating missing answers as bad.
 */
export function evaluateQuestionnaireCompatibility(
  comparison: QuestionnaireAlignmentComparison
): CompatibilityEngineResult | null {
  if (
    comparison.comparableQuestionCount < MIN_COMPARABLE_QUESTIONS ||
    comparison.comparableCategoryCount < MIN_COMPARABLE_CATEGORIES
  ) {
    return null;
  }

  const categories = evaluateCategories(comparison.questions);
  const alignmentKey = overallAlignment(categories);
  const denominator = categories.reduce(
    (sum, category) => sum + CATEGORY_WEIGHTS[category.key],
    0
  );
  const weightedScore =
    denominator > 0
      ? categories.reduce(
          (sum, category) =>
            sum + category.score * CATEGORY_WEIGHTS[category.key],
          0
        ) / denominator
      : 0;

  const strengths = categories
    .filter((category) => category.status === 'strong_alignment')
    .map((category) => explanationItem(category, categoryCopy(category)));
  const compatibleDifferences = categories
    .filter((category) => category.status === 'compatible_difference')
    .map((category) => explanationItem(category, categoryCopy(category)));
  const worthDiscussing = categories
    .filter((category) => category.status === 'worth_discussing')
    .map((category) => explanationItem(category, categoryCopy(category)));
  const importantDifferences = categories
    .filter((category) => category.status === 'important_difference')
    .map((category) =>
      explanationItem(category, categoryCopy(category), true)
    );

  const sharedReasons = [...strengths, ...compatibleDifferences].map(
    (item) => item.copy
  );

  return {
    alignment: {
      key: alignmentKey,
      label: RELATIONSHIP_ALIGNMENT_LABELS[alignmentKey],
      summary: summaryFor(alignmentKey, strengths, importantDifferences),
    },
    strengths,
    compatibleDifferences,
    worthDiscussing,
    importantDifferences,
    whyForgeIntroducedYou: sharedReasons.slice(0, 6),
    dataNote:
      comparison.comparableQuestionCount < Math.min(
        comparison.viewerAnsweredCount,
        comparison.partnerAnsweredCount
      )
        ? 'Some completed answers are intentionally excluded when they cannot be compared responsibly.'
        : null,
    evaluatedCategories: categories.map((category) => category.key),
    skippedCategories: [],
    calculation: { weightedScore, weight: denominator },
  };
}

export const QUESTIONNAIRE_ALIGNMENT_COVERAGE = {
  minimumQuestions: MIN_COMPARABLE_QUESTIONS,
  minimumCategories: MIN_COMPARABLE_CATEGORIES,
} as const;
