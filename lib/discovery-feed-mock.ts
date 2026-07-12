/**
 * Design-only Discovery Feed mock data.
 * No Supabase, matching, scoring, or live discovery.
 */

export type DiscoveryFeedProfile = {
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

export const DISCOVERY_FEED_VIEWER_NAME = 'Bobby';

export const DISCOVERY_FEED_PROFILES: DiscoveryFeedProfile[] = [
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
    id: 'daniel',
    firstName: 'Daniel',
    age: 32,
    location: 'Colorado Springs, Colorado',
    alignmentLabel: 'Strong Alignment',
    confidence: 'High',
    hasImportantFactors: false,
    aboutPreview:
      'Steady, faith-led, and looking for a partnership built on honesty, shared purpose, and everyday kindness.',
    characterSignals: ['Dependable', 'Thoughtful Planner', 'Warm Presence'],
    portraitGradient:
      'linear-gradient(150deg, #243447 0%, #5C6B7A 42%, #B8A48F 78%, #E8DCCF 100%)',
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
      'I love quiet mornings, long walks, and conversations that actually go somewhere. Family is at the center of how I live.',
    characterSignals: ['Empathetic', 'Clear Communicator'],
    portraitGradient:
      'linear-gradient(145deg, #2A4060 0%, #8FA3BC 45%, #D9C4B0 100%)',
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
      'Service-minded and marriage-minded. I am looking for someone who values consistency as much as chemistry.',
    characterSignals: ['Servant Hearted', 'Steady Under Pressure', 'Good Humor'],
    portraitGradient:
      'linear-gradient(155deg, #1F3A5F 0%, #5C7A99 48%, #C5B7A5 100%)',
  },
];
