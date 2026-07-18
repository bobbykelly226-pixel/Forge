import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  derivePetsTypesFromLegacyIdentity,
  normalizeDrinkingPartnerPreferences,
  normalizePetTypeSelection,
  normalizePetsIdentity,
  normalizePetsPartnerPreferences,
  normalizeSmokingPartnerPreferences,
  normalizeSmokingProductSelection,
  smokingUsesProducts,
} from '../profile/lifestyle-compatibility';
import {
  DRINKING_OPTIONS,
  PETS_OPTIONS,
  isValidStructuredValue,
} from '../profile/structured-options';
import { mapLegacyDrinking, mapLegacyPets } from '../profile/legacy-mapping';
import { collectStructuredPublicProfileDetails } from '../profile/public-labels';
import { DISCOVERABLE_PROFILE_COLUMNS, OWNER_EDITABLE_PROFILE_COLUMNS } from '../data-model-rules';

describe('lifestyle compatibility catalogs', () => {
  it('uses yes/no pets identity and rarely drinking', () => {
    assert.deepEqual(
      PETS_OPTIONS.map((option) => option.value),
      ['yes', 'no', 'prefer_not_to_say']
    );
    assert.equal(isValidStructuredValue('pets', 'yes'), true);
    assert.equal(isValidStructuredValue('pets', 'dog'), true); // legacy accepted
    assert.equal(isValidStructuredValue('drinking', 'rarely'), true);
    assert.equal(isValidStructuredValue('drinking', 'occasionally'), true); // legacy accepted
    assert.ok(DRINKING_OPTIONS.some((option) => option.value === 'rarely'));
  });

  it('maps legacy pets and drinking into the new identity model', () => {
    assert.equal(mapLegacyPets('No')?.mapped, 'no');
    assert.equal(mapLegacyPets('Dog')?.mapped, 'yes');
    assert.equal(mapLegacyDrinking('occasionally')?.mapped, 'rarely');
    assert.equal(mapLegacyDrinking('rarely')?.mapped, 'rarely');
  });

  it('normalizes pets identity and derives types from legacy singles', () => {
    assert.equal(normalizePetsIdentity('no_pets'), 'no');
    assert.equal(normalizePetsIdentity('dog'), 'yes');
    assert.deepEqual(derivePetsTypesFromLegacyIdentity('dog', []), ['dogs']);
    assert.deepEqual(derivePetsTypesFromLegacyIdentity('yes', ['cats', 'dogs']), [
      'cats',
      'dogs',
    ]);
  });

  it('keeps partner openness multi-selects distinct and exclusive for open/not sure', () => {
    assert.deepEqual(normalizePetTypeSelection(['dogs', 'cats', 'dogs']), ['dogs', 'cats']);
    assert.deepEqual(
      normalizePetsPartnerPreferences(['has_dogs', 'open_to_any', 'has_cats']),
      ['open_to_any']
    );
    assert.deepEqual(
      normalizeSmokingProductSelection(['cigarettes', 'cannabis', 'vape']),
      ['cigarettes', 'cannabis', 'vape']
    );
    assert.deepEqual(
      normalizeSmokingPartnerPreferences([
        'cigarettes_occasionally',
        'cannabis_regularly',
        'not_sure',
      ]),
      ['not_sure']
    );
    assert.deepEqual(
      normalizeDrinkingPartnerPreferences(['drinks_socially', 'does_not_drink']),
      ['drinks_socially', 'does_not_drink']
    );
    assert.equal(smokingUsesProducts('never'), false);
    assert.equal(smokingUsesProducts('regularly'), true);
  });

  it('keeps partner preference columns owner-private and pets_types discoverable', () => {
    assert.ok(DISCOVERABLE_PROFILE_COLUMNS.includes('pets_types'));
    assert.equal(
      (DISCOVERABLE_PROFILE_COLUMNS as readonly string[]).includes(
        'pets_partner_preferences'
      ),
      false
    );
    assert.equal(
      (DISCOVERABLE_PROFILE_COLUMNS as readonly string[]).includes(
        'smoking_partner_preferences'
      ),
      false
    );
    assert.ok(OWNER_EDITABLE_PROFILE_COLUMNS.includes('pets_partner_preferences'));
    assert.ok(OWNER_EDITABLE_PROFILE_COLUMNS.includes('smoking_product_types'));
    assert.ok(OWNER_EDITABLE_PROFILE_COLUMNS.includes('drinking_partner_preferences'));
    assert.ok(OWNER_EDITABLE_PROFILE_COLUMNS.includes('pets_allergy_constraint'));
  });

  it('publishes warm pets/drinking labels without exposing partner prefs', () => {
    const rows = collectStructuredPublicProfileDetails({
      pets: 'yes',
      pets_types: ['dogs', 'cats'],
      drinking: 'rarely',
      smoking: 'never',
    });
    const pets = rows.find((row) => row.label === 'Pets');
    const drinking = rows.find((row) => row.label === 'Drinking');
    assert.equal(pets?.value, 'Has pets · Dogs and Cats');
    assert.equal(drinking?.value, 'Drinks rarely');
  });
});

describe('lifestyle compatibility UI wiring', () => {
  it('wires progressive lifestyle fields into Profile Workspace sections', () => {
    const workspace = readFileSync(
      join(process.cwd(), 'components/profile/ProfileWorkspace.tsx'),
      'utf8'
    );
    const fields = readFileSync(
      join(process.cwd(), 'components/profile/LifestyleCompatibilityFields.tsx'),
      'utf8'
    );
    const actions = readFileSync(join(process.cwd(), 'app/actions/profile.ts'), 'utf8');
    const migration = readFileSync(
      join(
        process.cwd(),
        'supabase/migrations/20260718200000_lifestyle_compatibility_fields.sql'
      ),
      'utf8'
    );

    assert.match(workspace, /PetsFields/);
    assert.match(workspace, /SmokingFields/);
    assert.match(workspace, /DrinkingFields/);
    assert.match(fields, /Do you currently have pets\?/);
    assert.match(fields, /Pet allergies affect what I can live with/);
    assert.match(fields, /Your own habits do not determine your answer here/);
    assert.match(fields, /smoking_product_types/);
    assert.match(fields, /drinking_partner_preferences/);
    assert.match(actions, /readLifestylePetsFields/);
    assert.match(actions, /readLifestyleSmokingFields/);
    assert.match(actions, /readLifestyleDrinkingFields/);
    assert.match(migration, /pets_partner_preferences/);
    assert.match(migration, /smoking_product_types/);
    assert.match(migration, /drinking_partner_preferences/);
    assert.match(migration, /pets_allergy_constraint/);
  });
});
