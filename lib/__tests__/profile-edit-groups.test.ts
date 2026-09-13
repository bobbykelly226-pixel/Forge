import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_EDIT_GROUPS, PROFILE_SECTIONS } from '../profile/sections';

test('grouped Profile keeps every available editor exactly once and omits unavailable introductions', () => {
  const ids = PROFILE_EDIT_GROUPS.flatMap(group => group.sections);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), PROFILE_SECTIONS.filter(section => section.editable && !section.comingSoon).map(section => section.id).sort());
  assert.deepEqual(PROFILE_EDIT_GROUPS.map(group => group.title), ['Profile basics', 'Values & lifestyle', 'Life & plans', 'Interests']);
  for (const topic of ['children', 'pets', 'smoking', 'drinking', 'music']) assert.equal(ids.filter(id => id === topic).length, 1);
});
