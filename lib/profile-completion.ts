/**
 * Profile completion rules — single source of truth for My Profile Hub.
 *
 * Voice and Video Introduction are Coming Soon and intentionally excluded
 * so they do not count against completion.
 */

import type { Tables } from '@/lib/supabase/database.types';

export type ProfileCompletionSectionId =
  | 'photos'
  | 'about'
  | 'details'
  | 'alignment'
  | 'factors'
  | 'enjoy'
  | 'music';

export type ProfileCompletionSection = {
  id: ProfileCompletionSectionId;
  label: string;
  complete: boolean;
};

export type ProfileCompletionInput = {
  profile: Pick<
    Tables<'profiles'>,
    | 'full_name'
    | 'short_bio'
    | 'more_about'
    | 'relationship_goal'
    | 'children'
    | 'has_children'
    | 'faith_importance'
    | 'education'
    | 'pets'
    | 'smoking'
    | 'drinking'
    | 'career'
    | 'relocation'
    | 'service_background'
    | 'things_i_enjoy'
    | 'favorite_music_artists'
    | 'favorite_music_songs'
    | 'profile_photo_url'
  > | null;
  photoCount: number;
  /** True when Relationship Alignment answers exist (e.g. relationship_intention). */
  hasRelationshipAlignment: boolean;
  /** True when Important Alignment Factors answers exist. */
  hasImportantAlignmentFactors: boolean;
};

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNonEmptyArray(value: string[] | null | undefined): boolean {
  return Array.isArray(value) && value.some((item) => hasText(item));
}

function hasCoreDetails(
  profile: NonNullable<ProfileCompletionInput['profile']>
): boolean {
  const fields = [
    profile.relationship_goal,
    profile.children,
    profile.has_children,
    profile.faith_importance,
    profile.education,
    profile.pets,
    profile.smoking,
    profile.drinking,
    profile.career,
    profile.relocation,
    profile.service_background,
  ];
  // Require a meaningful subset so partial drafts still progress
  const filled = fields.filter((field) => hasText(field)).length;
  return filled >= 5;
}

/**
 * Returns ordered completion sections for the current Profile V2 hub.
 * Does not persist a percentage — callers compute percent from this list.
 */
export function getProfileCompletionSections(
  input: ProfileCompletionInput
): ProfileCompletionSection[] {
  const profile = input.profile;
  const hasLegacyPhoto = hasText(profile?.profile_photo_url);
  const hasPhotos = input.photoCount > 0 || hasLegacyPhoto;
  const hasAbout =
    hasText(profile?.short_bio) ||
    hasText(profile?.more_about) ||
    hasText(profile?.full_name);

  return [
    {
      id: 'photos',
      label: 'Add photos',
      complete: hasPhotos,
    },
    {
      id: 'about',
      label: 'Write About Me',
      complete: Boolean(profile && hasText(profile.short_bio)),
    },
    {
      id: 'details',
      label: 'Complete profile details',
      complete: Boolean(profile && hasCoreDetails(profile) && hasAbout),
    },
    {
      id: 'alignment',
      label: 'Relationship Alignment',
      complete: input.hasRelationshipAlignment,
    },
    {
      id: 'factors',
      label: 'Important Alignment Factors',
      complete: input.hasImportantAlignmentFactors,
    },
    {
      id: 'enjoy',
      label: 'Things I Enjoy',
      complete: hasNonEmptyArray(profile?.things_i_enjoy),
    },
    {
      id: 'music',
      label: 'Favorite Music',
      complete:
        hasNonEmptyArray(profile?.favorite_music_artists) ||
        hasNonEmptyArray(profile?.favorite_music_songs),
    },
  ];
}

export function calculateProfileCompletionPercent(
  sections: ProfileCompletionSection[]
): number {
  if (sections.length === 0) {
    return 0;
  }
  const completeCount = sections.filter((section) => section.complete).length;
  return Math.round((completeCount / sections.length) * 100);
}

/** Sections intentionally excluded from completion while Coming Soon. */
export const DEFERRED_PROFILE_COMPLETION_SECTIONS = [
  'voice',
  'video',
] as const;
