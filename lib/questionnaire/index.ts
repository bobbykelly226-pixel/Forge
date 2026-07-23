export type {
  AnswerChoiceDefinition,
  CatalogValidationIssue,
  CatalogValidationResult,
  CategoryDefinition,
  CategoryStatus,
  PriorityFollowUpDefinition,
  QuestionDefinition,
  QuestionFormat,
  QuestionnaireCatalog,
  ResponseState,
} from '@/lib/questionnaire/types';

export { QUESTION_FORMATS, RESPONSE_STATES } from '@/lib/questionnaire/types';

export {
  assertValidQuestionnaireCatalog,
  validateQuestionnaireCatalog,
} from '@/lib/questionnaire/validate';

export {
  CATEGORY_01,
  QUESTIONNAIRE_VERSION,
  SPECIFICATION_VERSION,
  getCategoryByNumber,
  getLockedCategories,
  getQuestionnaireCatalog,
} from '@/lib/questionnaire/catalog';
