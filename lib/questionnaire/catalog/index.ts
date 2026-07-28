import { buildCalibratedCategories } from '@/lib/questionnaire/catalog/calibration-v2';
import { CATEGORY_01 as BASE_CATEGORY_01 } from '@/lib/questionnaire/catalog/category-01';
import { CATEGORY_02 as BASE_CATEGORY_02 } from '@/lib/questionnaire/catalog/category-02';
import { CATEGORY_03 as BASE_CATEGORY_03 } from '@/lib/questionnaire/catalog/category-03';
import { CATEGORY_04 as BASE_CATEGORY_04 } from '@/lib/questionnaire/catalog/category-04';
import { CATEGORY_05 as BASE_CATEGORY_05 } from '@/lib/questionnaire/catalog/category-05';
import { CATEGORY_06 as BASE_CATEGORY_06 } from '@/lib/questionnaire/catalog/category-06';
import {
  CATEGORY_07 as BASE_CATEGORY_07,
  CATEGORY_07_PARENTING_ELIGIBILITY,
} from '@/lib/questionnaire/catalog/category-07';
import {
  CATEGORY_08 as BASE_CATEGORY_08,
  CATEGORY_08_PARENTING_ELIGIBILITY,
} from '@/lib/questionnaire/catalog/category-08';
import {
  CATEGORY_09 as BASE_CATEGORY_09,
  CATEGORY_09_PARENTING_ELIGIBILITY,
} from '@/lib/questionnaire/catalog/category-09';
import { CATEGORY_10 as BASE_CATEGORY_10 } from '@/lib/questionnaire/catalog/category-10';
import type {
  CategoryDefinition,
  EligibilityRuleDefinition,
  QuestionnaireCatalog,
} from '@/lib/questionnaire/types';
import { assertValidQuestionnaireCatalog } from '@/lib/questionnaire/validate';

/** Active calibrated questionnaire catalog. V1 remains preserved in the database. */
export const QUESTIONNAIRE_VERSION = 'compatibility_profile_v2';

/** Ten categories with eight focused questions each and no priority follow-ups. */
export const SPECIFICATION_VERSION = 'compatibility_profile_calibrated_80_v1';

const CATEGORIES: CategoryDefinition[] = buildCalibratedCategories([
  BASE_CATEGORY_01,
  BASE_CATEGORY_02,
  BASE_CATEGORY_03,
  BASE_CATEGORY_04,
  BASE_CATEGORY_05,
  BASE_CATEGORY_06,
  BASE_CATEGORY_07,
  BASE_CATEGORY_08,
  BASE_CATEGORY_09,
  BASE_CATEGORY_10,
]);

export const [
  CATEGORY_01,
  CATEGORY_02,
  CATEGORY_03,
  CATEGORY_04,
  CATEGORY_05,
  CATEGORY_06,
  CATEGORY_07,
  CATEGORY_08,
  CATEGORY_09,
  CATEGORY_10,
] = CATEGORIES;

/**
 * Eligibility rules are version-scoped and referenced by question ids.
 * Categories 7 through 9 attach parenting eligibility on their conditional Q9.
 */
const ELIGIBILITY_RULES: EligibilityRuleDefinition[] = [
  CATEGORY_07_PARENTING_ELIGIBILITY,
  CATEGORY_08_PARENTING_ELIGIBILITY,
  CATEGORY_09_PARENTING_ELIGIBILITY,
];

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
  return getLockedCategories().filter((category) => category.number <= 10);
}

export function getCategoryByNumber(number: number): CategoryDefinition | undefined {
  return getQuestionnaireCatalog().categories.find((category) => category.number === number);
}

export function getEligibilityRules(): EligibilityRuleDefinition[] {
  return getQuestionnaireCatalog().eligibilityRules;
}

export {
  CATEGORY_07_PARENTING_ELIGIBILITY,
  CATEGORY_08_PARENTING_ELIGIBILITY,
  CATEGORY_09_PARENTING_ELIGIBILITY,
};
