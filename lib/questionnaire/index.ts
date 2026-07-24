export type {
  AnswerChoiceDefinition,
  CatalogValidationIssue,
  CatalogValidationResult,
  CategoryDefinition,
  CategoryStatus,
  ConditionalQuestionDefinition,
  EligibilityRuleDefinition,
  OptionalChoiceContextDefinition,
  PriorityFollowUpDefinition,
  PrivateIdentityFields,
  PrivateQuestionnaireResponse,
  PrivateSelectedChoice,
  QuestionDefinition,
  QuestionnaireCatalog,
  ResponseBehavior,
  ResponseQualifier,
  ResponseState,
  StructuredIdentityDefinition,
} from '@/lib/questionnaire/types';

export {
  RESPONSE_BEHAVIORS,
  RESPONSE_QUALIFIERS,
  RESPONSE_STATES,
} from '@/lib/questionnaire/types';

export {
  assertValidQuestionnaireCatalog,
  validateQuestionnaireCatalog,
} from '@/lib/questionnaire/validate';

export {
  CATEGORY_01,
  CATEGORY_02,
  CATEGORY_03,
  CATEGORY_04,
  CATEGORY_05,
  CATEGORY_06,
  CATEGORY_07,
  CATEGORY_07_PARENTING_ELIGIBILITY,
  QUESTIONNAIRE_VERSION,
  SPECIFICATION_VERSION,
  getCategoryByNumber,
  getEligibilityRules,
  getLockedCategories,
  getPreviewCategories,
  getQuestionnaireCatalog,
} from '@/lib/questionnaire/catalog';

export {
  ARCHITECTURE_COVERAGE_QUESTIONS,
  FORMAT_LABEL_TO_BEHAVIOR,
  FOUNDATION_CAPABILITY_MANIFEST,
  MASTER_ELIGIBILITY_DESCRIPTION,
  MASTER_FORMAT_LABELS,
  MASTER_STRUCTURE_COUNTS,
  MASTER_STRUCTURE_MANIFEST,
  getArchitectureCoverageCatalog,
  getManifestQuestion,
  getSyntheticCatalogFromManifest,
  resolveResponseBehavior,
} from '@/lib/questionnaire/architecture-coverage';
