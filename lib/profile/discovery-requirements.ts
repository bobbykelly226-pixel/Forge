export const DISCOVERY_REQUIREMENTS = {
  account: {
    id: 'account',
    label: 'Reactivate this account before entering Discovery.',
    href: '/profile/account',
  },
  birthdate: {
    id: 'birthdate',
    label: 'Add a valid adult date of birth.',
    section: 'basics',
  },
  preferences: {
    id: 'preferences',
    label: 'Complete who you are looking for, the age range, and the distance range.',
    href: '/discovery?filters=open',
  },
  location: {
    id: 'location',
    label: 'Save your private matching location.',
    section: 'location',
  },
} as const;

export type DiscoveryRequirement = typeof DISCOVERY_REQUIREMENTS[keyof typeof DISCOVERY_REQUIREMENTS];
