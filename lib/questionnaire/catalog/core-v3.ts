import type { CategoryDefinition, QuestionDefinition } from '@/lib/questionnaire/types';

/**
 * Compatibility Profile V3 keeps three focused questions in every category.
 * Stable question and choice keys are intentionally retained so eligible V2
 * responses can be copied forward without reinterpreting a person's answer.
 */
export const CORE_QUESTION_IDS_BY_CATEGORY: Readonly<Record<string, readonly string[]>> = {
  relationship_vision_intentions: [
    'relationship_vision_intentions_q02',
    'relationship_vision_intentions_q03',
    'relationship_vision_intentions_q04',
  ],
  values_character: [
    'values_character_q03',
    'values_character_q04',
    'values_character_q07',
  ],
  communication_emotional_connection: [
    'communication_emotional_connection_q01',
    'communication_emotional_connection_q02',
    'communication_emotional_connection_q05',
  ],
  conflict_repair: [
    'conflict_repair_q01',
    'conflict_repair_q02',
    'conflict_repair_q06',
  ],
  commitment_partnership: [
    'commitment_partnership_q01',
    'commitment_partnership_q02',
    'commitment_partnership_q04',
  ],
  family_children_parenting: [
    'family_children_parenting_q06',
    'family_children_parenting_q07',
    'family_children_parenting_q08',
  ],
  faith_spirituality_worldview: [
    'faith_spirituality_worldview_q04',
    'faith_spirituality_worldview_q06',
    'faith_spirituality_worldview_q10',
  ],
  politics_civic_life_social_issues: [
    'politics_civic_life_social_issues_q01',
    'politics_civic_life_social_issues_q02',
    'politics_civic_life_social_issues_q06',
  ],
  service_community_contribution: [
    'service_community_contribution_q01',
    'service_community_contribution_q04',
    'service_community_contribution_q06',
  ],
  integrity_honesty_trust: [
    'integrity_honesty_trust_q01',
    'integrity_honesty_trust_q03',
    'integrity_honesty_trust_q07',
  ],
};

function withoutConditionalMetadata(question: QuestionDefinition): QuestionDefinition {
  const core = { ...question };
  delete core.eligibilityRuleId;
  delete core.conditional;
  delete core.priorityFollowUp;
  return core;
}

export function buildCoreCategories(
  categories: readonly CategoryDefinition[]
): CategoryDefinition[] {
  return categories.map((category) => {
    const ids = CORE_QUESTION_IDS_BY_CATEGORY[category.id];
    if (!ids || ids.length !== 3) {
      throw new Error(`Expected three V3 core questions for ${category.id}`);
    }

    const questions = ids.map((id, index) => {
      const source = category.questions.find((question) => question.id === id);
      if (!source) {
        throw new Error(`Missing V3 core source question ${id}`);
      }
      return {
        ...withoutConditionalMetadata(source),
        number: index + 1,
      };
    });

    return {
      ...category,
      questions,
      lockedProductDecisions: [
        'The initial Compatibility Profile contains three focused core questions in this category.',
        'Existing onboarding and profile facts are reused instead of asking duplicate identity or lifestyle questions.',
        'Category results are normalized before overall weighting.',
        'Important Alignment Factors remain separate and never automatically overwrite Relationship Alignment.',
        'Missing, withheld, and inapplicable answers are never scored as mismatches.',
      ],
      formatDistribution: Object.fromEntries(
        questions.reduce<Map<string, number[]>>((map, question) => {
          const values = map.get(question.formatLabel) ?? [];
          values.push(question.number);
          map.set(question.formatLabel, values);
          return map;
        }, new Map())
      ),
    };
  });
}
