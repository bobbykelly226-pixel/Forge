/**
 * Design-only Connections Hub mock data.
 * No Supabase, matching, messaging, or persistent storage.
 */

export type ConnectionProfile = {
  id: string;
  firstName: string;
  age: number;
  location: string;
  alignmentLabel: string;
  confidence: string;
  hasImportantFactors: boolean;
  importantFactorsSummary?: string;
  aboutPreview: string;
  characterSignals: string[];
  portraitGradient: string;
};

export type SentActivityType = 'interested' | 'open_to_chat';
export type SentActivityStatus =
  | 'pending'
  | 'awaiting_mutual'
  | 'accepted'
  | 'expired'
  | 'no_longer_active';

export type SentActivityEntry = {
  id: string;
  profileId: string;
  type: SentActivityType;
  status: SentActivityStatus;
  statusLabel: string;
  relativeTime: string;
  canWithdraw: boolean;
};

export const CONNECTIONS_TAB_COUNTS = {
  forYou: 3,
  openToChat: 2,
  mutual: 1,
  saved: 4,
  sent: 3,
} as const;

export const OPEN_TO_CHAT_REQUESTS: ConnectionProfile[] = [
  {
    id: 'jessica',
    firstName: 'Jessica',
    age: 29,
    location: 'Denver, Colorado',
    alignmentLabel: 'Promising Alignment',
    confidence: 'Moderate',
    hasImportantFactors: true,
    importantFactorsSummary: 'One important life preference may differ.',
    aboutPreview:
      'I am grounded, family-oriented, and happiest when I am building a meaningful life with the people I care about.',
    characterSignals: ['Respectful Communicator', 'Good Listener', 'Genuine and Present'],
    portraitGradient:
      'linear-gradient(160deg, #1B2F4A 0%, #3E566F 38%, #A8927D 72%, #E6D5C3 100%)',
  },
  {
    id: 'maria',
    firstName: 'Maria',
    age: 31,
    location: 'Boulder, Colorado',
    alignmentLabel: 'Growing Alignment',
    confidence: 'Emerging',
    hasImportantFactors: true,
    importantFactorsSummary: 'Faith practices may need a closer conversation.',
    aboutPreview:
      'I love quiet mornings, long walks, and conversations that actually go somewhere.',
    characterSignals: ['Empathetic', 'Clear Communicator'],
    portraitGradient:
      'linear-gradient(145deg, #2A4060 0%, #8FA3BC 45%, #D9C4B0 100%)',
  },
];

export const INTEREST_RECEIVED: ConnectionProfile[] = [
  {
    id: 'ashley',
    firstName: 'Ashley',
    age: 31,
    location: 'Aurora, Colorado',
    alignmentLabel: 'Promising Alignment',
    confidence: 'Moderate',
    hasImportantFactors: false,
    aboutPreview:
      'Family-oriented and looking for someone who values faith, honesty, and showing up consistently.',
    characterSignals: ['Warm Presence', 'Good Listener'],
    portraitGradient:
      'linear-gradient(150deg, #3D2C29 0%, #A67C6D 50%, #E8D5C4 100%)',
  },
];

export const MUTUAL_CONNECTIONS: ConnectionProfile[] = [
  {
    id: 'jessica',
    firstName: 'Jessica',
    age: 29,
    location: 'Denver, Colorado',
    alignmentLabel: 'Promising Alignment',
    confidence: 'Moderate',
    hasImportantFactors: true,
    aboutPreview:
      'I am grounded, family-oriented, and happiest when I am building a meaningful life with the people I care about.',
    characterSignals: ['Respectful Communicator', 'Good Listener', 'Genuine and Present'],
    portraitGradient:
      'linear-gradient(160deg, #1B2F4A 0%, #3E566F 38%, #A8927D 72%, #E6D5C3 100%)',
  },
];

export const SAVED_PROFILES: ConnectionProfile[] = [
  {
    id: 'daniel',
    firstName: 'Daniel',
    age: 32,
    location: 'Colorado Springs, Colorado',
    alignmentLabel: 'Strong Alignment',
    confidence: 'High',
    hasImportantFactors: false,
    aboutPreview:
      'Steady, faith-led, and looking for a partnership built on honesty and shared purpose.',
    characterSignals: ['Dependable', 'Thoughtful Planner'],
    portraitGradient:
      'linear-gradient(150deg, #243447 0%, #5C6B7A 42%, #B8A48F 78%, #E8DCCF 100%)',
  },
  {
    id: 'james',
    firstName: 'James',
    age: 34,
    location: 'Fort Collins, Colorado',
    alignmentLabel: 'Promising Alignment',
    confidence: 'Moderate',
    hasImportantFactors: false,
    aboutPreview:
      'Service-minded and marriage-minded. I value consistency as much as chemistry.',
    characterSignals: ['Servant Hearted', 'Good Humor'],
    portraitGradient:
      'linear-gradient(155deg, #1F3A5F 0%, #5C7A99 48%, #C5B7A5 100%)',
  },
  {
    id: 'maria',
    firstName: 'Maria',
    age: 31,
    location: 'Boulder, Colorado',
    alignmentLabel: 'Growing Alignment',
    confidence: 'Emerging',
    hasImportantFactors: true,
    importantFactorsSummary: 'Faith practices may need a closer conversation.',
    aboutPreview:
      'I love quiet mornings, long walks, and conversations that actually go somewhere.',
    characterSignals: ['Empathetic', 'Clear Communicator'],
    portraitGradient:
      'linear-gradient(145deg, #2A4060 0%, #8FA3BC 45%, #D9C4B0 100%)',
  },
  {
    id: 'ashley',
    firstName: 'Ashley',
    age: 31,
    location: 'Aurora, Colorado',
    alignmentLabel: 'Promising Alignment',
    confidence: 'Moderate',
    hasImportantFactors: false,
    aboutPreview:
      'Family-oriented and looking for someone who values faith, honesty, and showing up consistently.',
    characterSignals: ['Warm Presence', 'Good Listener'],
    portraitGradient:
      'linear-gradient(150deg, #3D2C29 0%, #A67C6D 50%, #E8D5C4 100%)',
  },
];

export const SENT_ACTIVITY: SentActivityEntry[] = [
  {
    id: 'sent-jessica-o2c',
    profileId: 'jessica',
    type: 'open_to_chat',
    status: 'pending',
    statusLabel: 'Pending',
    relativeTime: '2 days ago',
    canWithdraw: true,
  },
  {
    id: 'sent-ashley-int',
    profileId: 'ashley',
    type: 'interested',
    status: 'awaiting_mutual',
    statusLabel: 'Awaiting mutual interest',
    relativeTime: '4 days ago',
    canWithdraw: true,
  },
  {
    id: 'sent-morgan-o2c',
    profileId: 'morgan',
    type: 'open_to_chat',
    status: 'accepted',
    statusLabel: 'Accepted',
    relativeTime: '1 week ago',
    canWithdraw: false,
  },
];

export const SENT_PROFILE_LOOKUP: Record<string, ConnectionProfile> = {
  jessica: OPEN_TO_CHAT_REQUESTS[0],
  ashley: INTEREST_RECEIVED[0],
  morgan: {
    id: 'morgan',
    firstName: 'Morgan',
    age: 30,
    location: 'Denver, Colorado',
    alignmentLabel: 'Strong Alignment',
    confidence: 'High',
    hasImportantFactors: false,
    aboutPreview: 'Looking for a thoughtful partnership rooted in shared values.',
    characterSignals: ['Clear Communicator', 'Dependable'],
    portraitGradient:
      'linear-gradient(145deg, #243447 0%, #6B7F8F 42%, #C9B8A6 100%)',
  },
};

export function getProfileById(id: string): ConnectionProfile | undefined {
  const all = [
    ...OPEN_TO_CHAT_REQUESTS,
    ...INTEREST_RECEIVED,
    ...MUTUAL_CONNECTIONS,
    ...SAVED_PROFILES,
    ...Object.values(SENT_PROFILE_LOOKUP),
  ];
  return all.find((p) => p.id === id);
}
