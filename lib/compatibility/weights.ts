/**
 * Centralized weights and overall alignment mapping for Compatibility Engine V1.
 *
 * Rules:
 * - Missing answers are excluded from scoring (never treated as mismatches).
 * - Higher-impact relationship factors outweigh lifestyle preferences.
 * - A direct high-impact conflict cannot be erased by many minor similarities.
 * - No numeric percentage is exposed to the UI.
 */

import type { CompatibilityCategoryKey, FactorStatus } from './types';

export const CATEGORY_WEIGHTS: Record<CompatibilityCategoryKey, number> = {
  relationship_intention: 1.4,
  children_family: 1.35,
  faith: 1.15,
  core_values: 1.1,
  smoking: 0.95,
  drinking: 0.85,
  pets: 0.8,
};

/** Minimum scoreable categories before leaving Not Enough Information. */
export const MIN_SCOREABLE_CATEGORIES = 3;

/** Internal contribution scores for factor statuses (insufficient excluded). */
export const FACTOR_STATUS_SCORES: Record<Exclude<FactorStatus, 'insufficient_information'>, number> =
  {
    strong_alignment: 1,
    compatible_difference: 0.78,
    worth_discussing: 0.42,
    important_difference: 0,
  };

export const ALIGNMENT_SCORE_THRESHOLDS = {
  strong: 0.82,
  promising: 0.58,
} as const;

export const HIGH_IMPACT_CATEGORIES: ReadonlySet<CompatibilityCategoryKey> = new Set([
  'relationship_intention',
  'children_family',
  'faith',
]);
