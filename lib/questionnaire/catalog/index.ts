import { CATEGORY_01 } from '@/lib/questionnaire/catalog/category-01';
import type { CategoryDefinition, QuestionnaireCatalog } from '@/lib/questionnaire/types';
import { assertValidQuestionnaireCatalog } from '@/lib/questionnaire/validate';

/** Questionnaire catalog version for this foundation slice. */
export const QUESTIONNAIRE_VERSION = 'compatibility_profile_v1';

/** Specification version matching the final-locked Forge HQ export used for Category 1. */
export const SPECIFICATION_VERSION = 'forge_hq_final_locked_150_2026_07';

const CATEGORIES: CategoryDefinition[] = [CATEGORY_01];

export function getQuestionnaireCatalog(): QuestionnaireCatalog {
  return assertValidQuestionnaireCatalog({
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    specificationVersion: SPECIFICATION_VERSION,
    categories: CATEGORIES,
  });
}

export function getLockedCategories(): CategoryDefinition[] {
  return getQuestionnaireCatalog().categories.filter((category) => category.status === 'locked');
}

export function getCategoryByNumber(number: number): CategoryDefinition | undefined {
  return getQuestionnaireCatalog().categories.find((category) => category.number === number);
}

export { CATEGORY_01 };
