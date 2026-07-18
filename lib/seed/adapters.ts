/**
 * Adapters from SeedProfile catalog → Discovery / Connections presentation models.
 * Qualitative Relationship Alignment only — no numeric scores or rankings.
 * Seed profile detail/feed alignment is produced by Compatibility Engine V1.
 */

import {
  evaluateCompatibility,
  personFromSeedCompatibilityFields,
  toAlignmentPresentation,
  toFeedAlignmentFields,
} from '@/lib/compatibility';
import { SEED_DEMO_VIEWER } from '@/lib/compatibility/seed-viewer';
import type { CharacterSignalId } from '@/lib/character-signals-mock';
import type { HubProfileCard, MutualConnectionItem } from '@/lib/data/connections-hub';
import { DISCOVERY_NEUTRAL_CONFIDENCE } from '@/lib/discovery/config';
import {
  stablePortraitGradient,
  type DiscoveryFeedCardModel,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';
import { resolveUnifiedAbout } from '@/lib/profile/unified-about';
import {
  characterSignalTitles,
  photos,
  SEED_PROFILES,
  type SeedAlignmentFactor,
  type SeedFactorSeverity,
  type SeedProfile,
} from '@/lib/seed/catalog';

export type { SeedAlignmentFactor, SeedFactorSeverity } from '@/lib/seed/catalog';

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
  /** Optional paragraph under “Why Forge Introduced You”. */
  whySurfacedCopy?: string;
};

function primaryPhotoUrl(profile: SeedProfile): string | null {
  const mapped = photos(profile.photoFiles);
  return mapped[0]?.public_url ?? null;
}

function evaluateSeedAgainstDemoViewer(profile: SeedProfile) {
  return evaluateCompatibility(
    personFromSeedCompatibilityFields(SEED_DEMO_VIEWER),
    personFromSeedCompatibilityFields({
      id: profile.id,
      firstName: profile.firstName,
      relationshipGoal: profile.relationshipGoal,
      faithImportance: profile.faithImportance,
      faithIdentity: profile.faithIdentity ?? null,
      children: profile.children,
      hasChildren: profile.hasChildren,
      openToPartnerWithChildren: profile.openToPartnerWithChildren,
      pets: profile.pets,
      petsTypes: profile.petsTypes,
      petsPartnerPreferences: profile.petsPartnerPreferences,
      petsAllergyConstraint: profile.petsAllergyConstraint,
      petsAllergyTypes: profile.petsAllergyTypes,
      smoking: profile.smoking,
      smokingPartnerPreferences: profile.smokingPartnerPreferences,
      drinking: profile.drinking,
      drinkingPartnerPreferences: profile.drinkingPartnerPreferences,
      coreValues: profile.coreValues,
    })
  );
}

export function toSeedDiscoveryFeedCard(profile: SeedProfile): DiscoveryFeedCardModel {
  const engine = evaluateSeedAgainstDemoViewer(profile);
  const feed = toFeedAlignmentFields(engine);
  return {
    id: profile.id,
    firstName: profile.firstName,
    age: profile.age,
    location: `${profile.locationCity}, ${profile.locationRegion}`,
    alignmentLabel: feed.alignmentLabel,
    confidence: DISCOVERY_NEUTRAL_CONFIDENCE,
    hasImportantFactors: feed.hasImportantFactors,
    importantFactorsSummary: feed.importantFactorsSummary,
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
    short_bio: resolveUnifiedAbout(profile.aboutPreview, profile.moreAbout),
    more_about: null,
    children: profile.children,
    has_children: profile.hasChildren,
    open_to_partner_with_children: profile.openToPartnerWithChildren,
    education: profile.education,
    pets: profile.pets,
    pets_types: profile.petsTypes ?? null,
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
  const engine = evaluateSeedAgainstDemoViewer(profile);
  return toAlignmentPresentation(engine, {
    characterSignalIds: profile.characterSignalIds,
  });
}

export function toSeedHubProfileCard(profile: SeedProfile): HubProfileCard {
  const engine = evaluateSeedAgainstDemoViewer(profile);
  const feed = toFeedAlignmentFields(engine);
  return {
    id: profile.id,
    firstName: profile.firstName,
    age: profile.age,
    location: `${profile.locationCity}, ${profile.locationRegion}`,
    alignmentLabel: feed.alignmentLabel,
    confidence: DISCOVERY_NEUTRAL_CONFIDENCE,
    hasImportantFactors: feed.hasImportantFactors,
    importantFactorsSummary: feed.importantFactorsSummary,
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
