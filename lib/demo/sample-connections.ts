/**
 * Preview-only sample Connections fixtures.
 * Qualitative Relationship Alignment only — no numeric scores or rankings.
 * Never written to Supabase.
 */

import type { CharacterSignalId } from '@/lib/character-signals-mock';
import type { HubProfileCard, MutualConnectionItem } from '@/lib/data/connections-hub';
import { DISCOVERY_NEUTRAL_CONFIDENCE } from '@/lib/discovery/config';
import {
  stablePortraitGradient,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';
import { isDemoProfileId } from '@/lib/demo/demo-access';

export type SampleFactorSeverity =
  | 'informational'
  | 'worth_discussing'
  | 'potential_dealbreaker';

export type SampleAlignmentFactor = {
  id: string;
  title: string;
  severity: SampleFactorSeverity;
  summary: string;
  explanation: string;
  viewerAnswer?: string;
  partnerAnswer?: string;
  isPotentialDealbreaker?: boolean;
};

export type SampleAlignmentItem = {
  title: string;
  copy: string;
};

export type SampleConnection = {
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
  importantFactors: SampleAlignmentFactor[];
  importantFactorsSummary: string | null;
  characterSignals: string[];
  characterSignalIds: CharacterSignalId[];
  incompleteAssessmentCopy?: string;
  photoUrl: string | null;
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

export const DEMO_VIEWER_LABEL = "Bobby's demo profile";

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

export const SAMPLE_CONNECTIONS: SampleConnection[] = [
  {
    id: 'demo-jessica',
    isDemo: true,
    firstName: 'Jessica',
    age: 38,
    locationCity: 'Colorado Springs',
    locationRegion: 'Colorado',
    aboutPreview:
      'Grounded, faith-centered, and focused on building a lasting partnership with honesty and care.',
    moreAbout:
      'I value family, service, and showing up consistently. I am looking for a long-term committed relationship rooted in shared faith and clear communication.',
    alignmentLabel: 'Strong Alignment',
    sharedStrengths: [
      'Both want a long-term committed relationship',
      'Faith is important',
      'Family and children preferences align',
      'Both are comfortable with a partner who already has children',
      'Both are non-smokers',
      'Both value service and community',
      'Communication expectations appear aligned',
    ],
    importantFactors: [],
    importantFactorsSummary: null,
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
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-jessica'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'important',
    children: 'open',
    hasChildren: 'yes',
    openToPartnerWithChildren: 'yes',
    smoking: 'never',
    drinking: 'occasionally',
    relocation: 'open',
    serviceBackground: 'community_service',
    education: 'bachelors',
    pets: 'dog',
    career: 'Healthcare professional',
    thingsIEnjoy: ['Camping', 'Coffee Shops', 'Reading'],
  },
  {
    id: 'demo-megan',
    isDemo: true,
    firstName: 'Megan',
    age: 36,
    locationCity: 'Denver',
    locationRegion: 'Colorado',
    aboutPreview:
      'Family-oriented, outdoorsy, and looking for a serious relationship built on stability and kindness.',
    moreAbout:
      'I enjoy pets, outdoor weekends, and building a steady home life with someone who shares my values around family and commitment.',
    alignmentLabel: 'Promising Alignment',
    sharedStrengths: [
      'Both want a serious relationship',
      'Family preferences generally align',
      'Both are non-smokers',
      'Similar stability and lifestyle priorities',
      'Both enjoy pets and outdoor activities',
    ],
    importantFactors: [
      {
        id: 'megan-relocation',
        title: 'Relocation preferences differ',
        severity: 'worth_discussing',
        summary: 'Relocation preferences differ',
        explanation:
          'This may not be a problem, but it is worth discussing if the relationship becomes serious.',
        viewerAnswer: 'Open to relocating for the right relationship',
        partnerAnswer: 'Prefers to remain near Denver',
      },
    ],
    importantFactorsSummary: 'Relocation preferences differ',
    characterSignals: [
      'Kind Conversation',
      'Clear Intentions',
      'Respectful in Person',
      'Good Listener',
    ],
    characterSignalIds: signalIdsFromTitles([
      'Kind Conversation',
      'Clear Intentions',
      'Respectful in Person',
      'Good Listener',
    ]),
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-megan'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'somewhat_important',
    children: 'open',
    hasChildren: 'no',
    openToPartnerWithChildren: 'yes',
    smoking: 'never',
    drinking: 'occasionally',
    relocation: 'not_open',
    serviceBackground: null,
    education: 'bachelors',
    pets: 'dog',
    career: 'Project manager',
    thingsIEnjoy: ['Camping', 'Dogs', 'Weekend Trips'],
  },
  {
    id: 'demo-lauren',
    isDemo: true,
    firstName: 'Lauren',
    age: 41,
    locationCity: 'Fort Collins',
    locationRegion: 'Colorado',
    aboutPreview:
      'Thoughtful communicator who values service, career stability, and intentional commitment.',
    moreAbout:
      'I prefer calm, honest conversations and a partnership that respects both independence and shared purpose.',
    alignmentLabel: 'More to Discover',
    sharedStrengths: [
      'Both are seeking commitment',
      'Similar career stability',
      'Both value service',
      'Both prefer thoughtful communication',
    ],
    importantFactors: [
      {
        id: 'lauren-faith',
        title: 'Faith importance differs',
        severity: 'worth_discussing',
        summary: 'Faith importance differs',
        explanation:
          'This difference may matter depending on how faith is practiced within a relationship.',
        viewerAnswer: 'Faith is an important relationship value',
        partnerAnswer:
          'Spiritual beliefs are personal but not central to relationship decisions',
      },
      {
        id: 'lauren-drinking',
        title: 'Drinking preferences need clarification',
        severity: 'informational',
        summary: 'Drinking preferences need clarification',
        explanation:
          'Answers suggest different social drinking preferences. Clarifying expectations early can prevent avoidable friction.',
      },
      {
        id: 'lauren-relocation',
        title: 'Relocation information is incomplete',
        severity: 'informational',
        summary: 'Relocation information is incomplete',
        explanation:
          'Forge does not yet have complete relocation answers from both people. Missing information is not treated as negative.',
      },
    ],
    importantFactorsSummary: 'Faith importance differs · more to clarify',
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
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-lauren'),
    relationshipGoal: 'serious_relationship',
    faithImportance: 'not_important',
    children: null,
    hasChildren: 'no',
    openToPartnerWithChildren: null,
    smoking: 'never',
    drinking: null,
    relocation: null,
    serviceBackground: 'community_service',
    education: 'graduate_professional',
    pets: null,
    career: 'Nonprofit director',
    thingsIEnjoy: ['Reading', 'Coffee Shops', 'Fitness'],
  },
  {
    id: 'demo-natalie',
    isDemo: true,
    firstName: 'Natalie',
    age: 39,
    locationCity: 'Pueblo',
    locationRegion: 'Colorado',
    aboutPreview:
      'Clear about her intentions, values respectful communication, and prefers honest early conversations.',
    moreAbout:
      'I appreciate directness and mutual respect. I am looking for a committed relationship with someone who understands my life preferences early.',
    alignmentLabel: 'More to Discover',
    sharedStrengths: [
      'Both value respectful communication',
      'Both prefer commitment',
      'Geographic distance is manageable',
    ],
    importantFactors: [
      {
        id: 'natalie-children',
        title: 'Children preferences differ',
        severity: 'potential_dealbreaker',
        summary: 'Potential dealbreaker: Children preferences differ',
        explanation:
          'These differences may affect long-term compatibility and should be understood before either person becomes deeply invested.',
        viewerAnswer: 'Open to having or raising children within the relationship',
        partnerAnswer: 'Does not want children and does not want a parenting role',
        isPotentialDealbreaker: true,
      },
      {
        id: 'natalie-smoking',
        title: 'Smoking preferences conflict',
        severity: 'worth_discussing',
        summary: 'Smoking preferences conflict',
        explanation:
          'Lifestyle preferences around smoking can affect daily comfort and long-term fit. This is an important difference worth discussing before moving forward.',
        viewerAnswer: 'Non-smoker and prefers a non-smoking partner',
        partnerAnswer: 'Occasional smoker',
      },
    ],
    importantFactorsSummary: 'Potential dealbreaker: Children preferences differ',
    characterSignals: ['Respectful Communicator', 'Clear Intentions'],
    characterSignalIds: signalIdsFromTitles([
      'Respectful Communicator',
      'Clear Intentions',
    ]),
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-natalie'),
    relationshipGoal: 'serious_relationship',
    faithImportance: null,
    children: 'no',
    hasChildren: 'no',
    openToPartnerWithChildren: 'no',
    smoking: 'occasionally',
    drinking: 'occasionally',
    relocation: 'open',
    serviceBackground: null,
    education: 'bachelors',
    pets: null,
    career: 'Operations lead',
    thingsIEnjoy: ['Coffee Shops', 'Board Games'],
  },
  {
    id: 'demo-emily',
    isDemo: true,
    firstName: 'Emily',
    age: 37,
    locationCity: 'Boulder',
    locationRegion: 'Colorado',
    aboutPreview:
      'Curious about a serious relationship and values clear communication. Several lifestyle answers are still incomplete.',
    moreAbout:
      'I am still completing parts of my Forge profile. I care about honest conversation and taking relationships seriously.',
    alignmentLabel: 'Not Enough Information',
    sharedStrengths: [
      'Both appear interested in commitment',
      'Both value communication',
      'Similar geographic region',
    ],
    importantFactors: [],
    importantFactorsSummary: null,
    characterSignals: [],
    characterSignalIds: [],
    incompleteAssessmentCopy:
      'Forge does not have enough information to offer a responsible Relationship Alignment assessment yet.',
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-emily'),
    relationshipGoal: 'serious_relationship',
    faithImportance: null,
    children: null,
    hasChildren: null,
    openToPartnerWithChildren: null,
    smoking: null,
    drinking: null,
    relocation: null,
    serviceBackground: null,
    education: null,
    pets: null,
    career: null,
    thingsIEnjoy: [] as string[],
  },
];

export function getSampleConnections(): readonly SampleConnection[] {
  return SAMPLE_CONNECTIONS;
}

export function getSampleConnectionById(id: string): SampleConnection | undefined {
  if (!isDemoProfileId(id)) return undefined;
  return SAMPLE_CONNECTIONS.find((connection) => connection.id === id);
}

export function toSampleHubProfileCard(sample: SampleConnection): HubProfileCard {
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

export function toSampleMutualConnectionItem(
  sample: SampleConnection
): MutualConnectionItem {
  return {
    ...toSampleHubProfileCard(sample),
    connectionId: `demo-connection-${sample.id}`,
    source: 'mutual_interest',
    relativeTime: 'Recently',
  };
}

export function toSamplePublicDiscoveryProfile(
  sample: SampleConnection
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
    photos: [],
  };
}

export type SampleProfileAlignmentPresentation = {
  alignmentLabel: string;
  sharedStrengths: SampleAlignmentItem[];
  importantFactors: SampleAlignmentFactor[];
  importantFactorsSummary: string | null;
  characterSignalIds: CharacterSignalId[];
  incompleteAssessmentCopy?: string;
  noFactorsCopy?: string;
};

export function toSampleAlignmentPresentation(
  sample: SampleConnection
): SampleProfileAlignmentPresentation {
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
    noFactorsCopy:
      sample.importantFactors.length === 0 && !sample.incompleteAssessmentCopy
        ? 'No major alignment concerns surfaced from the information currently available.'
        : undefined,
  };
}

export function sampleFactorSeverityLabel(severity: SampleFactorSeverity): string {
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

export function sampleFixtureContainsRedFlagLabel(): boolean {
  return JSON.stringify(SAMPLE_CONNECTIONS).toLowerCase().includes('red flag');
}

/** True when Compatibility Index / numeric score fields exist (must stay false). */
export function sampleFixturesHaveNumericScores(): boolean {
  const blob = JSON.stringify(SAMPLE_CONNECTIONS).toLowerCase();
  if (blob.includes('compatibility index') || blob.includes('compatibilityindex')) {
    return true;
  }
  return SAMPLE_CONNECTIONS.some((connection) => {
    const record = connection as unknown as Record<string, unknown>;
    return (
      typeof record.compatibilityIndex === 'number' ||
      typeof record.confidenceScore === 'number' ||
      Array.isArray(record.breakdown)
    );
  });
}
