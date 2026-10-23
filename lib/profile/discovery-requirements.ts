export const DISCOVERY_REQUIREMENTS = {
  photo: { id: 'photo', label: 'Add a photo and wait for Forge photo approval.', section: 'photo' },
  intention: { id: 'intention', label: 'Choose what you are looking for in a relationship.', section: 'relationship' },
  about: { id: 'about', label: 'Write a short About section.', section: 'about' },
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
