/**
 * Structured profile field catalogs — stable DB values + user-facing labels.
 * Prefer not to say is always valid; unanswered (null/empty) is also valid.
 */

export type StructuredOption<T extends string = string> = {
  value: T;
  label: string;
};

export const PREFER_NOT_TO_SAY = 'prefer_not_to_say' as const;

/** Relationship goals — shared by onboarding intention and Profile Edit. */
export const RELATIONSHIP_GOAL_VALUES = [
  'marriage',
  'serious_relationship',
  'intentional_dating',
  'getting_to_know_someone',
] as const;

export type RelationshipGoalValue = (typeof RELATIONSHIP_GOAL_VALUES)[number];

export const RELATIONSHIP_GOAL_OPTIONS: StructuredOption<RelationshipGoalValue>[] = [
  { value: 'marriage', label: 'Marriage' },
  { value: 'serious_relationship', label: 'Serious relationship' },
  { value: 'intentional_dating', label: 'Intentional dating' },
  { value: 'getting_to_know_someone', label: 'Getting to know someone' },
];

export const HAS_CHILDREN_VALUES = ['no', 'yes', PREFER_NOT_TO_SAY] as const;
export type HasChildrenValue = (typeof HAS_CHILDREN_VALUES)[number];

export const HAS_CHILDREN_OPTIONS: StructuredOption<HasChildrenValue>[] = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const CHILDREN_COUNT_VALUES = [
  '1',
  '2',
  '3',
  '4_plus',
  PREFER_NOT_TO_SAY,
] as const;
export type ChildrenCountValue = (typeof CHILDREN_COUNT_VALUES)[number];

export const CHILDREN_COUNT_OPTIONS: StructuredOption<ChildrenCountValue>[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4_plus', label: '4+' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const WANTS_CHILDREN_VALUES = [
  'yes',
  'no',
  'open',
  'unsure',
  PREFER_NOT_TO_SAY,
] as const;
export type WantsChildrenValue = (typeof WANTS_CHILDREN_VALUES)[number];

export const WANTS_CHILDREN_OPTIONS: StructuredOption<WantsChildrenValue>[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'open', label: 'Open to it' },
  { value: 'unsure', label: 'Unsure' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const OPEN_TO_PARTNER_WITH_CHILDREN_VALUES = [
  'yes',
  'no',
  'open',
  PREFER_NOT_TO_SAY,
] as const;
export type OpenToPartnerWithChildrenValue =
  (typeof OPEN_TO_PARTNER_WITH_CHILDREN_VALUES)[number];

export const OPEN_TO_PARTNER_WITH_CHILDREN_OPTIONS: StructuredOption<OpenToPartnerWithChildrenValue>[] =
  [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'open', label: 'Open to it' },
    { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
  ];

export const FAITH_IDENTITY_VALUES = [
  'christian',
  'catholic',
  'protestant',
  'jewish',
  'muslim',
  'hindu',
  'buddhist',
  'spiritual',
  'agnostic',
  'atheist',
  'other',
  PREFER_NOT_TO_SAY,
] as const;
export type FaithIdentityValue = (typeof FAITH_IDENTITY_VALUES)[number];

export const FAITH_IDENTITY_OPTIONS: StructuredOption<FaithIdentityValue>[] = [
  { value: 'christian', label: 'Christian' },
  { value: 'catholic', label: 'Catholic' },
  { value: 'protestant', label: 'Protestant' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'agnostic', label: 'Agnostic' },
  { value: 'atheist', label: 'Atheist' },
  { value: 'other', label: 'Other' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const FAITH_IMPORTANCE_VALUES = [
  'very_important',
  'important',
  'somewhat_important',
  'not_important',
  PREFER_NOT_TO_SAY,
] as const;
export type FaithImportanceValue = (typeof FAITH_IMPORTANCE_VALUES)[number];

export const FAITH_IMPORTANCE_OPTIONS: StructuredOption<FaithImportanceValue>[] = [
  { value: 'very_important', label: 'Very important' },
  { value: 'important', label: 'Important' },
  { value: 'somewhat_important', label: 'Somewhat important' },
  { value: 'not_important', label: 'Not important' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const SMOKING_VALUES = [
  'never',
  'occasionally',
  'regularly',
  'trying_to_quit',
  PREFER_NOT_TO_SAY,
] as const;
export type SmokingValue = (typeof SMOKING_VALUES)[number];

export const SMOKING_OPTIONS: StructuredOption<SmokingValue>[] = [
  { value: 'never', label: 'Never' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'regularly', label: 'Regularly' },
  { value: 'trying_to_quit', label: 'Trying to quit' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const DRINKING_VALUES = [
  'never',
  'occasionally',
  'socially',
  'regularly',
  'in_recovery',
  PREFER_NOT_TO_SAY,
] as const;
export type DrinkingValue = (typeof DRINKING_VALUES)[number];

export const DRINKING_OPTIONS: StructuredOption<DrinkingValue>[] = [
  { value: 'never', label: 'Never' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'socially', label: 'Socially' },
  { value: 'regularly', label: 'Regularly' },
  { value: 'in_recovery', label: 'In recovery' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const EDUCATION_VALUES = [
  'high_school',
  'trade_vocational',
  'some_college',
  'associate',
  'bachelors',
  'graduate_professional',
  'other',
  PREFER_NOT_TO_SAY,
] as const;
export type EducationValue = (typeof EDUCATION_VALUES)[number];

export const EDUCATION_OPTIONS: StructuredOption<EducationValue>[] = [
  { value: 'high_school', label: 'High school' },
  { value: 'trade_vocational', label: 'Trade or vocational training' },
  { value: 'some_college', label: 'Some college' },
  { value: 'associate', label: 'Associate degree' },
  { value: 'bachelors', label: "Bachelor's degree" },
  { value: 'graduate_professional', label: 'Graduate or professional degree' },
  { value: 'other', label: 'Other' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const PETS_VALUES = [
  'no_pets',
  'dog',
  'cat',
  'multiple_pets',
  'other',
  PREFER_NOT_TO_SAY,
] as const;
export type PetsValue = (typeof PETS_VALUES)[number];

export const PETS_OPTIONS: StructuredOption<PetsValue>[] = [
  { value: 'no_pets', label: 'No pets' },
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'multiple_pets', label: 'Multiple pets' },
  { value: 'other', label: 'Other' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const RELOCATION_VALUES = [
  'not_open',
  'possibly',
  'open',
  PREFER_NOT_TO_SAY,
] as const;
export type RelocationValue = (typeof RELOCATION_VALUES)[number];

export const RELOCATION_OPTIONS: StructuredOption<RelocationValue>[] = [
  { value: 'not_open', label: 'Not open to relocating' },
  { value: 'possibly', label: 'Possibly' },
  { value: 'open', label: 'Open to relocating' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export const SERVICE_BACKGROUND_VALUES = [
  'military',
  'law_enforcement',
  'fire_ems',
  'healthcare',
  'education',
  'community_service',
  'other',
  'none',
  PREFER_NOT_TO_SAY,
] as const;
export type ServiceBackgroundValue = (typeof SERVICE_BACKGROUND_VALUES)[number];

export const SERVICE_BACKGROUND_OPTIONS: StructuredOption<ServiceBackgroundValue>[] = [
  { value: 'military', label: 'Military' },
  { value: 'law_enforcement', label: 'Law enforcement' },
  { value: 'fire_ems', label: 'Fire or EMS' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'community_service', label: 'Community service' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None' },
  { value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

const OPTION_SETS = {
  relationship_goal: RELATIONSHIP_GOAL_OPTIONS,
  has_children: HAS_CHILDREN_OPTIONS,
  children_count: CHILDREN_COUNT_OPTIONS,
  children: WANTS_CHILDREN_OPTIONS,
  open_to_partner_with_children: OPEN_TO_PARTNER_WITH_CHILDREN_OPTIONS,
  faith_identity: FAITH_IDENTITY_OPTIONS,
  faith_importance: FAITH_IMPORTANCE_OPTIONS,
  smoking: SMOKING_OPTIONS,
  drinking: DRINKING_OPTIONS,
  education: EDUCATION_OPTIONS,
  pets: PETS_OPTIONS,
  relocation: RELOCATION_OPTIONS,
  service_background: SERVICE_BACKGROUND_OPTIONS,
} as const;

export type StructuredFieldKey = keyof typeof OPTION_SETS;

export function labelForStructuredValue(
  field: StructuredFieldKey,
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const match = OPTION_SETS[field].find((option) => option.value === value);
  return match?.label ?? null;
}

export function isValidStructuredValue(
  field: StructuredFieldKey,
  value: string | null | undefined
): boolean {
  if (!value) return false;
  return OPTION_SETS[field].some((option) => option.value === value);
}

export function isPreferNotToSay(value: string | null | undefined): boolean {
  return value === PREFER_NOT_TO_SAY;
}

export function normalizeServiceBackgroundSelection(
  values: string[]
): ServiceBackgroundValue[] {
  const allowed = new Set<string>(SERVICE_BACKGROUND_VALUES);
  const unique = [...new Set(values.filter((value) => allowed.has(value)))] as ServiceBackgroundValue[];

  if (unique.includes(PREFER_NOT_TO_SAY)) {
    return [PREFER_NOT_TO_SAY];
  }
  if (unique.includes('none')) {
    return ['none'];
  }
  return unique.filter((value) => value !== 'none' && value !== PREFER_NOT_TO_SAY);
}

export function serviceBackgroundDisplayLabel(
  values: string[] | null | undefined
): string | null {
  if (!values || values.length === 0) return null;
  const normalized = normalizeServiceBackgroundSelection(values);
  if (normalized.length === 0) return null;
  if (normalized.includes(PREFER_NOT_TO_SAY) || normalized.includes('none')) {
    return null;
  }
  const labels = normalized
    .map((value) => labelForStructuredValue('service_background', value))
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) return null;
  if (labels.length === 1) return `${labels[0]} background`;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]} background`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]} background`;
}
