/**
 * Adapters from SeedProfile catalog → Discovery / Connections presentation models.
 * Qualitative Relationship Alignment only — no numeric scores or rankings.
 */

import type { CharacterSignalId } from '@/lib/character-signals-mock';
import type { HubProfileCard, MutualConnectionItem } from '@/lib/data/connections-hub';
import { DISCOVERY_NEUTRAL_CONFIDENCE } from '@/lib/discovery/config';
import {
  stablePortraitGradient,
  type DiscoveryFeedCardModel,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';
import {
  characterSignalTitles,
  photos,
  SEED_PROFILES,
  type SeedAlignmentFactor,
  type SeedFactorSeverity,
  type SeedProfile,
} from '@/lib/seed/catalog';

export type SeedAlignmentItem = {
  title: string;
  copy: string;
};

export type SeedProfileAlignmentPresentation = {
  alignmentLabel: string;
  sharedStrengths: SeedAlignmentItem[];
  importantFactors: SeedAlignmentFactor[];
  importantFactorsSummary: string | null;
  characterSignalIds: CharacterSignalId[];
  incompleteAssessmentCopy?: string;
  noFactorsCopy?: string;
  /** Optional paragraph for “Why Forge surfaced this profile”. */
  whySurfacedCopy?: string;
};

function primaryPhotoUrl(profile: SeedProfile): string | null {
  const mapped = photos(profile.photoFiles);
  return mapped[0]?.public_url ?? null;
}

export function toSeedDiscoveryFeedCard(profile: SeedProfile): DiscoveryFeedCardModel {
  return {
    id: profile.id,
    firstName: profile.firstName,
    age: profile.age,
    location: `${profile.locationCity}, ${profile.locationRegion}`,
    alignmentLabel: profile.alignmentLabel,
    confidence: DISCOVERY_NEUTRAL_CONFIDENCE,
    hasImportantFactors: profile.importantFactors.length > 0,
    importantFactorsSummary: profile.importantFactorsSummary ?? undefined,
    aboutPreview: profile.aboutPreview,
    characterSignals: characterSignalTitles(profile.characterSignalIds),
    portraitGradient: stablePortraitGradient(profile.id),
    photoUrl: primaryPhotoUrl(profile),
  };
}

export function toSeedPublicDiscoveryProfile(
  profile: SeedProfile
): PublicDiscoveryProfile {
  const mappedPhotos = photos(profile.photoFiles);
  return {
    id: profile.id,
    full_name: profile.firstName,
    age: profile.age,
    location: `${profile.locationCity}, ${profile.locationRegion}`,
    location_city: profile.locationCity,
    location_region: profile.locationRegion,
    location_country: 'United States',
    relationship_goal: profile.relationshipGoal,
    faith_importance: profile.faithImportance,
    service_background: profile.serviceBackground,
    short_bio: profile.aboutPreview,
    more_about: profile.moreAbout,
    children: profile.children,
    has_children: profile.hasChildren,
    open_to_partner_with_children: profile.openToPartnerWithChildren,
    education: profile.education,
    pets: profile.pets,
    smoking: profile.smoking,
    drinking: profile.drinking,
    career: profile.career,
    relocation: profile.relocation,
    things_i_enjoy: profile.thingsIEnjoy.length > 0 ? profile.thingsIEnjoy : null,
    favorite_music_artists: null,
    favorite_music_songs: null,
    profile_photo_url: mappedPhotos[0]?.public_url ?? null,
    photos: mappedPhotos,
  };
}

export function toSeedAlignmentPresentation(
  profile: SeedProfile
): SeedProfileAlignmentPresentation {
  return {
    alignmentLabel: profile.alignmentLabel,
    sharedStrengths: profile.sharedStrengths.map((copy) => ({
      title: 'Aligned',
      copy,
    })),
    importantFactors: profile.importantFactors,
    importantFactorsSummary: profile.importantFactorsSummary,
    characterSignalIds: profile.characterSignalIds,
    incompleteAssessmentCopy: profile.incompleteAssessmentCopy,
    noFactorsCopy:
      profile.noFactorsCopy ??
      (profile.importantFactors.length === 0 && !profile.incompleteAssessmentCopy
        ? 'No major alignment concerns surfaced from the information currently available.'
        : undefined),
    whySurfacedCopy: profile.whySurfacedCopy,
  };
}

export function toSeedHubProfileCard(profile: SeedProfile): HubProfileCard {
  return {
    id: profile.id,
    firstName: profile.firstName,
    age: profile.age,
    location: `${profile.locationCity}, ${profile.locationRegion}`,
    alignmentLabel: profile.alignmentLabel,
    confidence: DISCOVERY_NEUTRAL_CONFIDENCE,
    hasImportantFactors: profile.importantFactors.length > 0,
    importantFactorsSummary: profile.importantFactorsSummary ?? undefined,
    aboutPreview: profile.aboutPreview,
    characterSignals: characterSignalTitles(profile.characterSignalIds),
    portraitGradient: stablePortraitGradient(profile.id),
    photoUrl: primaryPhotoUrl(profile),
  };
}

export function toSeedMutualConnectionItem(
  profile: SeedProfile
): MutualConnectionItem {
  return {
    ...toSeedHubProfileCard(profile),
    connectionId: `seed-connection-${profile.id}`,
    source: 'mutual_interest',
    relativeTime: 'Recently',
  };
}

export function seedFactorSeverityLabel(severity: SeedFactorSeverity): string {
  switch (severity) {
    case 'potential_dealbreaker':
      return 'Potential dealbreaker';
    case 'worth_discussing':
      return 'Worth discussing';
    case 'informational':
    default:
      return 'Important difference';
  }
}

export function seedFixtureContainsRedFlagLabel(): boolean {
  return JSON.stringify(SEED_PROFILES).toLowerCase().includes('red flag');
}

/** True when Compatibility Index / numeric score fields exist (must stay false). */
export function seedFixturesHaveNumericScores(): boolean {
  const blob = JSON.stringify(SEED_PROFILES).toLowerCase();
  if (blob.includes('compatibility index') || blob.includes('compatibilityindex')) {
    return true;
  }
  return SEED_PROFILES.some((profile) => {
    const record = profile as unknown as Record<string, unknown>;
    return (
      typeof record.compatibilityIndex === 'number' ||
      typeof record.confidenceScore === 'number' ||
      Array.isArray(record.breakdown)
    );
  });
}
