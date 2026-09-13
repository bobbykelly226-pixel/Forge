import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RelationshipPreferencesFields from '../../components/profile/RelationshipPreferencesFields';
import { parseRelationshipPreferences, relationshipGoals } from '../profile/relationship-preferences';
import { RELATIONSHIP_GOAL_OPTIONS } from '../profile/structured-options';
import { collectStructuredPublicProfileDetails } from '../profile/public-labels';
import { isOnboardingContentComplete } from '../types/profile-answers';

test('one checklist supports every nonempty combination and restores all saved selections', () => {
  Object.assign(globalThis, { React });
  const options = RELATIONSHIP_GOAL_OPTIONS.map(option => option.value);
  for (let mask = 0; mask < 32; mask++) {
    const goals = options.filter((_, index) => mask & (1 << index));
    const form = new FormData();
    goals.forEach(goal => form.append('relationship_goals', goal));
    assert.deepEqual(parseRelationshipPreferences(form), goals.length ? goals : null);
    assert.equal(isOnboardingContentComplete({relationship_intention: goals, core_values: ['Faith']}), goals.length > 0);
    const html = renderToStaticMarkup(React.createElement(RelationshipPreferencesFields, { goals }));
    assert.equal((html.match(/type="checkbox"/g) ?? []).length, 5);
    assert.equal((html.match(/checked=""/g) ?? []).length, goals.length);
    assert.equal(html.includes('required=""'), goals.length === 0);
    assert.ok(!html.includes('type="radio"'));
    assert.ok(!html.includes('<select'));
    assert.ok(!html.includes('also open to'));
    for (const goal of options) assert.ok(html.includes(`value="${goal}"`));
  }
});

test('old primary and alternatives become one set without duplicating or losing goals', () => {
  assert.deepEqual(relationshipGoals('marriage', ['serious_relationship', 'marriage']), ['marriage','serious_relationship']);
  assert.deepEqual(relationshipGoals('Dating with intention', ['marriage']), ['marriage','intentional_dating']);
  const rows = collectStructuredPublicProfileDetails({relationship_goal:'marriage', relationship_goals:['marriage','serious_relationship'], relationship_pace:'slowly'});
  assert.equal(rows.find(row => row.label === 'Looking for')?.value, 'Marriage, Long-term relationship');
  assert.ok(!rows.some(row => row.label === 'Also open to' || row.label === 'Relationship pace'));
});

test('selection validation rejects invalid values and deduplicates repeated goals', () => {
  const form = new FormData();
  form.append('relationship_goals','marriage');
  form.append('relationship_goals','marriage');
  assert.deepEqual(parseRelationshipPreferences(form), ['marriage']);
  form.append('relationship_goals','invalid');
  assert.equal(parseRelationshipPreferences(form), null);
});
