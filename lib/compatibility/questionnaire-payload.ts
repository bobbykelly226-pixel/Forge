import type {
  QuestionnaireAlignmentComparison,
  QuestionnaireComparisonQuestion,
  QuestionnaireCompatibilityCategoryKey,
} from './questionnaire-types';
import { QUESTIONNAIRE_COMPATIBILITY_CATEGORY_KEYS } from './questionnaire-types';

const categoryKeys = new Set<string>(QUESTIONNAIRE_COMPATIBILITY_CATEGORY_KEYS);
const responseBehaviors = new Set([
  'single_choice',
  'multi_select',
  'scale_range',
  'scenario_choice',
  'structured_identity',
]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseQuestion(value: unknown): QuestionnaireComparisonQuestion | null {
  const row = record(value);
  if (!row) return null;
  const categoryKey = text(row.category_key);
  const categoryTitle = text(row.category_title);
  const questionKey = text(row.question_key);
  const prompt = text(row.prompt);
  const alignmentPurpose = text(row.alignment_purpose);
  const responseBehavior = text(row.response_behavior);
  const categoryNumber = number(row.category_number);
  const questionNumber = number(row.question_number);
  if (
    !categoryKey ||
    !categoryKeys.has(categoryKey) ||
    !categoryTitle ||
    !questionKey ||
    !prompt ||
    !alignmentPurpose ||
    !responseBehavior ||
    !responseBehaviors.has(responseBehavior) ||
    categoryNumber == null ||
    questionNumber == null
  ) {
    return null;
  }

  return {
    categoryKey: categoryKey as QuestionnaireCompatibilityCategoryKey,
    categoryTitle,
    categoryNumber,
    questionKey,
    questionNumber,
    prompt,
    alignmentPurpose,
    responseBehavior:
      responseBehavior as QuestionnaireComparisonQuestion['responseBehavior'],
    comparable: row.comparable === true,
    exactMatch: row.exact_match === true,
    selectedOverlap: number(row.selected_overlap),
    priorityOverlap: number(row.priority_overlap),
    ordinalDistance: number(row.ordinal_distance),
    ordinalSpan: number(row.ordinal_span),
  };
}

export function parseQuestionnaireAlignmentComparison(
  value: unknown
): QuestionnaireAlignmentComparison | null {
  const payload = record(value);
  if (!payload || payload.ok !== true) return null;
  const versionKey = text(payload.version_key);
  const partnerId = text(payload.partner_id);
  const viewerAnsweredCount = number(payload.viewer_answered_count);
  const partnerAnsweredCount = number(payload.partner_answered_count);
  const comparableQuestionCount = number(payload.comparable_question_count);
  const comparableCategoryCount = number(payload.comparable_category_count);
  if (
    !versionKey ||
    !partnerId ||
    viewerAnsweredCount == null ||
    partnerAnsweredCount == null ||
    comparableQuestionCount == null ||
    comparableCategoryCount == null
  ) {
    return null;
  }

  const questions = Array.isArray(payload.questions)
    ? payload.questions
        .map(parseQuestion)
        .filter((question): question is QuestionnaireComparisonQuestion =>
          Boolean(question)
        )
    : [];

  return {
    versionKey,
    partnerId,
    viewerAnsweredCount,
    partnerAnsweredCount,
    comparableQuestionCount,
    comparableCategoryCount,
    questions,
  };
}

export function parseQuestionnaireAlignmentComparisonMap(
  value: unknown
): Record<string, QuestionnaireAlignmentComparison> {
  const payload = record(value);
  const comparisons = record(payload?.comparisons);
  if (!payload || payload.ok !== true || !comparisons) return {};

  const result: Record<string, QuestionnaireAlignmentComparison> = {};
  for (const [partnerId, comparison] of Object.entries(comparisons)) {
    const parsed = parseQuestionnaireAlignmentComparison(comparison);
    if (parsed && parsed.partnerId === partnerId) result[partnerId] = parsed;
  }
  return result;
}
