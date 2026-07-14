import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  mapLegacyDrinking,
  mapLegacyEducation,
  mapLegacyHasChildren,
  mapLegacyPets,
  mapLegacyRelationshipGoal,
  mapLegacyRelocation,
  mapLegacyServiceBackground,
  mapLegacySmoking,
  mapLegacyWantsChildren,
  mapLegacyFaithImportance,
} from '../profile/legacy-mapping';
import {
  DRINKING_OPTIONS,
  EDUCATION_OPTIONS,
  FAITH_IDENTITY_OPTIONS,
  FAITH_IMPORTANCE_OPTIONS,
  HAS_CHILDREN_OPTIONS,
  PETS_OPTIONS,
  PREFER_NOT_TO_SAY,
  RELATIONSHIP_GOAL_OPTIONS,
  RELOCATION_OPTIONS,
  SERVICE_BACKGROUND_OPTIONS,
  SMOKING_OPTIONS,
  WANTS_CHILDREN_OPTIONS,
  isValidStructuredValue,
  normalizeServiceBackgroundSelection,
  serviceBackgroundDisplayLabel,
} from '../profile/structured-options';
import {
  collectStructuredPublicProfileDetails,
  publicLocationLabel,
} from '../profile/public-labels';
import {
  formatPublicLocation,
  parseLegacyLocationText,
  toPublicLocationFields,
} from '../profile/location-format';
import { countsTowardCompletion } from '../profile-completion';
import { DISCOVERABLE_PROFILE_COLUMNS, PRIVATE_OR_ADMIN_PROFILE_COLUMNS } from '../data-model-rules';
import { mapOpenMeteoResult } from '../location/geocode';

describe('structured option catalogs', () => {
  it('maps every structured option value as valid', () => {
    for (const option of RELATIONSHIP_GOAL_OPTIONS) {
      assert.equal(isValidStructuredValue('relationship_goal', option.value), true);
    }
    for (const option of SMOKING_OPTIONS) {
      assert.equal(isValidStructuredValue('smoking', option.value), true);
    }
    for (const option of DRINKING_OPTIONS) {
      assert.equal(isValidStructuredValue('drinking', option.value), true);
    }
    for (const option of EDUCATION_OPTIONS) {
      assert.equal(isValidStructuredValue('education', option.value), true);
    }
    for (const option of PETS_OPTIONS) {
      assert.equal(isValidStructuredValue('pets', option.value), true);
    }
    for (const option of RELOCATION_OPTIONS) {
      assert.equal(isValidStructuredValue('relocation', option.value), true);
    }
    for (const option of FAITH_IDENTITY_OPTIONS) {
      assert.equal(isValidStructuredValue('faith_identity', option.value), true);
    }
    for (const option of FAITH_IMPORTANCE_OPTIONS) {
      assert.equal(isValidStructuredValue('faith_importance', option.value), true);
    }
    for (const option of HAS_CHILDREN_OPTIONS) {
      assert.equal(isValidStructuredValue('has_children', option.value), true);
    }
    for (const option of WANTS_CHILDREN_OPTIONS) {
      assert.equal(isValidStructuredValue('children', option.value), true);
    }
    for (const option of SERVICE_BACKGROUND_OPTIONS) {
      assert.equal(isValidStructuredValue('service_background', option.value), true);
    }
  });

  it('treats prefer-not-to-say as a valid answered choice', () => {
    assert.equal(countsTowardCompletion(PREFER_NOT_TO_SAY), true);
    assert.equal(countsTowardCompletion(null), false);
    assert.equal(countsTowardCompletion(''), false);
  });
});

describe('legacy value migration', () => {
  it('maps known legacy values and preserves ambiguous ones', () => {
    assert.equal(mapLegacyRelationshipGoal('Marriage')?.mapped, 'marriage');
    assert.equal(mapLegacyRelationshipGoal('Marriage-minded')?.mapped, 'marriage');
    assert.equal(mapLegacySmoking('Never')?.mapped, 'never');
    assert.equal(mapLegacyPets('No')?.mapped, 'no_pets');
    assert.equal(mapLegacyHasChildren('yes')?.mapped, 'yes');
    assert.equal(mapLegacyWantsChildren('yes')?.mapped, 'yes');
    assert.equal(mapLegacyRelocation('no')?.mapped, 'not_open');
    assert.equal(mapLegacyFaithImportance('Very important')?.mapped, 'very_important');

    const drinking = mapLegacyDrinking('Yes');
    assert.equal(drinking.mapped, null);
    assert.equal(drinking.unmapped, 'Yes');

    const education = mapLegacyEducation('College');
    assert.equal(education.mapped, null);
    assert.equal(education.unmapped, 'College');
  });

  it('maps multi service backgrounds without inventing career links', () => {
    const result = mapLegacyServiceBackground('EMT, Police, Nurse');
    assert.deepEqual(result.mapped.sort(), [
      'fire_ems',
      'healthcare',
      'law_enforcement',
    ]);
    assert.equal(result.unmapped, null);
  });
});

describe('children conditional concepts', () => {
  it('keeps has / wants / openness distinct', () => {
    const details = collectStructuredPublicProfileDetails({
      has_children: 'yes',
      children_count: '2',
      children: 'open',
      open_to_partner_with_children: 'yes',
    });
    assert.ok(details.some((row) => row.value === 'Has 2 children'));
    assert.ok(details.some((row) => row.value === 'Open to children'));
    assert.ok(
      details.some((row) => row.value === 'Open to a partner who has children')
    );
  });
});

describe('faith identity and importance remain distinct', () => {
  it('shows identity separately from importance', () => {
    const details = collectStructuredPublicProfileDetails({
      faith_identity: 'catholic',
      faith_importance: 'very_important',
    });
    assert.ok(details.some((row) => row.label === 'Faith' && row.value === 'Catholic'));
    assert.ok(
      details.some(
        (row) => row.label === 'Faith in daily life' && row.value === 'Faith is very important'
      )
    );
  });
});

describe('service background multi-select', () => {
  it('allows multiple service choices and formats a public label', () => {
    const normalized = normalizeServiceBackgroundSelection([
      'healthcare',
      'fire_ems',
      'healthcare',
    ]);
    assert.deepEqual([...normalized].sort(), ['fire_ems', 'healthcare']);
    assert.equal(
      serviceBackgroundDisplayLabel(normalized),
      'Healthcare and Fire or EMS background'
    );
  });

  it('makes none and prefer-not-to-say exclusive', () => {
    assert.deepEqual(normalizeServiceBackgroundSelection(['military', 'none']), ['none']);
    assert.deepEqual(
      normalizeServiceBackgroundSelection(['military', PREFER_NOT_TO_SAY]),
      [PREFER_NOT_TO_SAY]
    );
  });
});

describe('career remains free text', () => {
  it('passes career through public presentation unchanged', () => {
    const details = collectStructuredPublicProfileDetails({
      career: 'Pediatric nurse',
    });
    assert.deepEqual(details, [{ label: 'Career', value: 'Pediatric nurse' }]);
  });
});

describe('location standardization and privacy', () => {
  it('formats city/state publicly and parses legacy text', () => {
    assert.equal(formatPublicLocation({ city: 'Denver', region: 'Colorado' }), 'Denver, CO');
    assert.deepEqual(parseLegacyLocationText('Lakewood, CO'), {
      city: 'Lakewood',
      region: 'CO',
      country: 'US',
    });

    const publicFields = toPublicLocationFields({
      city: 'Denver',
      region: 'CO',
      country: 'US',
      postalCode: '80202',
      latitude: 39.7392,
      longitude: -104.9903,
      placeId: 'place-1',
      provider: 'open-meteo',
    });
    assert.equal(publicFields.location, 'Denver, CO');
    assert.equal(publicFields.location_city, 'Denver');
    assert.doesNotMatch(publicFields.location ?? '', /80202|39\.|104\./);
  });

  it('never exposes postal or coordinates through discoverable columns', () => {
    for (const privateField of [
      'postal_code',
      'latitude',
      'longitude',
      'location_place_id',
      'location_provider',
      'unmapped_legacy_fields',
    ]) {
      assert.equal(
        (DISCOVERABLE_PROFILE_COLUMNS as readonly string[]).includes(privateField),
        false
      );
      assert.ok(
        (PRIVATE_OR_ADMIN_PROFILE_COLUMNS as readonly string[]).includes(privateField)
      );
    }
  });

  it('maps open-meteo results into standardized location hits', () => {
    const mapped = mapOpenMeteoResult({
      id: 1,
      name: 'Denver',
      latitude: 39.74,
      longitude: -104.99,
      country_code: 'US',
      country: 'United States',
      admin1: 'Colorado',
      postcodes: ['80202'],
    });
    assert.equal(mapped?.city, 'Denver');
    assert.equal(mapped?.region, 'CO');
    assert.equal(mapped?.postalCode, '80202');
    assert.equal(mapped?.label, 'Denver, CO');
  });

  it('builds public location labels from structured city/region', () => {
    assert.equal(
      publicLocationLabel({
        location_city: 'Denver',
        location_region: 'CO',
        location: 'should-not-win',
      }),
      'Denver, CO'
    );
  });
});

describe('public labels omit raw enums and prefer-not-to-say', () => {
  it('never shows raw slugs or prefer-not-to-say publicly', () => {
    const details = collectStructuredPublicProfileDetails({
      smoking: 'never',
      drinking: PREFER_NOT_TO_SAY,
      pets: 'no_pets',
      relocation: null,
    });
    const blob = JSON.stringify(details);
    assert.equal(details.some((row) => row.value === 'Never smokes'), true);
    assert.doesNotMatch(blob, /prefer_not_to_say|never(?!\ssmokes)/i);
    assert.equal(
      details.some((row) => /prefer not to say/i.test(row.value)),
      false
    );
  });

  it('omits empty sections', () => {
    assert.deepEqual(collectStructuredPublicProfileDetails({}), []);
  });
});

describe('partial profiles remain valid', () => {
  it('allows unanswered structured fields', () => {
    assert.equal(mapLegacySmoking(null).mapped, null);
    assert.equal(mapLegacySmoking(null).unmapped, null);
    assert.equal(mapLegacySmoking('').mapped, null);
    assert.equal(isValidStructuredValue('smoking', ''), false);
  });
});
