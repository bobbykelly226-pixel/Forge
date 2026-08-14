export const GENDER_IDENTITY_OPTIONS = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'nonbinary', label: 'Nonbinary' },
  { value: 'another_identity', label: 'Another identity' },
] as const;

export const INTERESTED_IN_OPTIONS = [
  ...GENDER_IDENTITY_OPTIONS,
  { value: 'everyone', label: 'Everyone' },
] as const;

export const MIN_MATCH_AGE = 18;
export const MAX_MATCH_AGE = 100;
export const MIN_DISTANCE_MILES = 5;
export const MAX_DISTANCE_MILES = 500;

export type MatchingPreferencesInput = {
  genderIdentity: string;
  interestedIn: string[];
  preferredAgeMin: number;
  preferredAgeMax: number;
  maxDistanceMiles: number;
};

const identityValues = new Set<string>(GENDER_IDENTITY_OPTIONS.map((option) => option.value));
const interestValues = new Set<string>(INTERESTED_IN_OPTIONS.map((option) => option.value));

export function validateMatchingPreferences(
  input: MatchingPreferencesInput
): { ok: true; value: MatchingPreferencesInput } | { ok: false; message: string } {
  const genderIdentity = input.genderIdentity.trim();
  const interestedIn = [...new Set(input.interestedIn.map((value) => value.trim()).filter(Boolean))];

  if (!identityValues.has(genderIdentity)) {
    return { ok: false, message: 'Choose the identity that best describes you.' };
  }
  if (interestedIn.length === 0 || interestedIn.some((value) => !interestValues.has(value))) {
    return { ok: false, message: 'Choose who you would like to meet.' };
  }
  if (interestedIn.includes('everyone') && interestedIn.length > 1) {
    return { ok: false, message: 'Choose Everyone by itself, or select specific identities.' };
  }
  if (!Number.isInteger(input.preferredAgeMin) || input.preferredAgeMin < MIN_MATCH_AGE) {
    return { ok: false, message: 'Minimum preferred age must be at least 18.' };
  }
  if (!Number.isInteger(input.preferredAgeMax) || input.preferredAgeMax > MAX_MATCH_AGE) {
    return { ok: false, message: `Maximum preferred age cannot exceed ${MAX_MATCH_AGE}.` };
  }
  if (input.preferredAgeMin > input.preferredAgeMax) {
    return { ok: false, message: 'Minimum preferred age cannot exceed maximum preferred age.' };
  }
  if (
    !Number.isInteger(input.maxDistanceMiles) ||
    input.maxDistanceMiles < MIN_DISTANCE_MILES ||
    input.maxDistanceMiles > MAX_DISTANCE_MILES
  ) {
    return {
      ok: false,
      message: `Distance must be between ${MIN_DISTANCE_MILES} and ${MAX_DISTANCE_MILES} miles.`,
    };
  }

  return {
    ok: true,
    value: {
      genderIdentity,
      interestedIn,
      preferredAgeMin: input.preferredAgeMin,
      preferredAgeMax: input.preferredAgeMax,
      maxDistanceMiles: input.maxDistanceMiles,
    },
  };
}

export function matchingPreferencesAreComplete(input: {
  gender_identity?: string | null;
  interested_in?: string[] | null;
  preferred_age_min?: number | null;
  preferred_age_max?: number | null;
  max_distance_miles?: number | null;
} | null | undefined): boolean {
  if (!input) return false;
  return validateMatchingPreferences({
    genderIdentity: input.gender_identity ?? '',
    interestedIn: input.interested_in ?? [],
    preferredAgeMin: input.preferred_age_min ?? 0,
    preferredAgeMax: input.preferred_age_max ?? 0,
    maxDistanceMiles: input.max_distance_miles ?? 0,
  }).ok;
}
