/**
 * Preview-only Discovery feed fixtures.
 * Distinct from Connections mutual samples. Never written to Supabase.
 */

import type { CharacterSignalId } from '@/lib/character-signals-mock';
import { isDemoDiscoveryProfileId } from '@/lib/demo/demo-access';
import type {
  SampleAlignmentFactor,
  SampleProfileAlignmentPresentation,
} from '@/lib/demo/sample-connections';
import { DISCOVERY_NEUTRAL_CONFIDENCE } from '@/lib/discovery/config';
import {
  stablePortraitGradient,
  type DiscoveryFeedCardModel,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';

export type SampleDiscoveryPhoto = {
  id: string;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
  public_url: string;
};

export type SampleDiscoveryProfile = {
  id: string;
  isDemo: true;
  firstName: string;
  age: number;
  locationCity: string;
  locationRegion: string;
  aboutPreview: string;
  moreAbout: string;
  alignmentLabel:
    | 'Strong Alignment'
    | 'Promising Alignment'
    | 'More to Discover'
    | 'Not Enough Information';
  sharedStrengths: string[];
  whySurfacedCopy?: string;
  importantFactors: SampleAlignmentFactor[];
  importantFactorsSummary: string | null;
  characterSignals: string[];
  characterSignalIds: CharacterSignalId[];
  incompleteAssessmentCopy?: string;
  noFactorsCopy?: string;
  photoUrl: string | null;
  photos: SampleDiscoveryPhoto[];
  portraitGradient: string;
  relationshipGoal: string | null;
  faithImportance: string | null;
  children: string | null;
  hasChildren: string | null;
  openToPartnerWithChildren: string | null;
  smoking: string | null;
  drinking: string | null;
  relocation: string | null;
  serviceBackground: string | null;
  education: string | null;
  pets: string | null;
  career: string | null;
  thingsIEnjoy: string[];
};

const SIGNAL_TITLE_TO_ID: Record<string, CharacterSignalId> = {
  'Respectful Communicator': 'respectful_communicator',
  'Good Listener': 'great_listener',
  'Great Listener': 'great_listener',
  'Clear Intentions': 'clear_intentions',
  'Consistent Follow-through': 'consistent_follow_through',
  'Kind Conversation': 'kind_conversation',
  'Respectful in Person': 'respectful_in_person',
  'Handled Mismatch Respectfully': 'handled_mismatch_respectfully',
};

function signalIdsFromTitles(titles: string[]): CharacterSignalId[] {
  return titles
    .map((title) => SIGNAL_TITLE_TO_ID[title])
    .filter((id): id is CharacterSignalId => Boolean(id));
}

function photos(
  entries: Array<{ id: string; file: string; primary?: boolean }>
): SampleDiscoveryPhoto[] {
  return entries.map((entry, index) => ({
    id: entry.id,
    storage_path: `demo-portraits/${entry.file}`,
    display_order: index,
    is_primary: Boolean(entry.primary) || index === 0,
    public_url: `/demo-portraits/${entry.file}`,
  }));
}

export const SAMPLE_DISCOVERY_PROFILES: SampleDiscoveryProfile[] = [
  {
    id: 'demo-discovery-amanda',
    isDemo: true,
    firstName: 'Amanda',
    age: 40,
    locationCity: 'Colorado Springs',
    locationRegion: 'Colorado',
    aboutPreview:
      'I’m grounded, loyal, and happiest when life has a sense of purpose. I value faith, family, direct communication, and creating a home that feels peaceful and welcoming.',
    moreAbout:
      'I’m a registered dental hygienist with two children. I’m open to a partner who has children and want a long-term committed relationship. Faith is important to me. I’m a non-smoker, drink occasionally, have a dog, and volunteer with local food programs. I’m not actively seeking relocation, but I’m open to discussing it.',
    alignmentLabel: 'Strong Alignment',
    sharedStrengths: [
      'Long-term relationship intentions align',
      'Faith carries similar importance',
      'Family and children preferences align',
      'Both are comfortable blending families',
      'Both value service and community',
      'Smoking preferences align',
      'Communication expectations appear compatible',
    ],
    importantFactors: [],
    importantFactorsSummary: null,
    noFactorsCopy:
      'No major alignment concerns surfaced from the information currently available.',
    characterSignals: [
      'Respectful Communicator',
      'Good Listener',
      'Clear Intentions',
      'Consistent Follow-through',
    ],
    characterSignalIds: signalIdsFromTitles([
      'Respectful Communicator',
      'Good Listener',
      'Clear Intentions',
      'Consistent Follow-through',
    ]),
    photos: photos([
      { id: 'amanda-1', file: 'amanda-1.svg', primary: true },
      { id: 'amanda-2', file: 'amanda-2.svg' },
    ]),
    photoUrl: '/demo-portraits/amanda-1.svg',
    portraitGradient: stablePortraitGradient('demo-discovery-amanda'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'important',
    children: 'open',
    hasChildren: 'yes',
    openToPartnerWithChildren: 'yes',
    smoking: 'never',
    drinking: 'occasionally',
    relocation: 'possibly',
    serviceBackground: 'community_service',
    education: 'associate',
    pets: 'dog',
    career: 'Registered dental hygienist',
    thingsIEnjoy: ['Dogs', 'Coffee Shops', 'Reading'],
  },
  {
    id: 'demo-discovery-sarah',
    isDemo: true,
    firstName: 'Sarah',
    age: 36,
    locationCity: 'Denver',
    locationRegion: 'Colorado',
    aboutPreview:
      'I’m thoughtful, independent, and ready for something real. I enjoy travel, live music, quiet weekends, and being close to the people who matter most.',
    moreAbout:
      'I work in healthcare administration. I don’t have children and I’m open to a partner who does. I’m unsure whether I want biological children. I’m spiritual but not highly religious, a non-smoker, and a social drinker. I love dogs and prefer to remain near Denver.',
    alignmentLabel: 'Promising Alignment',
    sharedStrengths: [
      'Both are looking for commitment',
      'Communication and relationship expectations align',
      'Both value family stability',
      'Smoking preferences align',
      'Both are comfortable with an established partner and family life',
    ],
    importantFactors: [
      {
        id: 'sarah-faith',
        title: 'Faith importance differs somewhat',
        severity: 'worth_discussing',
        summary: 'Faith importance differs somewhat',
        explanation:
          'This may not be a problem, but it is worth discussing how faith or spirituality would show up in a relationship.',
        viewerAnswer: 'Faith is an important relationship value',
        partnerAnswer: 'Spiritual but not highly religious',
      },
      {
        id: 'sarah-relocation',
        title: 'Relocation preferences may differ',
        severity: 'worth_discussing',
        summary: 'Relocation preferences may differ',
        explanation:
          'Sarah prefers to remain near Denver. If a shared future becomes serious, location expectations are worth clarifying early.',
        viewerAnswer: 'Open to relocating for the right relationship',
        partnerAnswer: 'Prefers to remain near Denver',
      },
      {
        id: 'sarah-children',
        title: 'Children intentions deserve more conversation',
        severity: 'informational',
        summary: 'Children intentions deserve more conversation',
        explanation:
          'Answers suggest openness with some uncertainty around biological children. Missing certainty is not treated as negative — conversation helps.',
      },
    ],
    importantFactorsSummary: 'Faith, relocation, and children deserve conversation',
    characterSignals: ['Kind Conversation', 'Good Listener', 'Clear Intentions'],
    characterSignalIds: signalIdsFromTitles([
      'Kind Conversation',
      'Good Listener',
      'Clear Intentions',
    ]),
    photos: photos([
      { id: 'sarah-1', file: 'sarah-1.svg', primary: true },
      { id: 'sarah-2', file: 'sarah-2.svg' },
    ]),
    photoUrl: '/demo-portraits/sarah-1.svg',
    portraitGradient: stablePortraitGradient('demo-discovery-sarah'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'somewhat_important',
    children: 'unsure',
    hasChildren: 'no',
    openToPartnerWithChildren: 'yes',
    smoking: 'never',
    drinking: 'socially',
    relocation: 'not_open',
    serviceBackground: null,
    education: 'bachelors',
    pets: 'dog',
    career: 'Healthcare administration',
    thingsIEnjoy: ['Weekend Trips', 'Coffee Shops', 'Fitness'],
  },
  {
    id: 'demo-discovery-nicole',
    isDemo: true,
    firstName: 'Nicole',
    age: 42,
    locationCity: 'Castle Rock',
    locationRegion: 'Colorado',
    aboutPreview:
      'I’m warm, ambitious, and intentional about the people I let into my life. I care deeply about honesty, consistency, family, and laughing often.',
    moreAbout:
      'I’m a corporate project manager with one teenage child. I do not want additional biological children, and I’m comfortable with a partner who has children. Faith is personally meaningful. I’m a non-smoker, rarely drink, value education and career stability, and I’m open to relocating within Colorado.',
    alignmentLabel: 'Promising Alignment',
    sharedStrengths: [
      'Commitment intentions align',
      'Blended-family openness aligns',
      'Similar priorities around stability',
      'Faith and service values appear compatible',
      'Lifestyle preferences largely align',
    ],
    importantFactors: [
      {
        id: 'nicole-children',
        title: 'Future children preferences should be clarified',
        severity: 'worth_discussing',
        summary: 'Future children preferences should be clarified',
        explanation:
          'Nicole does not want additional biological children. Clarifying long-term family plans helps both people move forward with care.',
        viewerAnswer: 'Open to having or raising children within the relationship',
        partnerAnswer: 'Does not want additional biological children',
      },
    ],
    importantFactorsSummary: 'Future children preferences should be clarified',
    characterSignals: [
      'Respectful Communicator',
      'Respectful in Person',
      'Consistent Follow-through',
      'Good Listener',
    ],
    characterSignalIds: signalIdsFromTitles([
      'Respectful Communicator',
      'Respectful in Person',
      'Consistent Follow-through',
      'Good Listener',
    ]),
    photos: photos([
      { id: 'nicole-1', file: 'nicole-1.svg', primary: true },
      { id: 'nicole-2', file: 'nicole-2.svg' },
    ]),
    photoUrl: '/demo-portraits/nicole-1.svg',
    portraitGradient: stablePortraitGradient('demo-discovery-nicole'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'important',
    children: 'no',
    hasChildren: 'yes',
    openToPartnerWithChildren: 'yes',
    smoking: 'never',
    drinking: 'occasionally',
    relocation: 'possibly',
    serviceBackground: null,
    education: 'bachelors',
    pets: 'no_pets',
    career: 'Corporate project manager',
    thingsIEnjoy: ['Board Games', 'Coffee Shops', 'Fitness'],
  },
  {
    id: 'demo-discovery-rachel',
    isDemo: true,
    firstName: 'Rachel',
    age: 38,
    locationCity: 'Fort Collins',
    locationRegion: 'Colorado',
    aboutPreview:
      'I value kindness, curiosity, independence, and being able to talk through hard things without losing respect for each other.',
    moreAbout:
      'I’m a university program coordinator with no children. I’m unsure about parenting. Faith is not central to my daily life. I’m a non-smoker, drink socially, have two cats, feel a strong connection to Fort Collins, and stay active in community arts.',
    alignmentLabel: 'More to Discover',
    sharedStrengths: [
      'Both want a meaningful relationship',
      'Communication priorities appear compatible',
      'Both value service and community',
      'Geographic distance remains manageable',
    ],
    importantFactors: [
      {
        id: 'rachel-faith',
        title: 'Faith importance differs',
        severity: 'worth_discussing',
        summary: 'Faith importance differs',
        explanation:
          'This difference may matter depending on how faith is practiced within a relationship.',
        viewerAnswer: 'Faith is an important relationship value',
        partnerAnswer: 'Faith is not central to daily life',
      },
      {
        id: 'rachel-parenting',
        title: 'Parenting preferences are unclear',
        severity: 'informational',
        summary: 'Parenting preferences are unclear',
        explanation:
          'Rachel is unsure about parenting. Incomplete or uncertain answers are not treated as negative — they invite conversation.',
      },
      {
        id: 'rachel-relocation',
        title: 'Relocation preferences may differ',
        severity: 'worth_discussing',
        summary: 'Relocation preferences may differ',
        explanation:
          'Rachel feels strongly connected to Fort Collins. Shared home-base expectations are worth discussing if the relationship becomes serious.',
      },
    ],
    importantFactorsSummary: 'Faith, parenting, and relocation need clarification',
    characterSignals: [
      'Good Listener',
      'Respectful Communicator',
      'Handled Mismatch Respectfully',
    ],
    characterSignalIds: signalIdsFromTitles([
      'Good Listener',
      'Respectful Communicator',
      'Handled Mismatch Respectfully',
    ]),
    photos: photos([{ id: 'rachel-1', file: 'rachel-1.svg', primary: true }]),
    photoUrl: '/demo-portraits/rachel-1.svg',
    portraitGradient: stablePortraitGradient('demo-discovery-rachel'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'not_important',
    children: 'unsure',
    hasChildren: 'no',
    openToPartnerWithChildren: 'open',
    smoking: 'never',
    drinking: 'socially',
    relocation: 'not_open',
    serviceBackground: 'community_service',
    education: 'graduate_professional',
    pets: 'cat',
    career: 'University program coordinator',
    thingsIEnjoy: ['Reading', 'Coffee Shops', 'Board Games'],
  },
  {
    id: 'demo-discovery-danielle',
    isDemo: true,
    firstName: 'Danielle',
    age: 39,
    locationCity: 'Parker',
    locationRegion: 'Colorado',
    aboutPreview:
      'I’m family-centered, affectionate, and very clear about wanting a committed partnership. I appreciate consistency, humor, and someone who follows through.',
    moreAbout:
      'I’m an elementary school counselor with one child. I’m open to more children and welcome a partner with children. Faith is important. I’m a non-smoker, rarely drink, have a dog, volunteer with youth programs, and I’m open to relocating for the right relationship.',
    alignmentLabel: 'Strong Alignment',
    sharedStrengths: [
      'Relationship intentions strongly align',
      'Family and children preferences align',
      'Faith importance aligns',
      'Service background aligns',
      'Communication expectations align',
      'Lifestyle preferences appear compatible',
    ],
    importantFactors: [],
    importantFactorsSummary: null,
    noFactorsCopy:
      'No major alignment concerns surfaced from the information currently available.',
    characterSignals: [
      'Clear Intentions',
      'Kind Conversation',
      'Respectful Communicator',
      'Consistent Follow-through',
    ],
    characterSignalIds: signalIdsFromTitles([
      'Clear Intentions',
      'Kind Conversation',
      'Respectful Communicator',
      'Consistent Follow-through',
    ]),
    photos: photos([
      { id: 'danielle-1', file: 'danielle-1.svg', primary: true },
      { id: 'danielle-2', file: 'danielle-2.svg' },
    ]),
    photoUrl: '/demo-portraits/danielle-1.svg',
    portraitGradient: stablePortraitGradient('demo-discovery-danielle'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'important',
    children: 'yes',
    hasChildren: 'yes',
    openToPartnerWithChildren: 'yes',
    smoking: 'never',
    drinking: 'occasionally',
    relocation: 'open',
    serviceBackground: 'education',
    education: 'graduate_professional',
    pets: 'dog',
    career: 'Elementary school counselor',
    thingsIEnjoy: ['Dogs', 'Reading', 'Camping'],
  },
  {
    id: 'demo-discovery-monica',
    isDemo: true,
    firstName: 'Monica',
    age: 41,
    locationCity: 'Boulder',
    locationRegion: 'Colorado',
    aboutPreview:
      'I’m creative, active, and deeply value personal growth. I’m looking for a relationship that feels supportive without either person losing who they are.',
    moreAbout:
      'I own a wellness studio. I don’t have children, don’t want biological children, and I’m uncertain about taking on a parenting role. I’m spiritual, a non-smoker, drink occasionally, prefer Boulder, and value travel and flexibility.',
    alignmentLabel: 'More to Discover',
    sharedStrengths: [
      'Both value commitment and respectful communication',
      'Smoking preferences align',
      'Both value personal growth and meaningful work',
    ],
    importantFactors: [
      {
        id: 'monica-children',
        title: 'Children and parenting preferences may differ',
        severity: 'potential_dealbreaker',
        summary: 'Potential dealbreaker: Children and parenting preferences may differ',
        explanation:
          'These differences may affect long-term compatibility and should be understood before either person becomes deeply invested.',
        viewerAnswer: 'Open to having or raising children within the relationship',
        partnerAnswer:
          'Does not want biological children and is uncertain about a parenting role',
        isPotentialDealbreaker: true,
      },
      {
        id: 'monica-faith',
        title: 'Faith importance may differ',
        severity: 'worth_discussing',
        summary: 'Faith importance may differ',
        explanation:
          'Monica describes herself as spiritual. How faith and spirituality are practiced together is worth discussing before moving forward.',
      },
      {
        id: 'monica-relocation',
        title: 'Relocation flexibility may differ',
        severity: 'informational',
        summary: 'Relocation flexibility may differ',
        explanation:
          'Monica prefers Boulder. Shared expectations around home base and travel flexibility can be clarified through conversation.',
      },
    ],
    importantFactorsSummary:
      'Potential dealbreaker: Children and parenting preferences may differ',
    characterSignals: ['Clear Intentions', 'Respectful Communicator'],
    characterSignalIds: signalIdsFromTitles([
      'Clear Intentions',
      'Respectful Communicator',
    ]),
    photos: photos([{ id: 'monica-1', file: 'monica-1.svg', primary: true }]),
    photoUrl: '/demo-portraits/monica-1.svg',
    portraitGradient: stablePortraitGradient('demo-discovery-monica'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'somewhat_important',
    children: 'no',
    hasChildren: 'no',
    openToPartnerWithChildren: 'no',
    smoking: 'never',
    drinking: 'occasionally',
    relocation: 'not_open',
    serviceBackground: null,
    education: 'bachelors',
    pets: 'no_pets',
    career: 'Wellness studio owner',
    thingsIEnjoy: ['Fitness', 'Weekend Trips', 'Coffee Shops'],
  },
  {
    id: 'demo-discovery-kristin',
    isDemo: true,
    firstName: 'Kristin',
    age: 37,
    locationCity: 'Lakewood',
    locationRegion: 'Colorado',
    aboutPreview:
      'I’m easygoing, thoughtful, and ready to meet someone who wants to build something meaningful.',
    moreAbout:
      'I work in insurance operations. Several structured profile fields remain unanswered, so Forge has limited relationship-preference information so far.',
    alignmentLabel: 'Not Enough Information',
    sharedStrengths: [
      'Interested in a serious relationship',
      'Values communication',
      'Lives within a reasonable distance',
    ],
    whySurfacedCopy:
      'Kristin’s stated relationship intentions and location may be relevant, but Forge needs more information before offering a responsible Relationship Alignment assessment.',
    importantFactors: [],
    importantFactorsSummary: null,
    incompleteAssessmentCopy:
      'Forge does not have enough information to offer a responsible Relationship Alignment assessment yet.',
    noFactorsCopy: 'Not enough information',
    characterSignals: [],
    characterSignalIds: [],
    photos: photos([{ id: 'kristin-1', file: 'kristin-1.svg', primary: true }]),
    photoUrl: '/demo-portraits/kristin-1.svg',
    portraitGradient: stablePortraitGradient('demo-discovery-kristin'),
    relationshipGoal: 'serious_relationship',
    faithImportance: null,
    children: null,
    hasChildren: null,
    openToPartnerWithChildren: null,
    smoking: 'never',
    drinking: null,
    relocation: null,
    serviceBackground: null,
    education: null,
    pets: null,
    career: 'Insurance operations',
    thingsIEnjoy: [],
  },
];

export function getSampleDiscoveryProfiles(): readonly SampleDiscoveryProfile[] {
  return SAMPLE_DISCOVERY_PROFILES;
}

export function getSampleDiscoveryProfileById(
  id: string
): SampleDiscoveryProfile | undefined {
  if (!isDemoDiscoveryProfileId(id)) return undefined;
  return SAMPLE_DISCOVERY_PROFILES.find((profile) => profile.id === id);
}

export function toSampleDiscoveryFeedCard(
  sample: SampleDiscoveryProfile
): DiscoveryFeedCardModel {
  return {
    id: sample.id,
    firstName: sample.firstName,
    age: sample.age,
    location: `${sample.locationCity}, ${sample.locationRegion}`,
    alignmentLabel: sample.alignmentLabel,
    confidence: DISCOVERY_NEUTRAL_CONFIDENCE,
    hasImportantFactors: sample.importantFactors.length > 0,
    importantFactorsSummary: sample.importantFactorsSummary ?? undefined,
    aboutPreview: sample.aboutPreview,
    characterSignals: sample.characterSignals,
    portraitGradient: sample.portraitGradient,
    photoUrl: sample.photoUrl,
  };
}

export function toSampleDiscoveryPublicProfile(
  sample: SampleDiscoveryProfile
): PublicDiscoveryProfile {
  return {
    id: sample.id,
    full_name: sample.firstName,
    age: sample.age,
    location: `${sample.locationCity}, ${sample.locationRegion}`,
    location_city: sample.locationCity,
    location_region: sample.locationRegion,
    location_country: 'United States',
    relationship_goal: sample.relationshipGoal,
    faith_importance: sample.faithImportance,
    service_background: sample.serviceBackground,
    short_bio: sample.aboutPreview,
    more_about: sample.moreAbout,
    children: sample.children,
    has_children: sample.hasChildren,
    open_to_partner_with_children: sample.openToPartnerWithChildren,
    education: sample.education,
    pets: sample.pets,
    smoking: sample.smoking,
    drinking: sample.drinking,
    career: sample.career,
    relocation: sample.relocation,
    things_i_enjoy: sample.thingsIEnjoy.length > 0 ? sample.thingsIEnjoy : null,
    favorite_music_artists: null,
    favorite_music_songs: null,
    profile_photo_url: sample.photoUrl,
    photos: sample.photos,
  };
}

export function toSampleDiscoveryAlignmentPresentation(
  sample: SampleDiscoveryProfile
): SampleProfileAlignmentPresentation & { whySurfacedCopy?: string } {
  return {
    alignmentLabel: sample.alignmentLabel,
    sharedStrengths: sample.sharedStrengths.map((copy) => ({
      title: 'Aligned',
      copy,
    })),
    importantFactors: sample.importantFactors,
    importantFactorsSummary: sample.importantFactorsSummary,
    characterSignalIds: sample.characterSignalIds,
    incompleteAssessmentCopy: sample.incompleteAssessmentCopy,
    noFactorsCopy: sample.noFactorsCopy,
    whySurfacedCopy: sample.whySurfacedCopy,
  };
}

export function sampleDiscoveryFixturesHaveNumericScores(): boolean {
  return SAMPLE_DISCOVERY_PROFILES.some((profile) => {
    const record = profile as unknown as Record<string, unknown>;
    return (
      typeof record.compatibilityIndex === 'number' ||
      typeof record.confidenceScore === 'number' ||
      Array.isArray(record.breakdown)
    );
  });
}

export function sampleDiscoveryContainsRedFlagLabel(): boolean {
  return JSON.stringify(SAMPLE_DISCOVERY_PROFILES).toLowerCase().includes('red flag');
}
