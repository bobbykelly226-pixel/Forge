/**
 * Owner profile workspace sections — one catalog for hub summaries,
 * checklist routing, and section saves.
 */

import type { Profile } from '@/lib/types/profile';
import {
  normalizePetsIdentity,
  petsTypeDisplayLabel,
} from '@/lib/profile/lifestyle-compatibility';
import {
  labelForStructuredValue,
  serviceBackgroundDisplayLabel,
  isPreferNotToSay,
} from '@/lib/profile/structured-options';
import { formatPublicLocation } from '@/lib/profile/location-format';
import { resolveUnifiedAbout } from '@/lib/profile/unified-about';
import type { ProfileCompletionSectionId } from '@/lib/profile-completion';

export const PROFILE_SECTION_IDS = [
  'photo',
  'basics',
  'location',
  'about',
  'relationship',
  'children',
  'faith',
  'smoking',
  'drinking',
  'education',
  'pets',
  'relocation',
  'career',
  'service',
  'enjoy',
  'music',
  'factors',
  'voice',
  'video',
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

export type ProfileSectionDefinition = {
  id: ProfileSectionId;
  title: string;
  description: string;
  comingSoon?: boolean;
  editable: boolean;
};

export const PROFILE_SECTIONS: ProfileSectionDefinition[] = [
  {
    id: 'photo',
    title: 'Profile photos',
    description: 'Add up to 6 photos. Your primary photo appears first.',
    editable: true,
  },
  {
    id: 'basics',
    title: 'Basic information',
    description: 'Your name and age.',
    editable: true,
  },
  {
    id: 'location',
    title: 'Location',
    description: 'City and state shown publicly. Precise details stay private.',
    editable: true,
  },
  {
    id: 'about',
    title: 'About',
    description: 'Your public biography in your own words.',
    editable: true,
  },
  {
    id: 'relationship',
    title: 'Relationship goal',
    description: 'What you are looking for in Forge.',
    editable: true,
  },
  {
    id: 'children',
    title: 'Children',
    description: 'Has children, wants children, and openness to a partner with children.',
    editable: true,
  },
  {
    id: 'faith',
    title: 'Faith and religion',
    description: 'Identity and importance remain separate.',
    editable: true,
  },
  {
    id: 'smoking',
    title: 'Smoking',
    description: 'Your habits, what you use, and partner comfort — kept separate.',
    editable: true,
  },
  {
    id: 'drinking',
    title: 'Drinking',
    description: 'Your relationship with alcohol and partner comfort — kept separate.',
    editable: true,
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Optional structured choice.',
    editable: true,
  },
  {
    id: 'pets',
    title: 'Pets',
    description: 'Your pets, partner comfort, and allergy constraints — kept separate.',
    editable: true,
  },
  {
    id: 'relocation',
    title: 'Relocation',
    description: 'How open you are to relocating.',
    editable: true,
  },
  {
    id: 'career',
    title: 'Career',
    description: 'What kind of work you do.',
    editable: true,
  },
  {
    id: 'service',
    title: 'Service background',
    description: 'Military, first response, healthcare, and related service.',
    editable: true,
  },
  {
    id: 'enjoy',
    title: 'Things I Enjoy',
    description: 'Activities and interests that energize you.',
    editable: true,
  },
  {
    id: 'music',
    title: 'Favorite Music',
    description: 'Artists and songs you love.',
    editable: true,
  },
  {
    id: 'factors',
    title: 'Important Alignment Factors',
    description: 'Values that matter most in a relationship.',
    editable: true,
  },
  {
    id: 'voice',
    title: 'Voice Introduction',
    description: 'Coming soon.',
    comingSoon: true,
    editable: false,
  },
  {
    id: 'video',
    title: 'Video Introduction',
    description: 'Coming soon.',
    comingSoon: true,
    editable: false,
  },
];

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function line(value: string | null | undefined): string | null {
  return hasText(value) ? value!.trim() : null;
}

function structuredLabel(
  field:
    | 'relationship_goal'
    | 'has_children'
    | 'children_count'
    | 'children'
    | 'open_to_partner_with_children'
    | 'faith_identity'
    | 'faith_importance'
    | 'smoking'
    | 'drinking'
    | 'education'
    | 'pets'
    | 'relocation'
    | 'service_background',
  value: string | null | undefined
): string | null {
  if (!hasText(value)) return null;
  if (isPreferNotToSay(value)) return 'Prefer not to say';
  return labelForStructuredValue(field, value) ?? value!.trim();
}

export function summarizeProfileSection(
  sectionId: ProfileSectionId,
  profile: Profile | null,
  extras?: { coreValues?: string[]; photoCount?: number }
): string {
  if (!profile) return 'Not added yet';

  switch (sectionId) {
    case 'photo': {
      const count = extras?.photoCount;
      if (typeof count === 'number' && count > 0) {
        return count === 1 ? '1 photo added' : `${count} photos added`;
      }
      return hasText(profile.profile_photo_url) ? 'Photo added' : 'Not added yet';
    }
    case 'basics': {
      const parts = [line(profile.full_name), profile.age != null ? `Age ${profile.age}` : null].filter(
        Boolean
      );
      return parts.length ? parts.join(' · ') : 'Not added yet';
    }
    case 'location':
      return (
        formatPublicLocation({
          city: profile.location_city,
          region: profile.location_region,
          fallback: profile.location,
        }) ?? 'Not added yet'
      );
    case 'about':
      return resolveUnifiedAbout(profile.short_bio, profile.more_about) ?? 'Not added yet';
    case 'relationship':
      return structuredLabel('relationship_goal', profile.relationship_goal) ?? 'Not added yet';
    case 'children': {
      const parts = [
        structuredLabel('has_children', profile.has_children),
        profile.has_children === 'yes'
          ? structuredLabel('children_count', profile.children_count)
          : null,
        structuredLabel('children', profile.children),
        structuredLabel(
          'open_to_partner_with_children',
          profile.open_to_partner_with_children
        ),
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Not added yet';
    }
    case 'faith': {
      const parts = [
        structuredLabel('faith_identity', profile.faith_identity),
        line(profile.faith_tradition),
        line(profile.faith_other),
        structuredLabel('faith_importance', profile.faith_importance),
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Not added yet';
    }
    case 'smoking': {
      const parts = [
        structuredLabel('smoking', profile.smoking),
        (profile.smoking_partner_preferences?.length ?? 0) > 0
          ? 'Partner comfort added'
          : null,
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Not added yet';
    }
    case 'drinking': {
      const drinkingLabel =
        profile.drinking === 'occasionally'
          ? 'Rarely'
          : structuredLabel('drinking', profile.drinking);
      const parts = [
        drinkingLabel,
        (profile.drinking_partner_preferences?.length ?? 0) > 0
          ? 'Partner comfort added'
          : null,
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Not added yet';
    }
    case 'education':
      return structuredLabel('education', profile.education) ?? 'Not added yet';
    case 'pets': {
      const identity = normalizePetsIdentity(profile.pets);
      const identityLabel =
        identity === 'yes'
          ? petsTypeDisplayLabel(profile.pets_types) ?? 'Has pets'
          : identity === 'no'
            ? 'No pets'
            : structuredLabel('pets', identity || profile.pets);
      const parts = [
        identityLabel,
        (profile.pets_partner_preferences?.length ?? 0) > 0
          ? 'Partner comfort added'
          : null,
        profile.pets_allergy_constraint === true ? 'Allergy constraint noted' : null,
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Not added yet';
    }
    case 'relocation':
      return structuredLabel('relocation', profile.relocation) ?? 'Not added yet';
    case 'career':
      return line(profile.career) ?? 'Not added yet';
    case 'service':
      return (
        serviceBackgroundDisplayLabel(profile.service_backgrounds) ??
        line(profile.service_background) ??
        'Not added yet'
      );
    case 'enjoy': {
      const items = (profile.things_i_enjoy ?? []).filter((item) => hasText(item));
      return items.length ? items.join(', ') : 'Not added yet';
    }
    case 'music': {
      const artists = (profile.favorite_music_artists ?? []).filter((item) => hasText(item));
      const songs = (profile.favorite_music_songs ?? []).filter((item) => hasText(item));
      const parts = [
        artists.length ? `Artists: ${artists.join(', ')}` : null,
        songs.length ? `Songs: ${songs.join(', ')}` : null,
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Not added yet';
    }
    case 'factors': {
      const values = (extras?.coreValues ?? []).filter((item) => hasText(item));
      return values.length ? values.join(', ') : 'Not added yet';
    }
    case 'voice':
    case 'video':
      return 'Coming soon';
    default:
      return 'Not added yet';
  }
}

const DETAILS_SECTION_ORDER: ProfileSectionId[] = [
  'basics',
  'location',
  'children',
  'faith',
  'smoking',
  'drinking',
  'education',
  'pets',
  'relocation',
  'career',
  'service',
];

function sectionHasContent(
  sectionId: ProfileSectionId,
  profile: Profile | null,
  extras?: { coreValues?: string[] }
): boolean {
  const summary = summarizeProfileSection(sectionId, profile, extras);
  return summary !== 'Not added yet' && summary !== 'Coming soon';
}

/**
 * Map a completion checklist item to the workspace section it should open.
 */
export function checklistItemToSectionId(
  checklistId: ProfileCompletionSectionId,
  profile: Profile | null,
  extras?: { coreValues?: string[] }
): ProfileSectionId {
  switch (checklistId) {
    case 'photos':
      return 'photo';
    case 'about':
      return 'about';
    case 'alignment':
      return 'relationship';
    case 'factors':
      return 'factors';
    case 'enjoy':
      return 'enjoy';
    case 'music':
      return 'music';
    case 'details': {
      for (const id of DETAILS_SECTION_ORDER) {
        if (!sectionHasContent(id, profile, extras)) return id;
      }
      return 'basics';
    }
    default:
      return 'basics';
  }
}

export function isProfileSectionId(value: string | null | undefined): value is ProfileSectionId {
  return Boolean(value && (PROFILE_SECTION_IDS as readonly string[]).includes(value));
}
