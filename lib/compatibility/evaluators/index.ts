import type { CompatibilityEvaluator } from '../types';

import { childrenFamilyEvaluator } from './children-family';
import { coreValuesEvaluator } from './core-values';
import { drinkingEvaluator } from './drinking';
import { faithEvaluator } from './faith';
import { petsEvaluator } from './pets';
import { relationshipIntentionEvaluator } from './relationship-intention';
import { smokingEvaluator } from './smoking';

/**
 * Default V1 evaluator registry.
 * Future categories register here without rewriting the core engine.
 *
 * Not yet implemented (insufficient live fields):
 * - Communication style
 * - Conflict and repair
 * - Emotional maturity
 * - Financial philosophy
 */
export const DEFAULT_COMPATIBILITY_EVALUATORS: readonly CompatibilityEvaluator[] = [
  relationshipIntentionEvaluator,
  childrenFamilyEvaluator,
  faithEvaluator,
  coreValuesEvaluator,
  smokingEvaluator,
  drinkingEvaluator,
  petsEvaluator,
];
