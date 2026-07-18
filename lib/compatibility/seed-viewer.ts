/**
 * Demo viewer used when evaluating seed Discovery profiles.
 * Keeps seed fixtures isolated from live Supabase profiles.
 */

import type { SeedCompatibilityFields } from './inputs';

/**
 * Stable demo viewer representing a typical intentional Forge member.
 * Seed partner fixtures are authored relative to this baseline so outcomes vary.
 */
export const SEED_DEMO_VIEWER: SeedCompatibilityFields = {
  id: 'seed-demo-viewer',
  firstName: 'You',
  relationshipGoal: 'serious_relationship',
  faithImportance: 'important',
  faithIdentity: 'christian',
  children: 'open',
  hasChildren: 'no',
  openToPartnerWithChildren: 'yes',
  pets: 'yes',
  petsTypes: ['dogs'],
  petsPartnerPreferences: ['has_dogs', 'has_cats', 'has_no_pets', 'open_to_any'],
  petsAllergyConstraint: false,
  petsAllergyTypes: [],
  smoking: 'never',
  smokingPartnerPreferences: ['does_not_use', 'trying_to_quit'],
  drinking: 'rarely',
  drinkingPartnerPreferences: [
    'does_not_drink',
    'drinks_rarely',
    'drinks_socially',
  ],
  coreValues: ['Faith', 'Family', 'Communication', 'Loyalty', 'Shared goals'],
};
