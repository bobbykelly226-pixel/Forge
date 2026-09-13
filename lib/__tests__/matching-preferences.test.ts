import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

import {
  INTERESTED_IN_OPTIONS,
  MIN_MATCH_AGE,
  MAX_MATCH_AGE,
  getInterestedInSelections,
  matchingPreferencesAreComplete,
  toggleInterestedInSelection,
  validateMatchingPreferences,
  type MatchingPreferencesInput,
} from '../profile/matching-preferences';

const valid = {
  genderIdentity: 'woman',
  interestedIn: ['man'],
  preferredAgeMin: 30,
  preferredAgeMax: 50,
  maxDistanceMiles: 75,
};

describe('matching preference validation', () => {
  it('uses labeled native age selectors on Profile instead of number inputs', () => {
    const source = readFileSync(new URL('../../components/profile/MatchingPreferencesCard.tsx', import.meta.url), 'utf8');
    for (const bound of ['minimumAge', 'maximumAge']) {
      assert.match(source, new RegExp(`<select\\s+value=\\{${bound}\\}`));
    }
    assert.doesNotMatch(source, /type="number"/);
    assert.match(source, /length: MAX_MATCH_AGE - MIN_MATCH_AGE \+ 1/);
    assert.match(source, /MIN_MATCH_AGE \+ index/);
  });

  it('accepts every supported picker age without changing it and rejects reversed bounds', () => {
    for (let age = MIN_MATCH_AGE; age <= MAX_MATCH_AGE; age++) {
      const result = validateMatchingPreferences({ ...valid, preferredAgeMin: age, preferredAgeMax: age });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.preferredAgeMin, age);
        assert.equal(result.value.preferredAgeMax, age);
      }
    }
    assert.equal(validateMatchingPreferences({ ...valid, preferredAgeMin: MAX_MATCH_AGE, preferredAgeMax: MIN_MATCH_AGE }).ok, false);
  });

  it('accepts complete bounded preferences', () => {
    assert.equal(validateMatchingPreferences(valid).ok, true);
  });

  it('requires Male or Female and at least one supported interest choice', () => {
    assert.equal(validateMatchingPreferences({ ...valid, genderIdentity: '' }).ok, false);
    assert.equal(validateMatchingPreferences({ ...valid, interestedIn: [] }).ok, false);
    assert.equal(
      validateMatchingPreferences({ ...valid, genderIdentity: 'nonbinary' }).ok,
      false
    );
    assert.equal(
      validateMatchingPreferences({ ...valid, genderIdentity: 'another_identity' }).ok,
      false
    );
    assert.equal(
      validateMatchingPreferences({ ...valid, interestedIn: ['nonbinary'] }).ok,
      false
    );
  });

  it('presents only the two independent member-facing choices', () => {
    assert.deepEqual(INTERESTED_IN_OPTIONS, [
      { value: 'man', label: 'Men' },
      { value: 'woman', label: 'Women' },
    ]);
  });

  it('saves and restores each selection through the existing database representation', () => {
    for (const [selected, stored] of [
      [['man'], ['man']],
      [['woman'], ['woman']],
      [['man', 'woman'], ['everyone']],
      [['woman', 'man'], ['everyone']],
    ]) {
      const result = validateMatchingPreferences({ ...valid, interestedIn: selected });
      assert.equal(result.ok, true);
      assert.deepEqual(result.value.interestedIn, stored);
      assert.deepEqual(getInterestedInSelections(result.value.interestedIn), [...selected].sort());
    }
  });

  it('restores a legacy combined preference without exposing its internal value', () => {
    const selected = getInterestedInSelections(['everyone']);
    assert.deepEqual(selected, ['man', 'woman']);
    const result = validateMatchingPreferences({ ...valid, interestedIn: ['everyone'] });
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.value.interestedIn, ['everyone']);
  });

  it('toggles either selection independently and saves the remaining choice', () => {
    const men = toggleInterestedInSelection([], 'man');
    const selected = toggleInterestedInSelection(men, 'woman');
    assert.deepEqual(selected, ['man', 'woman']);
    assert.deepEqual(toggleInterestedInSelection(selected, 'man'), ['woman']);
    assert.deepEqual(toggleInterestedInSelection(selected, 'woman'), ['man']);
    const remaining = toggleInterestedInSelection(getInterestedInSelections(['everyone']), 'man');
    const result = validateMatchingPreferences({ ...valid, interestedIn: remaining });
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.value.interestedIn, ['woman']);
    assert.deepEqual(men, ['man'], 'toggling does not mutate the prior state');
  });

  it('clearing the final selection produces required-field validation', () => {
    const selected = toggleInterestedInSelection(['man'], 'man');
    assert.deepEqual(selected, []);
    assert.deepEqual(validateMatchingPreferences({ ...valid, interestedIn: selected }), {
      ok: false,
      message: 'Select at least one option: Men or Women.',
    });
  });

  it('fails closed for unsupported or mixed legacy preferences', () => {
    for (const interestedIn of [
      ['man', 'unknown'], ['everyone', 'man'], ['everyone', 'woman'],
      ['both'], [''], ['man', ''],
    ]) {
      assert.deepEqual(getInterestedInSelections(interestedIn), []);
      assert.equal(validateMatchingPreferences({ ...valid, interestedIn }).ok, false);
    }
    assert.deepEqual(getInterestedInSelections(null), []);
    assert.deepEqual(getInterestedInSelections(undefined), []);
  });

  it('rejects malformed server-action input without throwing', () => {
    for (const interestedIn of [null, 'man', [null], [1], [{}]]) {
      assert.equal(validateMatchingPreferences({
        ...valid, interestedIn,
      } as unknown as MatchingPreferencesInput).ok, false);
    }
  });

  it('normalizes duplicate selections before storage', () => {
    const result = validateMatchingPreferences({
      ...valid, interestedIn: ['woman', 'man', 'woman'],
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.value.interestedIn, ['everyone']);
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
