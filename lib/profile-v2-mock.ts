/**
 * Design-only Profile V2 mock data.
 * No Supabase, Spotify, recording, subscriptions, or persistence.
 */

export type EnjoymentChip = {
  id: string;
  label: string;
  icon:
    | 'trophy'
    | 'tent'
    | 'coffee'
    | 'plane'
    | 'paw'
    | 'dice'
    | 'book'
    | 'dumbbell';
};

export type MusicList = {
  artists: string[];
  songs: string[];
};

export type ProfileHubCompletionItem = {
  id: string;
  label: string;
  complete: boolean;
};

export type ProfileHubCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  comingSoon?: boolean;
  icon:
    | 'photos'
    | 'about'
    | 'alignment'
    | 'factors'
    | 'enjoy'
    | 'music'
    | 'signals'
    | 'voice'
    | 'video'
    | 'privacy'
    | 'subscription';
};

/** Public Discovery Profile — Jessica */
export const DISCOVERY_THINGS_I_ENJOY: EnjoymentChip[] = [
  { id: 'broncos', icon: 'trophy', label: 'Broncos' },
  { id: 'camping', icon: 'tent', label: 'Camping' },
  { id: 'coffee', icon: 'coffee', label: 'Coffee Shops' },
  { id: 'trips', icon: 'plane', label: 'Weekend Trips' },
  { id: 'dogs', icon: 'paw', label: 'Dogs' },
  { id: 'games', icon: 'dice', label: 'Board Games' },
  { id: 'reading', icon: 'book', label: 'Reading' },
  { id: 'fitness', icon: 'dumbbell', label: 'Fitness' },
];

export const DISCOVERY_FAVORITE_MUSIC: MusicList = {
  artists: ['Zach Bryan', 'Chris Stapleton', 'Cody Johnson'],
  songs: ['Heading South', 'Tennessee Whiskey', 'Something in the Orange'],
};

/** My Profile Hub — current user prototype */
export const MY_PROFILE_HUB = {
  firstName: 'Bobby',
  location: 'Denver, Colorado',
  completionPercent: 87,
  portraitGradient:
    'linear-gradient(160deg, #1B2F4A 0%, #3E566F 38%, #A8927D 72%, #E6D5C3 100%)',
} as const;

export const MY_PROFILE_COMPLETION: ProfileHubCompletionItem[] = [
  { id: 'photos', label: 'Add photos', complete: true },
  { id: 'about', label: 'Write About Me', complete: true },
  { id: 'alignment', label: 'Relationship Alignment', complete: true },
  { id: 'factors', label: 'Important Alignment Factors', complete: true },
  { id: 'voice', label: 'Add Voice Introduction', complete: false },
  { id: 'music', label: 'Favorite Music', complete: false },
  { id: 'enjoy', label: 'Things I Enjoy', complete: false },
];

export const MY_PROFILE_SECTION_CARDS: ProfileHubCard[] = [
  {
    id: 'photos',
    title: 'Photos',
    description: 'Show who you are with clear, recent photos.',
    href: '#photos',
    icon: 'photos',
  },
  {
    id: 'about',
    title: 'About Me',
    description: 'Share the story of who you are.',
    href: '#about',
    icon: 'about',
  },
  {
    id: 'alignment',
    title: 'Relationship Alignment',
    description: 'Describe the kind of relationship you want.',
    href: '#alignment',
    icon: 'alignment',
  },
  {
    id: 'factors',
    title: 'Important Alignment Factors',
    description: 'Highlight what matters most to you.',
    href: '#factors',
    icon: 'factors',
  },
  {
    id: 'enjoy',
    title: 'Things I Enjoy',
    description: 'Add the activities and interests that energize you.',
    href: '#enjoy',
    icon: 'enjoy',
  },
  {
    id: 'music',
    title: 'Favorite Music',
    description: 'A few artists and songs that fit your vibe.',
    href: '#music',
    icon: 'music',
  },
  {
    id: 'signals',
    title: 'Character Signals',
    description: 'Manage which positive qualities appear on your profile.',
    href: '/character-signals',
    icon: 'signals',
  },
  {
    id: 'voice',
    title: 'Voice Introduction',
    description: 'Record a short introduction in your own words.',
    href: '#voice',
    icon: 'voice',
    comingSoon: true,
  },
  {
    id: 'video',
    title: 'Video Introduction',
    description: 'Share a short video that shows your personality.',
    href: '#video',
    icon: 'video',
    comingSoon: true,
  },
  {
    id: 'privacy',
    title: 'Privacy',
    description: 'Control what others can see about you.',
    href: '#privacy',
    icon: 'privacy',
  },
  {
    id: 'subscription',
    title: 'Subscription',
    description: 'Forge Premium features and membership.',
    href: '#subscription',
    icon: 'subscription',
    comingSoon: true,
  },
];
