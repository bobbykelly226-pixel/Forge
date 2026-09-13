export const SEX_OPTIONS = [
  { value: 'man', label: 'Male' },
  { value: 'woman', label: 'Female' },
] as const;

export const INTERESTED_IN_OPTIONS = [
  { value: 'man', label: 'Men' },
  { value: 'woman', label: 'Women' },
] as const;

export type InterestedInChoice = (typeof INTERESTED_IN_OPTIONS)[number]['value'];

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

const identityValues = new Set<string>(SEX_OPTIONS.map((option) => option.value));
const interestValues = new Set<string>(INTERESTED_IN_OPTIONS.map((option) => option.value));

/** Expand the existing database representation into the two independent controls. */
export function getInterestedInSelections(
  values: readonly string[] | null | undefined
): InterestedInChoice[] {
  if (!Array.isArray(values) || values.length === 0) return [];
  if (values.length === 1 && values[0] === 'everyone') return ['man', 'woman'];
  // Do not silently discard unsupported values and turn invalid data into a match.
  if (values.some((value) => !interestValues.has(value))) return [];
  return INTERESTED_IN_OPTIONS.filter((option) => values.includes(option.value)).map(
    (option) => option.value
  );
}

export function toggleInterestedInSelection(
  selected: readonly InterestedInChoice[],
  choice: InterestedInChoice
): InterestedInChoice[] {
  return selected.includes(choice)
    ? selected.filter((value) => value !== choice)
    : getInterestedInSelections([...selected, choice]);
}

export function validateMatchingPreferences(
  input: MatchingPreferencesInput
): { ok: true; value: MatchingPreferencesInput } | { ok: false; message: string } {
  if (
    !input ||
    typeof input.genderIdentity !== 'string' ||
    !Array.isArray(input.interestedIn) ||
    input.interestedIn.some((value) => typeof value !== 'string')
  ) {
    return { ok: false, message: 'Choose who you would like to meet.' };
  }
  const genderIdentity = input.genderIdentity.trim();
  const rawInterests = [...new Set(input.interestedIn.map((value) => value.trim()))];
  const selections = getInterestedInSelections(rawInterests);

  if (!identityValues.has(genderIdentity)) {
    return { ok: false, message: 'Choose Male or Female.' };
  }
  if (selections.length === 0) {
    return { ok: false, message: 'Select at least one option: Men or Women.' };
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
      // Keep the existing single-value database contract and reciprocal matching.
      interestedIn: selections.length === 2 ? ['everyone'] : selections,
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
