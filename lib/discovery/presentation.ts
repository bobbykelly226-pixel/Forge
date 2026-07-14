/**
 * Shared helpers for Discovery presentation (no matching scores).
 */

import {
  DISCOVERY_NEUTRAL_ALIGNMENT_LABEL,
  DISCOVERY_NEUTRAL_CONFIDENCE,
} from './config';
import {
  collectStructuredPublicProfileDetails,
  publicLocationLabel,
} from '@/lib/profile/public-labels';

export type PublicDiscoveryProfile = {
  id: string;
  full_name: string | null;
  age: number | null;
  location: string | null;
  location_city?: string | null;
  location_region?: string | null;
  location_country?: string | null;
  relationship_goal: string | null;
  faith_identity?: string | null;
  faith_tradition?: string | null;
  faith_other?: string | null;
  faith_importance: string | null;
  service_background: string | null;
  service_backgrounds?: string[] | null;
  short_bio: string | null;
  more_about: string | null;
  children: string | null;
  has_children: string | null;
  children_count?: string | null;
  open_to_partner_with_children?: string | null;
  education: string | null;
  pets: string | null;
  smoking: string | null;
  drinking: string | null;
  career: string | null;
  relocation: string | null;
  things_i_enjoy: string[] | null;
  favorite_music_artists: string[] | null;
  favorite_music_songs: string[] | null;
  profile_photo_url: string | null;
  /** Ordered public photos (primary included). Empty slots omitted. */
  photos?: Array<{
    id?: string;
    storage_path: string;
    display_order: number;
    is_primary: boolean;
    public_url?: string | null;
  }> | null;
};

export type DiscoveryFeedCardModel = {
  id: string;
  firstName: string;
  age: number | null;
  location: string | null;
  alignmentLabel: string;
  confidence: string;
  hasImportantFactors: boolean;
  importantFactorsSummary?: string;
  /** Null when the member has not written an About section — do not invent copy. */
  aboutPreview: string | null;
  characterSignals: string[];
  portraitGradient: string;
  photoUrl: string | null;
};

export type PublicProfileDetail = {
  label: string;
  value: string;
};

const PORTRAIT_GRADIENTS = [
  'linear-gradient(160deg, #1B2F4A 0%, #3E566F 38%, #A8927D 72%, #E6D5C3 100%)',
  'linear-gradient(150deg, #243447 0%, #5C6B7A 42%, #B8A48F 78%, #E8DCCF 100%)',
  'linear-gradient(145deg, #2A4060 0%, #8FA3BC 45%, #D9C4B0 100%)',
  'linear-gradient(155deg, #1F3348 0%, #6B7C8C 48%, #C9B8A4 100%)',
];

function hasMeaningfulText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function firstNameFromFullName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim() ?? '';
  if (!trimmed) return 'Member';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function stablePortraitGradient(profileId: string): string {
  let hash = 0;
  for (let i = 0; i < profileId.length; i += 1) {
    hash = (hash + profileId.charCodeAt(i) * (i + 1)) % 997;
  }
  return PORTRAIT_GRADIENTS[hash % PORTRAIT_GRADIENTS.length]!;
}

/** Collect only non-empty public detail fields — never invent placeholders. */
export function collectPublicProfileDetails(
  profile: PublicDiscoveryProfile
): PublicProfileDetail[] {
  return collectStructuredPublicProfileDetails(profile);
}

export function nonEmptyStringList(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((item) => item.trim()).filter((item) => item.length > 0);
}

export function resolvePublicLocation(profile: PublicDiscoveryProfile): string | null {
  return publicLocationLabel(profile);
}

export function toDiscoveryFeedCard(profile: PublicDiscoveryProfile): DiscoveryFeedCardModel {
  return {
    id: profile.id,
    firstName: firstNameFromFullName(profile.full_name),
    age: profile.age,
    location: resolvePublicLocation(profile),
    alignmentLabel: DISCOVERY_NEUTRAL_ALIGNMENT_LABEL,
    confidence: DISCOVERY_NEUTRAL_CONFIDENCE,
    hasImportantFactors: false,
    aboutPreview: hasMeaningfulText(profile.short_bio) ? profile.short_bio.trim() : null,
    characterSignals: [],
    portraitGradient: stablePortraitGradient(profile.id),
    photoUrl: profile.profile_photo_url,
  };
}

export function relativeTimeLabel(iso: string | null | undefined): string {
  if (!iso) return 'Recently';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Recently';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return 'Just now';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  return 'Recently';
}
