export { evaluateCompatibility } from './engine';
export {
  evaluateQuestionnaireCompatibility,
  QUESTIONNAIRE_ALIGNMENT_COVERAGE,
} from './questionnaire-engine';
export {
  parseQuestionnaireAlignmentComparison,
  parseQuestionnaireAlignmentComparisonMap,
} from './questionnaire-payload';
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
  LegacyCompatibilityCategoryKey,
  RelationshipAlignmentKey,
} from './types';
export type {
  QuestionnaireAlignmentComparison,
  QuestionnaireComparisonQuestion,
  QuestionnaireCompatibilityCategoryKey,
} from './questionnaire-types';
export { RELATIONSHIP_ALIGNMENT_LABELS, RELATIONSHIP_ALIGNMENT_KEYS } from './types';
