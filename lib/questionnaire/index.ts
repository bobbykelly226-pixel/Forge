export type {
  AnswerChoiceDefinition,
  CatalogValidationIssue,
  CatalogValidationResult,
  CategoryDefinition,
  CategoryStatus,
  ConditionalQuestionDefinition,
  EligibilityRuleDefinition,
  PriorityFollowUpDefinition,
  QuestionDefinition,
  QuestionnaireCatalog,
  ResponseBehavior,
  ResponseState,
} from '@/lib/questionnaire/types';

export { RESPONSE_BEHAVIORS, RESPONSE_STATES } from '@/lib/questionnaire/types';

export {
  assertValidQuestionnaireCatalog,
  validateQuestionnaireCatalog,
} from '@/lib/questionnaire/validate';

export {
  CATEGORY_01,
  QUESTIONNAIRE_VERSION,
  SPECIFICATION_VERSION,
  getCategoryByNumber,
  getEligibilityRules,
  getLockedCategories,
  getQuestionnaireCatalog,
} from '@/lib/questionnaire/catalog';

export {
  ARCHITECTURE_COVERAGE_EXAMPLES,
  FORMAT_LABEL_TO_BEHAVIOR,
  FOUNDATION_CAPABILITY_MANIFEST,
  MASTER_ELIGIBILITY_DESCRIPTION,
  MASTER_FORMAT_LABELS,
  MASTER_STRUCTURE_COUNTS,
  resolveResponseBehavior,
} from '@/lib/questionnaire/architecture-coverage';
