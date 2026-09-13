import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRelationshipPreferences } from '../profile/relationship-preferences';
import { collectStructuredPublicProfileDetails } from '../profile/public-labels';

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
