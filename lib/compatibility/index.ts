export { evaluateCompatibility } from './engine';
export {
  humanizeFactorAnswer,
  partnerSaidLabel,
  viewerSaidLabel,
} from './answer-labels';
export {
  personFromOwnerProfile,
  personFromPublicDiscoveryProfile,
  personFromSeedCompatibilityFields,
} from './inputs';
export { toAlignmentPresentation, toFeedAlignmentFields } from './presentation';
export { DEFAULT_COMPATIBILITY_EVALUATORS } from './evaluators';
export { CATEGORY_WEIGHTS, MIN_SCOREABLE_CATEGORIES } from './weights';
export type {
  CategoryEvaluation,
  CompatibilityCategoryKey,
  CompatibilityEngineResult,
  CompatibilityEvaluator,
  CompatibilityPersonInput,
  FactorStatus,
  RelationshipAlignmentKey,
} from './types';
export { RELATIONSHIP_ALIGNMENT_LABELS, RELATIONSHIP_ALIGNMENT_KEYS } from './types';
