import {
  derivePetsTypesFromLegacyIdentity,
  normalizePetsIdentity,
} from '@/lib/profile/lifestyle-compatibility';
import type { PublicDiscoveryProfile } from '@/lib/discovery/presentation';
import type { Tables } from '@/lib/supabase/database.types';
import { firstNameFromFullName } from '@/lib/discovery/presentation';

import type { CompatibilityPersonInput } from './types';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function emptyPerson(id: string, displayName: string): CompatibilityPersonInput {
  return {
    id,
    displayName,
    relationshipGoal: null,
    faithIdentity: null,
    faithImportance: null,
    children: null,
    hasChildren: null,
    openToPartnerWithChildren: null,
    pets: null,
    petsTypes: [],
    petsPartnerPreferences: [],
    petsAllergyConstraint: null,
    petsAllergyTypes: [],
    smoking: null,
    smokingProductTypes: [],
    smokingPartnerPreferences: [],
    drinking: null,
    drinkingPartnerPreferences: [],
    coreValues: [],
  };
}

/** Normalize a full owner profiles row (includes private lifestyle prefs). */
export function personFromOwnerProfile(
  profile: Tables<'profiles'>,
  options?: { coreValues?: string[]; displayName?: string }
): CompatibilityPersonInput {
  const petsIdentity = normalizePetsIdentity(profile.pets) || profile.pets;
  return {
    id: profile.id,
    displayName:
      options?.displayName ?? firstNameFromFullName(profile.full_name) ?? 'You',
    relationshipGoal: profile.relationship_goal,
    faithIdentity: profile.faith_identity,
    faithImportance: profile.faith_importance,
    children: profile.children,
    hasChildren: profile.has_children,
    openToPartnerWithChildren: profile.open_to_partner_with_children,
    pets: petsIdentity || null,
    petsTypes: derivePetsTypesFromLegacyIdentity(profile.pets, profile.pets_types ?? []),
    petsPartnerPreferences: asStringArray(profile.pets_partner_preferences),
    petsAllergyConstraint:
      profile.pets_allergy_constraint === null ||
      profile.pets_allergy_constraint === undefined
        ? null
        : Boolean(profile.pets_allergy_constraint),
    petsAllergyTypes: asStringArray(profile.pets_allergy_types),
    smoking: profile.smoking,
    smokingProductTypes: asStringArray(profile.smoking_product_types),
    smokingPartnerPreferences: asStringArray(profile.smoking_partner_preferences),
    drinking: profile.drinking === 'occasionally' ? 'rarely' : profile.drinking,
    drinkingPartnerPreferences: asStringArray(profile.drinking_partner_preferences),
    coreValues: asStringArray(options?.coreValues),
  };
}

/**
 * Normalize a discoverable / public partner profile.
 * Partner openness and allergy fields are unavailable on the public view.
 */
export function personFromPublicDiscoveryProfile(
  profile: PublicDiscoveryProfile & { pets_types?: string[] | null },
  options?: { coreValues?: string[] }
): CompatibilityPersonInput {
  const base = emptyPerson(
    profile.id,
    firstNameFromFullName(profile.full_name)
  );
  const petsIdentity = normalizePetsIdentity(profile.pets) || profile.pets;
  return {
    ...base,
    relationshipGoal: profile.relationship_goal,
    faithIdentity: profile.faith_identity ?? null,
    faithImportance: profile.faith_importance,
    children: profile.children,
    hasChildren: profile.has_children,
    openToPartnerWithChildren: profile.open_to_partner_with_children ?? null,
    pets: petsIdentity || null,
    petsTypes: derivePetsTypesFromLegacyIdentity(
      profile.pets,
      profile.pets_types ?? []
    ),
    smoking: profile.smoking,
    drinking: profile.drinking === 'occasionally' ? 'rarely' : profile.drinking,
    coreValues: asStringArray(options?.coreValues),
  };
}

export type SeedCompatibilityFields = {
  id: string;
  firstName: string;
  relationshipGoal: string | null;
  faithImportance: string | null;
  faithIdentity?: string | null;
  children: string | null;
  hasChildren: string | null;
  openToPartnerWithChildren: string | null;
  pets: string | null;
  petsTypes?: string[];
  petsPartnerPreferences?: string[];
  petsAllergyConstraint?: boolean | null;
  petsAllergyTypes?: string[];
  smoking: string | null;
  smokingPartnerPreferences?: string[];
  drinking: string | null;
  drinkingPartnerPreferences?: string[];
  coreValues?: string[];
};

/** Normalize seed / demo fixtures that may include private lifestyle fields. */
export function personFromSeedCompatibilityFields(
  profile: SeedCompatibilityFields
): CompatibilityPersonInput {
  const petsIdentity = normalizePetsIdentity(profile.pets) || profile.pets;
  return {
    id: profile.id,
    displayName: profile.firstName,
    relationshipGoal: profile.relationshipGoal,
    faithIdentity: profile.faithIdentity ?? null,
    faithImportance: profile.faithImportance,
    children: profile.children,
    hasChildren: profile.hasChildren,
    openToPartnerWithChildren: profile.openToPartnerWithChildren,
    pets: petsIdentity || null,
    petsTypes: derivePetsTypesFromLegacyIdentity(
      profile.pets,
      profile.petsTypes ?? []
    ),
    petsPartnerPreferences: asStringArray(profile.petsPartnerPreferences),
    petsAllergyConstraint:
      profile.petsAllergyConstraint === undefined
        ? null
        : profile.petsAllergyConstraint,
    petsAllergyTypes: asStringArray(profile.petsAllergyTypes),
    smoking: profile.smoking,
    smokingProductTypes: [],
    smokingPartnerPreferences: asStringArray(profile.smokingPartnerPreferences),
    drinking: profile.drinking === 'occasionally' ? 'rarely' : profile.drinking,
    drinkingPartnerPreferences: asStringArray(profile.drinkingPartnerPreferences),
    coreValues: asStringArray(profile.coreValues),
  };
}
