/**
 * Deterministic local fixtures for the private Demo Connections Showcase.
 *
 * Read-only. Never writes to Supabase, never creates auth users, never
 * pollutes Discovery or live Connections.
 */

import type { HubProfileCard } from '@/lib/data/connections-hub';
import { stablePortraitGradient } from '@/lib/discovery/presentation';

export const DEMO_CONNECTIONS_ROUTE = '/internal/demo-connections';

export type DemoAlignmentCategory =
  | 'Strong Alignment'
  | 'Promising Alignment'
  | 'More to Discover'
  | 'Not Enough Information';

export type DemoConfidence = 'High' | 'Moderate' | 'Low';

export type DemoFactorSeverity =
  | 'informational'
  | 'worth_discussing'
  | 'potential_dealbreaker';

export type DemoCompatibilityBreakdownScore = {
  label: string;
  /** Null when incomplete — never invent a misleading score. */
  score: number | null;
  unavailableLabel?: string;
};

export type DemoAlignmentFactor = {
  id: string;
  title: string;
  severity: DemoFactorSeverity;
  /** Short card summary */
  summary: string;
  explanation: string;
  viewerAnswer?: string;
  partnerAnswer?: string;
  /** When true, copy may use "Potential dealbreaker" language */
  isPotentialDealbreaker?: boolean;
};

export type DemoConnection = {
  /** Stable demo id — clearly marked as demo data internally */
  id: string;
  isDemo: true;
  firstName: string;
  age: number;
  location: string;
  aboutPreview: string;
  alignmentLabel: DemoAlignmentCategory;
  confidence: DemoConfidence;
  /**
   * Compatibility Index. Null for Not Enough Information —
   * never display a fabricated number.
   */
  compatibilityIndex: number | null;
  compatibilityIndexDisplay: string;
  sharedStrengths: string[];
  strengthsHeading: string;
  noFactorsCopy?: string;
  importantFactors: DemoAlignmentFactor[];
  cardFactorSummary: string | null;
  characterSignals: string[];
  characterSignalsEmptyCopy?: string;
  breakdown: DemoCompatibilityBreakdownScore[];
  conversationTopics: string[];
  incompleteAssessmentCopy?: string;
  /** Reserved for future synthetic demo portraits */
  photoUrl: string | null;
  portraitGradient: string;
  initials: string;
};

export type DemoViewerContext = {
  firstName: string;
  label: string;
};

/** Bobby's demo viewer preferences referenced in factor comparisons */
export const DEMO_VIEWER: DemoViewerContext = {
  firstName: 'Bobby',
  label: "Bobby's demo profile",
};

export const DEMO_CONNECTIONS: DemoConnection[] = [
  {
    id: 'demo-jessica',
    isDemo: true,
    firstName: 'Jessica',
    age: 38,
    location: 'Colorado Springs, Colorado',
    aboutPreview:
      'Grounded, faith-centered, and focused on building a lasting partnership with honesty and care.',
    alignmentLabel: 'Strong Alignment',
    confidence: 'High',
    compatibilityIndex: 94,
    compatibilityIndexDisplay: '94',
    strengthsHeading: 'Why you align',
    sharedStrengths: [
      'Both want a long-term committed relationship',
      'Faith is important in daily life',
      'Family and children preferences align',
      'Both are comfortable with a partner who already has children',
      'Both are non-smokers',
      'Both value community service and helping others',
      'Similar expectations around communication and commitment',
    ],
    importantFactors: [],
    noFactorsCopy:
      'No major alignment concerns surfaced from the information currently available.',
    cardFactorSummary: null,
    characterSignals: [
      'Respectful Communicator',
      'Good Listener',
      'Clear Intentions',
      'Consistent Follow-through',
    ],
    breakdown: [
      { label: 'Relationship Goals', score: 97 },
      { label: 'Core Values', score: 95 },
      { label: 'Family and Children', score: 96 },
      { label: 'Lifestyle', score: 91 },
      { label: 'Communication', score: 93 },
    ],
    conversationTopics: [
      'What role does faith play in your everyday life?',
      'What does a healthy long-term partnership look like to you?',
      'How do you balance family, work, and time together?',
    ],
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-jessica'),
    initials: 'J',
  },
  {
    id: 'demo-megan',
    isDemo: true,
    firstName: 'Megan',
    age: 36,
    location: 'Denver, Colorado',
    aboutPreview:
      'Family-oriented, outdoorsy, and looking for a serious relationship built on stability and kindness.',
    alignmentLabel: 'Promising Alignment',
    confidence: 'High',
    compatibilityIndex: 83,
    compatibilityIndexDisplay: '83',
    strengthsHeading: 'Why you align',
    sharedStrengths: [
      'Both want a serious relationship',
      'Both value family stability',
      'Children preferences generally align',
      'Both are non-smokers',
      'Similar education and career priorities',
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
    cardFactorSummary: 'Relocation preferences differ',
    characterSignals: [
      'Kind Conversation',
      'Clear Intentions',
      'Respectful in Person',
      'Good Listener',
    ],
    breakdown: [
      { label: 'Relationship Goals', score: 92 },
      { label: 'Core Values', score: 87 },
      { label: 'Family and Children', score: 84 },
      { label: 'Lifestyle', score: 76 },
      { label: 'Communication', score: 86 },
    ],
    conversationTopics: [
      'How important is staying close to your current community?',
      'What circumstances would make relocation worth considering?',
      'What does building a shared home base look like to you?',
    ],
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-megan'),
    initials: 'M',
  },
  {
    id: 'demo-lauren',
    isDemo: true,
    firstName: 'Lauren',
    age: 41,
    location: 'Fort Collins, Colorado',
    aboutPreview:
      'Thoughtful communicator who values service, career stability, and intentional commitment.',
    alignmentLabel: 'More to Discover',
    confidence: 'Moderate',
    compatibilityIndex: 68,
    compatibilityIndexDisplay: '68',
    strengthsHeading: 'Why you align',
    sharedStrengths: [
      'Both are seeking commitment',
      'Similar career stability',
      'Both value service and community involvement',
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
    cardFactorSummary: 'Faith importance differs · more to clarify',
    characterSignals: [
      'Good Listener',
      'Respectful Communicator',
      'Handled Mismatch Respectfully',
    ],
    breakdown: [
      { label: 'Relationship Goals', score: 82 },
      { label: 'Core Values', score: 69 },
      { label: 'Family and Children', score: 72 },
      { label: 'Lifestyle', score: 58 },
      { label: 'Communication', score: 77 },
    ],
    conversationTopics: [
      'How would you want faith or spirituality handled in a relationship?',
      'What role does social drinking play in your lifestyle?',
      'Which values feel non-negotiable to you?',
    ],
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-lauren'),
    initials: 'L',
  },
  {
    id: 'demo-natalie',
    isDemo: true,
    firstName: 'Natalie',
    age: 39,
    location: 'Pueblo, Colorado',
    aboutPreview:
      'Clear about her intentions, values respectful communication, and prefers honest early conversations.',
    alignmentLabel: 'More to Discover',
    confidence: 'High',
    compatibilityIndex: 52,
    compatibilityIndexDisplay: '52',
    strengthsHeading: 'Why you align',
    sharedStrengths: [
      'Both value respectful communication',
      'Both prefer a committed relationship',
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
    cardFactorSummary: 'Potential dealbreaker: Children preferences differ',
    characterSignals: ['Respectful Communicator', 'Clear Intentions'],
    breakdown: [
      { label: 'Relationship Goals', score: 78 },
      { label: 'Core Values', score: 61 },
      { label: 'Family and Children', score: 31 },
      { label: 'Lifestyle', score: 42 },
      { label: 'Communication', score: 75 },
    ],
    conversationTopics: [
      'Are your preferences around children fully settled?',
      'How would smoking affect daily life together?',
      'Which differences are workable, and which are not?',
    ],
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-natalie'),
    initials: 'N',
  },
  {
    id: 'demo-emily',
    isDemo: true,
    firstName: 'Emily',
    age: 37,
    location: 'Boulder, Colorado',
    aboutPreview:
      'Curious about a serious relationship and values clear communication. Several lifestyle answers are still incomplete.',
    alignmentLabel: 'Not Enough Information',
    confidence: 'Low',
    compatibilityIndex: null,
    compatibilityIndexDisplay: 'Not yet available',
    strengthsHeading: 'Known alignment strengths',
    sharedStrengths: [
      'Both appear interested in a serious relationship',
      'Both value communication',
      'Similar geographic region',
    ],
    importantFactors: [],
    noFactorsCopy:
      'Missing information is not treated as negative. Completing more answers would allow Forge to assess alignment responsibly.',
    cardFactorSummary: 'Compatibility assessment not yet available',
    characterSignals: [],
    characterSignalsEmptyCopy: 'No public Character Signals yet',
    breakdown: [
      {
        label: 'Relationship Goals',
        score: null,
        unavailableLabel: 'Incomplete',
      },
      { label: 'Core Values', score: null, unavailableLabel: 'Incomplete' },
      {
        label: 'Family and Children',
        score: null,
        unavailableLabel: 'Not enough information',
      },
      { label: 'Lifestyle', score: null, unavailableLabel: 'Incomplete' },
      {
        label: 'Communication',
        score: null,
        unavailableLabel: 'Partial information',
      },
    ],
    conversationTopics: [
      'What matters most to you in a long-term relationship?',
      'Are there any relationship values you consider non-negotiable?',
      'What would you want a potential partner to understand early?',
    ],
    incompleteAssessmentCopy:
      'Forge does not have enough information to make a responsible compatibility assessment yet.',
    photoUrl: null,
    portraitGradient: stablePortraitGradient('demo-emily'),
    initials: 'E',
  },
];

export function getDemoConnections(): readonly DemoConnection[] {
  return DEMO_CONNECTIONS;
}

export function getDemoConnectionById(id: string): DemoConnection | undefined {
  return DEMO_CONNECTIONS.find((connection) => connection.id === id);
}

export function getDemoAlignmentCategories(): DemoAlignmentCategory[] {
  return Array.from(
    new Set(DEMO_CONNECTIONS.map((connection) => connection.alignmentLabel))
  );
}

/** Map a demo fixture into the live hub card shape for shared portrait/identity UI. */
export function toDemoHubProfileCard(connection: DemoConnection): HubProfileCard {
  return {
    id: connection.id,
    firstName: connection.firstName,
    age: connection.age,
    location: connection.location,
    alignmentLabel: connection.alignmentLabel,
    confidence: connection.confidence,
    hasImportantFactors: connection.importantFactors.length > 0,
    aboutPreview: connection.aboutPreview,
    characterSignals: connection.characterSignals,
    portraitGradient: connection.portraitGradient,
    photoUrl: connection.photoUrl,
  };
}

export function demoConnectionDetailPath(id: string): string {
  return `${DEMO_CONNECTIONS_ROUTE}/${id}`;
}

/** Demo actions are presentation-only — never call Supabase. */
export const DEMO_READ_ONLY_ACTIONS = [
  'view_compatibility',
  'view_demo_profile',
  'navigate_back',
] as const;

export type DemoReadOnlyAction = (typeof DEMO_READ_ONLY_ACTIONS)[number];

export function isDemoWriteActionAllowed(action: string): false {
  void action;
  return false;
}

export function demoFixtureContainsRedFlagLabel(): boolean {
  const blob = JSON.stringify(DEMO_CONNECTIONS).toLowerCase();
  return blob.includes('red flag');
}

export function getPotentialDealbreakerFactors(): DemoAlignmentFactor[] {
  return DEMO_CONNECTIONS.flatMap((connection) =>
    connection.importantFactors.filter((factor) => factor.isPotentialDealbreaker)
  );
}

export function factorSeverityStyles(severity: DemoFactorSeverity): {
  borderClass: string;
  backgroundClass: string;
  badgeClass: string;
  badgeLabel: string;
} {
  switch (severity) {
    case 'potential_dealbreaker':
      return {
        borderClass: 'border-[#D62828]/55',
        backgroundClass: 'bg-[#FBF6EE]',
        badgeClass: 'bg-[#D62828] text-white',
        badgeLabel: 'Potential dealbreaker',
      };
    case 'worth_discussing':
      return {
        borderClass: 'border-[#C4A574]/55',
        backgroundClass: 'bg-[#FBF6EE]',
        badgeClass: 'bg-[#8A7048] text-white',
        badgeLabel: 'Worth discussing',
      };
    case 'informational':
    default:
      return {
        borderClass: 'border-[#0B2D5C]/18',
        backgroundClass: 'bg-[#E8EEF6]/70',
        badgeClass: 'bg-[#0B2D5C] text-white',
        badgeLabel: 'Important difference',
      };
  }
}
