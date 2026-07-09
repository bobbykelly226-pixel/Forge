export const COMPATIBILITY_QUESTION_KEYS = {
  relationshipIntention: 'relationship_intention',
  coreValues: 'core_values',
} as const;

export type CompatibilityQuestionKey =
  (typeof COMPATIBILITY_QUESTION_KEYS)[keyof typeof COMPATIBILITY_QUESTION_KEYS];

/** JSONB payload stored per question. V1 uses string or string[]. */
export type CompatibilityAnswerValue = string | string[];

export type CompatibilityAnswer = {
  id: string;
  user_id: string;
  question_key: string;
  answer_value: CompatibilityAnswerValue;
  created_at: string;
  updated_at: string;
};

export type CompatibilityAnswersMap = Partial<
  Record<CompatibilityQuestionKey, CompatibilityAnswerValue>
>;
