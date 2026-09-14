import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RELATIONSHIP_GOAL_OPTIONS, labelForStructuredValue } from '../profile/structured-options';
import { mapLegacyRelationshipGoal } from '../profile/legacy-mapping';
import { isOnboardingContentComplete } from '../types/profile-answers';
import { collectStructuredPublicProfileDetails } from '../profile/public-labels';

test('five approved intentions retain stable legacy values and explanatory copy', () => {
  assert.deepEqual(RELATIONSHIP_GOAL_OPTIONS.map(x => x.label), [
    'Marriage', 'Lifelong partnership', 'Long-term relationship',
    'Dating with intention', 'Getting to know someone',
  ]);
  for (const option of RELATIONSHIP_GOAL_OPTIONS) {
    assert.ok(option.description.length > 20);
    assert.equal(mapLegacyRelationshipGoal(option.value).mapped, option.value);
    assert.equal(isOnboardingContentComplete({relationship_intention: option.value, core_values: ['Faith', 'Family', 'Loyalty']}), true);
  }
  assert.equal(labelForStructuredValue('relationship_goal', 'serious_relationship'), 'Long-term relationship');
  assert.equal(labelForStructuredValue('relationship_goal', 'intentional_dating'), 'Dating with intention');
  assert.equal(mapLegacyRelationshipGoal('Marriage-minded').mapped, 'marriage');
});

test('onboarding rejects arbitrary nonempty intentions', () => {
  for (const answer of ['invalid', '', [], ['marriage', 'invalid']]) {
    assert.equal(isOnboardingContentComplete({relationship_intention: answer, core_values: ['Faith', 'Family', 'Loyalty']}), false);
  }
});

test('public summaries show all selections together without ranking', () => {
  const row = collectStructuredPublicProfileDetails({relationship_goal: 'marriage', relationship_goals: ['intentional_dating', 'marriage']}).find(x => x.label === 'Looking for');
  assert.equal(row?.value, 'Marriage, Dating with intention');
  const legacy = collectStructuredPublicProfileDetails({relationship_goal: null, relationship_goals: ['serious_relationship', 'marriage']}).find(x => x.label === 'Looking for');
  assert.equal(legacy?.value, 'Marriage, Long-term relationship');
});
