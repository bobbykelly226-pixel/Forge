import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRelationshipPreferences } from '../profile/relationship-preferences';
import { collectStructuredPublicProfileDetails } from '../profile/public-labels';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RelationshipPreferencesFields from '../../components/profile/RelationshipPreferencesFields';
import { RELATIONSHIP_GOAL_OPTIONS } from '../profile/structured-options';

test('all five primary choices remain available when reopening any saved answer', () => {
  Object.assign(globalThis, { React });
  for (const primary of ['', ...RELATIONSHIP_GOAL_OPTIONS.map(option => option.value)]) {
    const html = renderToStaticMarkup(React.createElement(RelationshipPreferencesFields, { primary }));
    assert.equal((html.match(/type="radio"/g) ?? []).length, 5);
    for (const option of RELATIONSHIP_GOAL_OPTIONS) {
      assert.ok(html.includes(`value="${option.value}"`), `${option.value} missing for ${primary}`);
      const form = new FormData();
      form.set('relationship_goal', option.value);
      assert.equal(parseRelationshipPreferences(form)?.primary, option.value);
    }
    assert.ok(!html.includes('Your previous answer is preserved'));
  }
});

test('marriage with long-term flexibility and a slow pace are independent preferences', () => {
  const form = new FormData();
  form.set('relationship_goal', 'marriage');
  form.append('relationship_also_open_to', 'serious_relationship');
  form.append('relationship_also_open_to', 'marriage');
  form.append('relationship_also_open_to', 'serious_relationship');
  form.set('relationship_pace', 'slowly');
  assert.deepEqual(parseRelationshipPreferences(form), {primary: 'marriage', also: ['serious_relationship'], pace: 'slowly'});
  const rows = collectStructuredPublicProfileDetails({relationship_goal: 'marriage', relationship_goals: ['marriage','serious_relationship'], relationship_pace: 'slowly'});
  assert.equal(rows.find(x => x.label === 'Looking for')?.value, 'Marriage');
  assert.equal(rows.find(x => x.label === 'Also open to')?.value, 'Long-term relationship');
  assert.equal(rows.find(x => x.label === 'Relationship pace')?.value, 'Move slowly and build trust');
});
test('optional preferences clear and invalid values fail validation', () => {
  const form = new FormData(); form.set('relationship_goal','lifelong_partnership');
  assert.deepEqual(parseRelationshipPreferences(form), {primary:'lifelong_partnership',also:[],pace:null});
  form.set('relationship_pace','invalid'); assert.equal(parseRelationshipPreferences(form),null);
  form.delete('relationship_pace'); form.append('relationship_also_open_to','invalid'); assert.equal(parseRelationshipPreferences(form),null);
});
