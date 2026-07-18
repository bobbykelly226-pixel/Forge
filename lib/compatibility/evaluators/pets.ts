import {
  normalizePetsIdentity,
  type PetTypeValue,
} from '@/lib/profile/lifestyle-compatibility';

import type { CompatibilityEvaluator, CompatibilityPersonInput } from '../types';
import {
  evaluation,
  hasOpenness,
  insufficient,
  opennessIncludesAny,
  opennessIsUnknown,
} from '../helpers';

const TYPE_TO_PREF: Record<string, string> = {
  dogs: 'has_dogs',
  cats: 'has_cats',
  birds: 'has_birds',
  fish: 'has_fish',
  reptiles: 'has_reptiles',
  small_animals: 'has_small_animals',
  horses: 'has_horses',
  farm_animals: 'has_farm_animals',
  other: 'open_to_any',
};

function petTypesFor(person: CompatibilityPersonInput): PetTypeValue[] {
  return person.petsTypes as PetTypeValue[];
}

function identity(person: CompatibilityPersonInput): '' | 'yes' | 'no' | 'prefer_not_to_say' {
  return normalizePetsIdentity(person.pets);
}

function acceptsPets(
  preferences: string[],
  other: CompatibilityPersonInput
): 'accept' | 'reject' | 'unknown' {
  if (opennessIsUnknown(preferences)) return 'unknown';
  if (preferences.includes('open_to_any')) return 'accept';

  const otherIdentity = identity(other);
  if (otherIdentity === 'no') {
    return opennessIncludesAny(preferences, ['has_no_pets', 'open_to_any'])
      ? 'accept'
      : preferences.includes('has_no_pets') || preferences.length > 0
        ? 'accept'
        : 'unknown';
  }

  if (otherIdentity !== 'yes') return 'unknown';

  const types = petTypesFor(other);
  if (types.length === 0) {
    // Has pets but types unknown — only reject if exclusively "has_no_pets".
    if (preferences.length === 1 && preferences[0] === 'has_no_pets') return 'reject';
    return 'unknown';
  }

  const needed = types.map((type) => TYPE_TO_PREF[type]).filter(Boolean);
  if (preferences.length === 1 && preferences[0] === 'has_no_pets') return 'reject';
  if (needed.every((pref) => preferences.includes(pref) || preferences.includes('open_to_any'))) {
    return 'accept';
  }
  if (needed.some((pref) => preferences.includes(pref))) return 'accept';
  return 'reject';
}

function allergyBlocks(
  allergicPerson: CompatibilityPersonInput,
  petOwner: CompatibilityPersonInput
): boolean {
  // Explicit false means no allergy constraint; null means unanswered.
  if (allergicPerson.petsAllergyConstraint !== true) return false;
  if (identity(petOwner) !== 'yes') return false;

  const allergyTypes = allergicPerson.petsAllergyTypes;
  const ownerTypes = petTypesFor(petOwner);
  if (allergyTypes.length === 0) {
    // Allergy flagged without types — treat pet ownership as a practical concern.
    return true;
  }
  if (ownerTypes.length === 0) return true;
  return ownerTypes.some((type) => allergyTypes.includes(type));
}

export const petsEvaluator: CompatibilityEvaluator = {
  key: 'pets',
  label: 'Pets',
  evaluate(viewer, partner) {
    const viewerPets = identity(viewer);
    const partnerPets = identity(partner);

    if (!viewerPets || !partnerPets) {
      return insufficient(
        'pets',
        this.label,
        'Pet answers need to be completed by both people before Forge can assess this lifestyle area.'
      );
    }

    if (allergyBlocks(viewer, partner) || allergyBlocks(partner, viewer)) {
      return evaluation({
        categoryKey: 'pets',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'A pet allergy is a practical living constraint here. Forge surfaces it as an important difference — not a judgment about either person.',
        viewerSummary: viewerPets,
        partnerSummary: partnerPets,
      });
    }

    const viewerAcceptsPartner = hasOpenness(viewer.petsPartnerPreferences)
      ? acceptsPets(viewer.petsPartnerPreferences, partner)
      : ('unknown' as const);
    const partnerAcceptsViewer = hasOpenness(partner.petsPartnerPreferences)
      ? acceptsPets(partner.petsPartnerPreferences, viewer)
      : ('unknown' as const);

    if (viewerAcceptsPartner === 'reject' || partnerAcceptsViewer === 'reject') {
      return evaluation({
        categoryKey: 'pets',
        categoryLabel: this.label,
        status: 'important_difference',
        explanation:
          'One person’s pets sit outside the other’s stated partner comfort. Different pets are not automatically a mismatch — but this specific combination looks like a boundary.',
        viewerSummary: viewerPets,
        partnerSummary: partnerPets,
      });
    }

    if (viewerPets === partnerPets && viewerPets !== 'prefer_not_to_say') {
      if (viewerPets === 'yes') {
        const viewerTypes = petTypesFor(viewer);
        const partnerTypes = petTypesFor(partner);
        const shared = viewerTypes.filter((type) => partnerTypes.includes(type));
        if (shared.length > 0 || viewerTypes.length === 0 || partnerTypes.length === 0) {
          return evaluation({
            categoryKey: 'pets',
            categoryLabel: this.label,
            status: 'strong_alignment',
            explanation: 'You both have pets, and nothing in your answers suggests a living conflict.',
            viewerSummary: 'Has pets',
            partnerSummary: 'Has pets',
          });
        }
        if (
          viewerAcceptsPartner === 'accept' ||
          partnerAcceptsViewer === 'accept'
        ) {
          return evaluation({
            categoryKey: 'pets',
            categoryLabel: this.label,
            status: 'compatible_difference',
            explanation:
              'You both have pets, even if the types differ. Available partner comfort answers suggest this can work.',
            viewerSummary: 'Has pets',
            partnerSummary: 'Has pets',
          });
        }
      }

      return evaluation({
        categoryKey: 'pets',
        categoryLabel: this.label,
        status: 'strong_alignment',
        explanation:
          viewerPets === 'no'
            ? 'Neither of you currently has pets.'
            : 'Your pet answers match.',
        viewerSummary: viewerPets,
        partnerSummary: partnerPets,
      });
    }

    if (viewerAcceptsPartner === 'accept' || partnerAcceptsViewer === 'accept') {
      return evaluation({
        categoryKey: 'pets',
        categoryLabel: this.label,
        status: 'compatible_difference',
        explanation:
          'You do not have the same pet situation, but available partner comfort answers suggest the difference can work.',
        viewerSummary: viewerPets,
        partnerSummary: partnerPets,
      });
    }

    if (viewerPets === 'yes' && partnerPets === 'no') {
      return evaluation({
        categoryKey: 'pets',
        categoryLabel: this.label,
        status: 'worth_discussing',
        explanation:
          'One of you has pets and the other does not. Comfort with animals at home is worth confirming.',
        viewerSummary: viewerPets,
        partnerSummary: partnerPets,
      });
    }

    if (viewerPets === 'no' && partnerPets === 'yes') {
      return evaluation({
        categoryKey: 'pets',
        categoryLabel: this.label,
        status: 'worth_discussing',
        explanation:
          'One of you has pets and the other does not. Comfort with animals at home is worth confirming.',
        viewerSummary: viewerPets,
        partnerSummary: partnerPets,
      });
    }

    return evaluation({
      categoryKey: 'pets',
      categoryLabel: this.label,
      status: 'worth_discussing',
      explanation:
        'Your pet answers differ. Sharing what you are comfortable living with would make this clearer.',
      viewerSummary: viewerPets,
      partnerSummary: partnerPets,
    });
  },
};
