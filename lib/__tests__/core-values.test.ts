import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CoreValuesFields from '../../components/profile/CoreValuesFields';
import { CORE_VALUES_OPTIONS, normalizeCoreValues, validCoreValues, toggleCoreValue } from '../profile/core-values';
import { deriveOnboardingStep, isOnboardingContentComplete } from '../types/profile-answers';

test('values allow every 3–5 combination, reject other counts and malformed answers', () => {
  for (let mask = 0; mask < 4096; mask++) {
    const values = CORE_VALUES_OPTIONS.filter((_, i) => mask & (1 << i));
    assert.equal(validCoreValues(values), values.length >= 3 && values.length <= 5);
    assert.equal(isOnboardingContentComplete({ relationship_intention: ['marriage'], core_values: values }), validCoreValues(values));
  }
  for (const value of [null, 'Faith', ['Faith', 'Family', 'Unknown'], ['Faith', 'Faith', 'Family']]) assert.equal(validCoreValues(value), false);
});
test('legacy capitalization normalizes without truncating existing eight choices', () => {
  const legacy = ['Faith', 'Family', 'Communication', 'Emotional maturity', 'Loyalty', 'Shared goals', 'Service', 'Growth'];
  assert.deepEqual(normalizeCoreValues(legacy), ['Faith', 'Family', 'Communication', 'Emotional Maturity', 'Loyalty', 'Shared Goals', 'Service', 'Growth']);
  const next = toggleCoreValue(legacy, 'Integrity');
  assert.equal(next, legacy);
  assert.equal(toggleCoreValue(legacy, 'Faith').length, 7);
});
test('a sixth choice is non-destructive and a deselected choice can be selected again', () => {
  const five = CORE_VALUES_OPTIONS.slice(0, 5);
  assert.equal(toggleCoreValue(five, 'Growth'), five);
  const four = toggleCoreValue(five, 'Faith');
  assert.deepEqual(toggleCoreValue(four, 'Faith'), five);
  assert.equal(toggleCoreValue(four, 'Growth').length, 5);
});
test('completed members stay complete while unfinished invalid values return to the values step', () => {
  const input = { onboardingCompleted: true, savedStep: 'readiness', answers: { relationship_intention: 'marriage', core_values: ['Faith'] }, hasAdultDateOfBirth: true, hasMatchingPreferences: true };
  assert.equal(deriveOnboardingStep(input), 'readiness');
  assert.equal(deriveOnboardingStep({ ...input, onboardingCompleted: false }), 'values');
});
test('editor always renders twelve labeled checkboxes and preserves legacy selections', () => {
  const html = renderToStaticMarkup(createElement(CoreValuesFields, { initialValues: ['Faith', 'Family', 'Communication', 'Emotional maturity', 'Loyalty', 'Shared goals', 'Service', 'Growth'] }));
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 12);
  assert.equal((html.match(/checked=""/g) ?? []).length, 8);
  assert.match(html, /8 selected/);
  assert.match(html, /Your saved choices are preserved/);
  assert.match(html, /lg:grid-cols-3/);
});
