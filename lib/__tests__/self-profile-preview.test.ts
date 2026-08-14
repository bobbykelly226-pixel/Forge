import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { selfPreviewHasVisibleContent } from '../profile/self-preview';

describe('self profile preview visibility', () => {
  it('renders the profile after onboarding when derived age is the only visible field', () => {
    assert.equal(selfPreviewHasVisibleContent({ age: 42 }), true);
  });

  it('renders the profile when onboarding saved a relationship intention', () => {
    assert.equal(
      selfPreviewHasVisibleContent({ relationship_goal: 'Long-term relationship' }),
      true
    );
  });

  it('keeps the empty state for a genuinely blank profile', () => {
    assert.equal(
      selfPreviewHasVisibleContent({
        full_name: '   ',
        age: null,
        relationship_goal: null,
        things_i_enjoy: [],
        photos: [],
      }),
      false
    );
  });
});
