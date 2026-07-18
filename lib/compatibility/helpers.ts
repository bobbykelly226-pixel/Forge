import { PREFER_NOT_TO_SAY } from '@/lib/profile/structured-options';

import type { CategoryEvaluation, CompatibilityCategoryKey, FactorStatus } from './types';
import { CATEGORY_WEIGHTS } from './weights';

export function isAnswered(value: string | null | undefined): boolean {
  if (value == null) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== PREFER_NOT_TO_SAY;
}

export function normalizeSlug(value: string | null | undefined): string | null {
  if (!isAnswered(value)) return null;
  return value!.trim();
}

export function insufficient(
  categoryKey: CompatibilityCategoryKey,
  categoryLabel: string,
  explanation: string,
  options?: { isHighImpact?: boolean }
): CategoryEvaluation {
  return {
    categoryKey,
    categoryLabel,
    hasEnoughInformation: false,
    status: 'insufficient_information',
    weight: CATEGORY_WEIGHTS[categoryKey],
    explanation,
    appearAsStrength: false,
    appearAsCompatibleDifference: false,
    appearAsWorthDiscussing: false,
    appearAsImportantDifference: false,
    isHighImpact: options?.isHighImpact ?? false,
  };
}

export function evaluation(input: {
  categoryKey: CompatibilityCategoryKey;
  categoryLabel: string;
  status: Exclude<FactorStatus, 'insufficient_information'>;
  explanation: string;
  supportingDetails?: string[];
  isHighImpact?: boolean;
  viewerSummary?: string;
  partnerSummary?: string;
}): CategoryEvaluation {
  const status = input.status;
  return {
    categoryKey: input.categoryKey,
    categoryLabel: input.categoryLabel,
    hasEnoughInformation: true,
    status,
    weight: CATEGORY_WEIGHTS[input.categoryKey],
    explanation: input.explanation,
    supportingDetails: input.supportingDetails,
    appearAsStrength: status === 'strong_alignment',
    appearAsCompatibleDifference: status === 'compatible_difference',
    appearAsWorthDiscussing: status === 'worth_discussing',
    appearAsImportantDifference: status === 'important_difference',
    isHighImpact: input.isHighImpact ?? false,
    viewerSummary: input.viewerSummary,
    partnerSummary: input.partnerSummary,
  };
}

export function hasOpenness(
  preferences: string[] | null | undefined
): preferences is string[] {
  return Array.isArray(preferences) && preferences.length > 0;
}

export function opennessIncludesAny(
  preferences: string[],
  candidates: readonly string[]
): boolean {
  if (preferences.includes('open_to_any')) return true;
  return candidates.some((value) => preferences.includes(value));
}

export function opennessIsUnknown(preferences: string[]): boolean {
  return preferences.length === 0 || preferences.includes('not_sure');
}
