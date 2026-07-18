/**
 * Natural-language public labels for structured profile fields.
 * Prefer-not-to-say and unanswered values are omitted from public presentation.
 */

import { petsTypeDisplayLabel } from './lifestyle-compatibility';
import {
  isPreferNotToSay,
  labelForStructuredValue,
  serviceBackgroundDisplayLabel,
  type StructuredFieldKey,
} from './structured-options';
import { formatPublicLocation } from './location-format';

export type PublicProfileLabelSource = {
  relationship_goal?: string | null;
  faith_identity?: string | null;
  faith_tradition?: string | null;
  faith_other?: string | null;
  faith_importance?: string | null;
  has_children?: string | null;
  children_count?: string | null;
  children?: string | null;
  open_to_partner_with_children?: string | null;
  education?: string | null;
  career?: string | null;
  pets?: string | null;
  pets_types?: string[] | null;
  smoking?: string | null;
  drinking?: string | null;
  relocation?: string | null;
  service_background?: string | null;
  service_backgrounds?: string[] | null;
  location?: string | null;
  location_city?: string | null;
  location_region?: string | null;
};

function visibleStructuredLabel(
  field: StructuredFieldKey,
  value: string | null | undefined
): string | null {
  if (!value || isPreferNotToSay(value)) return null;
  return labelForStructuredValue(field, value);
}

function smokingPublicLabel(value: string | null | undefined): string | null {
  if (!value || isPreferNotToSay(value)) return null;
  switch (value) {
    case 'never':
      return 'Never smokes';
    case 'occasionally':
      return 'Smokes occasionally';
    case 'regularly':
      return 'Smokes regularly';
    case 'trying_to_quit':
      return 'Trying to quit smoking';
    default:
      return labelForStructuredValue('smoking', value);
  }
}

function drinkingPublicLabel(value: string | null | undefined): string | null {
  if (!value || isPreferNotToSay(value)) return null;
  switch (value) {
    case 'never':
      return 'Never drinks';
    case 'rarely':
    case 'occasionally':
      return 'Drinks rarely';
    case 'socially':
      return 'Drinks socially';
    case 'regularly':
      return 'Drinks regularly';
    case 'in_recovery':
      return 'In recovery';
    default:
      return labelForStructuredValue('drinking', value);
  }
}

function petsPublicLabel(
  pets: string | null | undefined,
  petsTypes?: string[] | null
): string | null {
  if (!pets || isPreferNotToSay(pets)) return null;
  if (pets === 'no' || pets === 'no_pets') return 'No pets';
  if (pets === 'yes' || ['dog', 'cat', 'multiple_pets', 'other'].includes(pets)) {
    const types = petsTypeDisplayLabel(petsTypes);
    return types ? `Has pets · ${types}` : 'Has pets';
  }
  return labelForStructuredValue('pets', pets);
}

function wantsChildrenPublicLabel(value: string | null | undefined): string | null {
  if (!value || isPreferNotToSay(value)) return null;
  switch (value) {
    case 'yes':
      return 'Wants children';
    case 'no':
      return 'Does not want children';
    case 'open':
      return 'Open to children';
    case 'unsure':
      return 'Unsure about children';
    default:
      return labelForStructuredValue('children', value);
  }
}

function hasChildrenPublicLabel(
  hasChildren: string | null | undefined,
  count: string | null | undefined
): string | null {
  if (!hasChildren || isPreferNotToSay(hasChildren)) return null;
  if (hasChildren === 'no') return 'Does not have children';
  if (hasChildren === 'yes') {
    if (count && !isPreferNotToSay(count)) {
      const countLabel = labelForStructuredValue('children_count', count);
      if (countLabel) return `Has ${countLabel} ${countLabel === '1' ? 'child' : 'children'}`;
    }
    return 'Has children';
  }
  return null;
}

function openToPartnerChildrenLabel(value: string | null | undefined): string | null {
  if (!value || isPreferNotToSay(value)) return null;
  switch (value) {
    case 'yes':
      return 'Open to a partner who has children';
    case 'no':
      return 'Prefers a partner without children';
    case 'open':
      return 'Open to a partner who has children';
    default:
      return labelForStructuredValue('open_to_partner_with_children', value);
  }
}

function faithPublicLabel(profile: PublicProfileLabelSource): string | null {
  const identity = profile.faith_identity;
  if (!identity || isPreferNotToSay(identity)) {
    // Fall back to importance-only legacy rows only when identity is absent.
    const importance = visibleStructuredLabel('faith_importance', profile.faith_importance);
    return importance ? `Faith: ${importance}` : null;
  }

  if (identity === 'other') {
    const custom = profile.faith_other?.trim();
    return custom || 'Other faith';
  }

  const base = labelForStructuredValue('faith_identity', identity);
  if (!base) return null;
  const tradition = profile.faith_tradition?.trim();
  return tradition ? `${base} (${tradition})` : base;
}

function faithImportancePublicLabel(value: string | null | undefined): string | null {
  const label = visibleStructuredLabel('faith_importance', value);
  return label ? `Faith is ${label.toLowerCase()}` : null;
}

/**
 * Build public detail rows with natural language — never raw enum slugs.
 * Empty / prefer-not-to-say values are omitted.
 */
export function collectStructuredPublicProfileDetails(
  profile: PublicProfileLabelSource
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string | null }> = [
    {
      label: 'Relationship goal',
      value: visibleStructuredLabel('relationship_goal', profile.relationship_goal),
    },
    { label: 'Faith', value: faithPublicLabel(profile) },
    {
      label: 'Faith in daily life',
      value:
        profile.faith_identity && !isPreferNotToSay(profile.faith_identity)
          ? faithImportancePublicLabel(profile.faith_importance)
          : null,
    },
    {
      label: 'Children',
      value: hasChildrenPublicLabel(profile.has_children, profile.children_count),
    },
    {
      label: 'Wants children',
      value: wantsChildrenPublicLabel(profile.children),
    },
    {
      label: 'Partner with children',
      value: openToPartnerChildrenLabel(profile.open_to_partner_with_children),
    },
    {
      label: 'Education',
      value: visibleStructuredLabel('education', profile.education),
    },
    {
      label: 'Career',
      value: profile.career?.trim() || null,
    },
    {
      label: 'Pets',
      value: petsPublicLabel(profile.pets, profile.pets_types),
    },
    { label: 'Smoking', value: smokingPublicLabel(profile.smoking) },
    { label: 'Drinking', value: drinkingPublicLabel(profile.drinking) },
    {
      label: 'Relocation',
      value: visibleStructuredLabel('relocation', profile.relocation),
    },
    {
      label: 'Service',
      value:
        serviceBackgroundDisplayLabel(profile.service_backgrounds) ??
        (profile.service_background && !isPreferNotToSay(profile.service_background)
          ? profile.service_background.trim()
          : null),
    },
  ];

  return rows
    .filter((row): row is { label: string; value: string } => Boolean(row.value?.trim()))
    .map((row) => ({ label: row.label, value: row.value.trim() }));
}

export function publicLocationLabel(profile: PublicProfileLabelSource): string | null {
  return (
    formatPublicLocation({
      city: profile.location_city,
      region: profile.location_region,
      fallback: profile.location,
    }) ?? null
  );
}
