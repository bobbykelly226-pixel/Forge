import { CATEGORY_01 } from '@/lib/questionnaire/catalog/category-01';
import { CATEGORY_02 } from '@/lib/questionnaire/catalog/category-02';
import { CATEGORY_03 } from '@/lib/questionnaire/catalog/category-03';
import { CATEGORY_04 } from '@/lib/questionnaire/catalog/category-04';
import { CATEGORY_05 } from '@/lib/questionnaire/catalog/category-05';
import { CATEGORY_06 } from '@/lib/questionnaire/catalog/category-06';
import {
  CATEGORY_07,
  CATEGORY_07_PARENTING_ELIGIBILITY,
} from '@/lib/questionnaire/catalog/category-07';
import type {
  CategoryDefinition,
  EligibilityRuleDefinition,
  QuestionnaireCatalog,
} from '@/lib/questionnaire/types';
import { assertValidQuestionnaireCatalog } from '@/lib/questionnaire/validate';

/** Questionnaire catalog version for this foundation slice. */
export const QUESTIONNAIRE_VERSION = 'compatibility_profile_v1';

/** Specification version after Categories 1 through 7 are locked at ten questions each. */
export const SPECIFICATION_VERSION = 'compatibility_profile_categories_1_7_v10';

const CATEGORIES: CategoryDefinition[] = [
  CATEGORY_01,
  CATEGORY_02,
  CATEGORY_03,
  CATEGORY_04,
  CATEGORY_05,
  CATEGORY_06,
  CATEGORY_07,
];

/**
 * Eligibility rules are version-scoped and referenced by question ids.
 * Category 7 Q9 attaches parenting eligibility. Categories 8 through 10 remain
 * architecture only in this slice.
 */
const ELIGIBILITY_RULES: EligibilityRuleDefinition[] = [CATEGORY_07_PARENTING_ELIGIBILITY];

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

export function getPreviewCategories(): CategoryDefinition[] {
  return getLockedCategories().filter((category) => category.number <= 7);
}

export function getCategoryByNumber(number: number): CategoryDefinition | undefined {
  return getQuestionnaireCatalog().categories.find((category) => category.number === number);
}

export function getEligibilityRules(): EligibilityRuleDefinition[] {
  return getQuestionnaireCatalog().eligibilityRules;
}

export {
  CATEGORY_01,
  CATEGORY_02,
  CATEGORY_03,
  CATEGORY_04,
  CATEGORY_05,
  CATEGORY_06,
  CATEGORY_07,
  CATEGORY_07_PARENTING_ELIGIBILITY,
};
