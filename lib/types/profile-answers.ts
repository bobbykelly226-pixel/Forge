/**
 * Stable profile questionnaire keys (authoritative: profile_answers).
 * Mirrors the live onboarding questions — do not invent unused keys here.
 */

export const PROFILE_ANSWER_KEYS = {
  relationshipIntention: 'relationship_intention',
  coreValues: 'core_values',
} as const;

export type ProfileAnswerKey =
  (typeof PROFILE_ANSWER_KEYS)[keyof typeof PROFILE_ANSWER_KEYS];

/** JSONB payload stored per question. */
export type ProfileAnswerValue = string | string[];

export type ProfileAnswersMap = Partial<
  Record<ProfileAnswerKey, ProfileAnswerValue>
>;

export const ONBOARDING_STEPS = {
  welcome: 'welcome',
  intention: 'intention',
  values: 'values',
  readiness: 'readiness',
} as const;

export type OnboardingStepId =
  (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export const ONBOARDING_STEP_ORDER: OnboardingStepId[] = [
  ONBOARDING_STEPS.welcome,
  ONBOARDING_STEPS.intention,
  ONBOARDING_STEPS.values,
  ONBOARDING_STEPS.readiness,
];

/** Map step number (1–4) ↔ stable step id. */
export function onboardingStepNumber(stepId: OnboardingStepId): number {
  return ONBOARDING_STEP_ORDER.indexOf(stepId) + 1;
}

export function onboardingStepIdFromNumber(step: number): OnboardingStepId {
  return ONBOARDING_STEP_ORDER[Math.max(0, Math.min(step, 4) - 1)]!;
}

/**
 * Derive the first incomplete onboarding step from saved answers + flags.
 * Completed users should not call this for routing (redirect instead).
 */
export function deriveOnboardingStep(input: {
  onboardingCompleted: boolean;
  savedStep: string | null | undefined;
  answers: ProfileAnswersMap;
}): OnboardingStepId {
  if (input.onboardingCompleted) {
    return ONBOARDING_STEPS.readiness;
  }

  const hasIntention =
    typeof input.answers.relationship_intention === 'string' &&
    input.answers.relationship_intention.trim().length > 0;
  const hasValues =
    Array.isArray(input.answers.core_values) &&
    input.answers.core_values.length > 0;

  if (!hasIntention) {
    // Honor an explicit saved welcome/intention step if present.
    if (
      input.savedStep === ONBOARDING_STEPS.welcome ||
      input.savedStep === ONBOARDING_STEPS.intention
    ) {
      return input.savedStep;
    }
    return hasValues || input.savedStep
      ? ONBOARDING_STEPS.intention
      : ONBOARDING_STEPS.welcome;
  }

  if (!hasValues) {
    return ONBOARDING_STEPS.values;
  }

  return ONBOARDING_STEPS.readiness;
}

export function isOnboardingContentComplete(answers: ProfileAnswersMap): boolean {
  const hasIntention =
    typeof answers.relationship_intention === 'string' &&
    answers.relationship_intention.trim().length > 0;
  const hasValues =
    Array.isArray(answers.core_values) && answers.core_values.length > 0;
  return hasIntention && hasValues;
}

/** Things I Enjoy labels used by Profile V2 (ordered catalog). */
export const THINGS_I_ENJOY_OPTIONS = [
  'Broncos',
  'Camping',
  'Coffee Shops',
  'Weekend Trips',
  'Dogs',
  'Board Games',
  'Reading',
  'Fitness',
] as const;

export type ThingsIEnjoyLabel = (typeof THINGS_I_ENJOY_OPTIONS)[number];
