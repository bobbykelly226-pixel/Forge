import { CATEGORY_01 } from '@/lib/questionnaire/catalog/category-01';
import type {
  CategoryDefinition,
  EligibilityRuleDefinition,
  QuestionnaireCatalog,
} from '@/lib/questionnaire/types';
import { assertValidQuestionnaireCatalog } from '@/lib/questionnaire/validate';

/** Questionnaire catalog version for this foundation slice. */
export const QUESTIONNAIRE_VERSION = 'compatibility_profile_v1';

/** Specification version for the Compatibility Profile foundation after Category 1 reduction to 10. */
export const SPECIFICATION_VERSION = 'compatibility_profile_category_1_v10';

const CATEGORIES: CategoryDefinition[] = [CATEGORY_01];

/**
 * Eligibility rules are version-scoped and referenced by question ids.
 * Category 1 has none; Categories 6+ attach parenting eligibility (not imported yet).
 */
const ELIGIBILITY_RULES: EligibilityRuleDefinition[] = [];

export function getQuestionnaireCatalog(): QuestionnaireCatalog {
  return assertValidQuestionnaireCatalog({
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    specificationVersion: SPECIFICATION_VERSION,
    categories: CATEGORIES,
    eligibilityRules: ELIGIBILITY_RULES,
  });
}

export function getLockedCategories(): CategoryDefinition[] {
  return getQuestionnaireCatalog().categories.filter((category) => category.status === 'locked');
}

export function getCategoryByNumber(number: number): CategoryDefinition | undefined {
  return getQuestionnaireCatalog().categories.find((category) => category.number === number);
}

export function getEligibilityRules(): EligibilityRuleDefinition[] {
  return getQuestionnaireCatalog().eligibilityRules;
}

export { CATEGORY_01 };
