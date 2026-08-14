import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  matchingPreferencesAreComplete,
  validateMatchingPreferences,
} from '../profile/matching-preferences';

const valid = {
  genderIdentity: 'woman',
  interestedIn: ['man'],
  preferredAgeMin: 30,
  preferredAgeMax: 50,
  maxDistanceMiles: 75,
};

describe('matching preference validation', () => {
  it('accepts complete bounded preferences', () => {
    assert.equal(validateMatchingPreferences(valid).ok, true);
  });

  it('requires a supported identity and at least one interest', () => {
    assert.equal(validateMatchingPreferences({ ...valid, genderIdentity: '' }).ok, false);
    assert.equal(validateMatchingPreferences({ ...valid, interestedIn: [] }).ok, false);
  });

  it('does not combine everyone with narrower selections', () => {
    assert.equal(
      validateMatchingPreferences({ ...valid, interestedIn: ['everyone', 'man'] }).ok,
      false
    );
  });

  it('enforces age ordering and safe distance bounds', () => {
    assert.equal(validateMatchingPreferences({ ...valid, preferredAgeMin: 17 }).ok, false);
    assert.equal(
      validateMatchingPreferences({ ...valid, preferredAgeMin: 51, preferredAgeMax: 50 }).ok,
      false
    );
    assert.equal(validateMatchingPreferences({ ...valid, maxDistanceMiles: 501 }).ok, false);
  });

  it('detects complete persisted preferences', () => {
    assert.equal(
      matchingPreferencesAreComplete({
        gender_identity: 'woman',
        interested_in: ['everyone'],
        preferred_age_min: 18,
        preferred_age_max: 100,
        max_distance_miles: 500,
      }),
      true
    );
  });
});
