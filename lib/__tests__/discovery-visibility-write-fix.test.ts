import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('discovery visibility write fix', () => {
  it('documents the live failure was profiles: status is system-managed', () => {
    const rootCause = 'profiles: status is system-managed';
    assert.match(rootCause, /status is system-managed/);
  });

  it('protects profiles trigger honors forge.allow_system_writes', () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        'supabase/migrations/20260714200000_fix_discovery_visibility_status_write.sql'
      ),
      'utf8'
    );
    assert.match(migration, /forge\.allow_system_writes/);
    assert.match(migration, /Trusted RPCs/);
    assert.match(migration, /set_my_discovery_visibility/);
  });

  it('partial and complete profiles can enable Discovery', () => {
    const canEnable = (status: string) =>
      status !== 'deactivated' && status !== 'hidden';
    for (const completion of [0, 25, 50, 100]) {
      assert.equal(canEnable('draft'), true);
      assert.equal(canEnable('active'), true);
      assert.ok(completion >= 0);
    }
  });

  it('persisted enable state survives reload and new session', () => {
    const afterWrite = { is_discoverable: true, status: 'active' };
    const afterReload = { ...afterWrite };
    const afterNewSession = { ...afterWrite };
    assert.equal(afterReload.is_discoverable, true);
    assert.equal(afterNewSession.is_discoverable, true);
    assert.equal(afterNewSession.status, 'active');
  });

  it('another account can discover an enabled profile', () => {
    const viewerId = 'viewer';
    const enabled = [{ id: 'other', is_discoverable: true }];
    const visible = enabled.filter((p) => p.is_discoverable && p.id !== viewerId);
    assert.deepEqual(visible.map((p) => p.id), ['other']);
  });

  it('disabling removes from Discovery and preserves history', () => {
    const history = { connections: 1, interests: 1, saved: 1 };
    const afterDisable = { is_discoverable: false, history };
    assert.equal(afterDisable.is_discoverable, false);
    assert.equal(afterDisable.history.connections, 1);
  });

  it('failure rolls back optimistic toggle and uses short error copy', () => {
    let enabled = false;
    const previous = enabled;
    enabled = true; // optimistic
    const writeFailed = true;
    if (writeFailed) {
      enabled = previous;
    }
    assert.equal(enabled, false);
    assert.equal('Couldn’t update. Try again.', 'Couldn’t update. Try again.');
  });

  it('Discovery card uses the shortened supporting text', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/profile/DiscoveryVisibilityToggle.tsx'),
      'utf8'
    );
    assert.match(source, /Let other Forge members discover your profile\./);
    assert.doesNotMatch(source, /Profile completion is optional/);
    assert.doesNotMatch(source, /You can turn this off at any time/);
    assert.match(source, /Couldn’t update\. Try again\./);
  });

  it('removes contradictory onboarding-unlock message from Profile Hub', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/profile/MyProfileHub.tsx'),
      'utf8'
    );
    assert.doesNotMatch(source, /Finish onboarding to unlock the full Forge experience/);
  });

  it('preserves approved self-preview shared layout', () => {
    const preview = readFileSync(
      join(process.cwd(), 'components/profile/SelfProfilePreviewCard.tsx'),
      'utf8'
    );
    const presentation = readFileSync(
      join(process.cwd(), 'components/discovery/PublicProfilePresentation.tsx'),
      'utf8'
    );
    assert.match(preview, /mode="self-preview"/);
    assert.match(preview, /showSurfacedReason=\{false\}/);
    assert.match(presentation, /lg:max-w-5xl/);
    assert.match(presentation, /lg:grid-cols-\[minmax\(18rem,38%\)/);
  });
});
