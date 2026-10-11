import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DISCOVERY_REQUIREMENTS } from '../profile/discovery-requirements';
import { PROFILE_EDIT_GROUPS, PROFILE_SECTIONS } from '../profile/sections';

test('every Discovery blocker has a distinct, reachable correction destination', () => {
  const requirements = Object.values(DISCOVERY_REQUIREMENTS);
  assert.equal(requirements.length, 4);
  assert.equal(new Set(requirements.map(item => item.id)).size, requirements.length);
  for (const item of requirements) {
    assert.ok(item.label.length > 0);
    if ('section' in item) {
      assert.equal(PROFILE_SECTIONS.find(section => section.id === item.section)?.editable, true);
      assert.equal(PROFILE_EDIT_GROUPS.filter(group => group.sections.includes(item.section)).length, 1);
    } else {
      assert.ok(item.href.startsWith('/'));
    }
  }
  assert.equal(DISCOVERY_REQUIREMENTS.birthdate.section, 'basics');
  assert.equal(DISCOVERY_REQUIREMENTS.location.section, 'location');
  assert.equal(DISCOVERY_REQUIREMENTS.preferences.href, '/discovery?filters=open');
  assert.equal(DISCOVERY_REQUIREMENTS.account.href, '/profile/account');
});
