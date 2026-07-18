/**
 * Lifestyle compatibility catalogs for pets, smoking, and drinking.
 * Separates personal identity/behavior from partner openness and constraints.
 */

import {
  PREFER_NOT_TO_SAY,
  type StructuredOption,
} from '@/lib/profile/structured-options';

export const PET_TYPE_VALUES = [
  'dogs',
  'cats',
  'birds',
  'fish',
  'reptiles',
  'small_animals',
  'horses',
  'farm_animals',
  'other',
] as const;
export type PetTypeValue = (typeof PET_TYPE_VALUES)[number];

export const PET_TYPE_OPTIONS: StructuredOption<PetTypeValue>[] = [
  { value: 'dogs', label: 'Dogs' },
  { value: 'cats', label: 'Cats' },
  { value: 'birds', label: 'Birds' },
  { value: 'fish', label: 'Fish' },
  { value: 'reptiles', label: 'Reptiles' },
  { value: 'small_animals', label: 'Small animals' },
  { value: 'horses', label: 'Horses' },
  { value: 'farm_animals', label: 'Farm animals' },
  { value: 'other', label: 'Other' },
];

export const PETS_PARTNER_PREFERENCE_VALUES = [
  'has_dogs',
  'has_cats',
  'has_birds',
  'has_fish',
  'has_reptiles',
  'has_small_animals',
  'has_horses',
  'has_farm_animals',
  'has_no_pets',
  'open_to_any',
  'not_sure',
] as const;
export type PetsPartnerPreferenceValue = (typeof PETS_PARTNER_PREFERENCE_VALUES)[number];

export const PETS_PARTNER_PREFERENCE_OPTIONS: StructuredOption<PetsPartnerPreferenceValue>[] = [
  { value: 'has_dogs', label: 'Has dogs' },
  { value: 'has_cats', label: 'Has cats' },
  { value: 'has_birds', label: 'Has birds' },
  { value: 'has_fish', label: 'Has fish' },
  { value: 'has_reptiles', label: 'Has reptiles' },
  { value: 'has_small_animals', label: 'Has small animals' },
  { value: 'has_horses', label: 'Has horses' },
  { value: 'has_farm_animals', label: 'Has farm animals' },
  { value: 'has_no_pets', label: 'Has no pets' },
  { value: 'open_to_any', label: 'I’m open to any of these' },
  { value: 'not_sure', label: 'I’m not sure yet' },
];

export const SMOKING_PRODUCT_VALUES = [
  'cigarettes',
  'cigars',
  'vape',
  'cannabis',
  'hookah',
  'other',
] as const;
export type SmokingProductValue = (typeof SMOKING_PRODUCT_VALUES)[number];

export const SMOKING_PRODUCT_OPTIONS: StructuredOption<SmokingProductValue>[] = [
  { value: 'cigarettes', label: 'Cigarettes' },
  { value: 'cigars', label: 'Cigars' },
  { value: 'vape', label: 'Vape or e-cigarettes' },
  { value: 'cannabis', label: 'Cannabis' },
  { value: 'hookah', label: 'Hookah' },
  { value: 'other', label: 'Other' },
];

export const SMOKING_PARTNER_PREFERENCE_VALUES = [
  'does_not_use',
  'cigarettes_occasionally',
  'cigarettes_regularly',
  'cigars_occasionally',
  'cigars_regularly',
  'vapes_occasionally',
  'vapes_regularly',
  'cannabis_occasionally',
  'cannabis_regularly',
  'hookah_occasionally',
  'hookah_regularly',
  'trying_to_quit',
  'open_to_any',
  'not_sure',
] as const;
export type SmokingPartnerPreferenceValue =
  (typeof SMOKING_PARTNER_PREFERENCE_VALUES)[number];

export const SMOKING_PARTNER_PREFERENCE_OPTIONS: StructuredOption<SmokingPartnerPreferenceValue>[] =
  [
    { value: 'does_not_use', label: 'Does not smoke or use these products' },
    { value: 'cigarettes_occasionally', label: 'Uses cigarettes occasionally' },
    { value: 'cigarettes_regularly', label: 'Uses cigarettes regularly' },
    { value: 'cigars_occasionally', label: 'Uses cigars occasionally' },
    { value: 'cigars_regularly', label: 'Uses cigars regularly' },
    { value: 'vapes_occasionally', label: 'Vapes occasionally' },
    { value: 'vapes_regularly', label: 'Vapes regularly' },
    { value: 'cannabis_occasionally', label: 'Uses cannabis occasionally' },
    { value: 'cannabis_regularly', label: 'Uses cannabis regularly' },
    { value: 'hookah_occasionally', label: 'Uses hookah occasionally' },
    { value: 'hookah_regularly', label: 'Uses hookah regularly' },
    { value: 'trying_to_quit', label: 'Is actively trying to quit' },
    { value: 'open_to_any', label: 'I’m open to any of these' },
    { value: 'not_sure', label: 'I’m not sure yet' },
  ];

export const DRINKING_PARTNER_PREFERENCE_VALUES = [
  'does_not_drink',
  'drinks_rarely',
  'drinks_socially',
  'drinks_regularly',
  'in_recovery',
  'open_to_any',
  'not_sure',
] as const;
export type DrinkingPartnerPreferenceValue =
  (typeof DRINKING_PARTNER_PREFERENCE_VALUES)[number];

export const DRINKING_PARTNER_PREFERENCE_OPTIONS: StructuredOption<DrinkingPartnerPreferenceValue>[] =
  [
    { value: 'does_not_drink', label: 'Does not drink' },
    { value: 'drinks_rarely', label: 'Drinks rarely' },
    { value: 'drinks_socially', label: 'Drinks socially' },
    { value: 'drinks_regularly', label: 'Drinks regularly' },
    { value: 'in_recovery', label: 'Is in recovery' },
    { value: 'open_to_any', label: 'I’m open to any of these' },
    { value: 'not_sure', label: 'I’m not sure yet' },
  ];

const OPENNESS_EXCLUSIVE = ['open_to_any', 'not_sure'] as const;

function normalizeCatalogSelection<T extends string>(
  values: string[],
  allowed: readonly T[],
  exclusiveValues: readonly string[] = OPENNESS_EXCLUSIVE
): T[] {
  const allowedSet = new Set<string>(allowed);
  const unique = [...new Set(values.filter((value) => allowedSet.has(value)))] as T[];

  for (const exclusive of exclusiveValues) {
    if (unique.includes(exclusive as T)) {
      return [exclusive as T];
    }
  }
  return unique;
}

export function normalizePetTypeSelection(values: string[]): PetTypeValue[] {
  return normalizeCatalogSelection(values, PET_TYPE_VALUES, []);
}

export function normalizePetsPartnerPreferences(
  values: string[]
): PetsPartnerPreferenceValue[] {
  return normalizeCatalogSelection(values, PETS_PARTNER_PREFERENCE_VALUES);
}

export function normalizeSmokingProductSelection(
  values: string[]
): SmokingProductValue[] {
  return normalizeCatalogSelection(values, SMOKING_PRODUCT_VALUES, []);
}

export function normalizeSmokingPartnerPreferences(
  values: string[]
): SmokingPartnerPreferenceValue[] {
  return normalizeCatalogSelection(values, SMOKING_PARTNER_PREFERENCE_VALUES);
}

export function normalizeDrinkingPartnerPreferences(
  values: string[]
): DrinkingPartnerPreferenceValue[] {
  return normalizeCatalogSelection(values, DRINKING_PARTNER_PREFERENCE_VALUES);
}

export function normalizePetsAllergyTypes(values: string[]): PetTypeValue[] {
  return normalizeCatalogSelection(values, PET_TYPE_VALUES, []);
}

/** Map stored pets identity (including legacy slugs) to the current identity UI. */
export function normalizePetsIdentity(
  value: string | null | undefined
): '' | 'yes' | 'no' | typeof PREFER_NOT_TO_SAY {
  if (!value) return '';
  if (value === 'yes' || value === 'no' || value === PREFER_NOT_TO_SAY) return value;
  if (value === 'no_pets') return 'no';
  if (['dog', 'cat', 'multiple_pets', 'other'].includes(value)) return 'yes';
  return '';
}

/** Derive pets_types from legacy single-select pets when types were never saved. */
export function derivePetsTypesFromLegacyIdentity(
  pets: string | null | undefined,
  savedTypes: string[] | null | undefined
): PetTypeValue[] {
  const normalizedSaved = normalizePetTypeSelection(savedTypes ?? []);
  if (normalizedSaved.length > 0) return normalizedSaved;
  if (pets === 'dog') return ['dogs'];
  if (pets === 'cat') return ['cats'];
  if (pets === 'other') return ['other'];
  return [];
}

export function smokingUsesProducts(frequency: string | null | undefined): boolean {
  return frequency === 'occasionally' || frequency === 'regularly' || frequency === 'trying_to_quit';
}

export function petsTypeDisplayLabel(values: string[] | null | undefined): string | null {
  const normalized = normalizePetTypeSelection(values ?? []);
  if (normalized.length === 0) return null;
  const labels = normalized
    .map((value) => PET_TYPE_OPTIONS.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
  if (labels.length === 0) return null;
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}
