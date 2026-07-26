export const QUESTIONNAIRE_COMPATIBILITY_CATEGORY_KEYS = [
  'relationship_vision_intentions',
  'values_character',
  'communication_emotional_connection',
  'conflict_repair',
  'commitment_partnership',
  'family_children_parenting',
  'faith_spirituality_worldview',
  'politics_civic_life_social_issues',
  'service_community_contribution',
  'integrity_honesty_trust',
] as const;

export type QuestionnaireCompatibilityCategoryKey =
  (typeof QUESTIONNAIRE_COMPATIBILITY_CATEGORY_KEYS)[number];

export type QuestionnaireComparisonQuestion = {
  categoryKey: QuestionnaireCompatibilityCategoryKey;
  categoryTitle: string;
  categoryNumber: number;
  questionKey: string;
  questionNumber: number;
  prompt: string;
  alignmentPurpose: string;
  responseBehavior:
    | 'single_choice'
    | 'multi_select'
    | 'scale_range'
    | 'scenario_choice'
    | 'structured_identity';
  comparable: boolean;
  exactMatch: boolean;
  selectedOverlap: number | null;
  priorityOverlap: number | null;
  ordinalDistance: number | null;
  ordinalSpan: number | null;
};

export type QuestionnaireAlignmentComparison = {
  versionKey: string;
  partnerId: string;
  viewerAnsweredCount: number;
  partnerAnsweredCount: number;
  comparableQuestionCount: number;
  comparableCategoryCount: number;
  questions: QuestionnaireComparisonQuestion[];
};
