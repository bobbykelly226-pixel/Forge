import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  isBetaSeedAccessAllowed,
  parseSeedQueryParam,
  isSeedProfileId,
} from '../lib/seed/access';
import {
  getSeedProfiles,
  getSeedMutualConnectionProfiles,
} from '../lib/seed/catalog';
import {
  injectSeedDiscoveryProfiles,
  shouldInjectSeedDiscoveryForRequest,
} from '../lib/seed/inject-discovery';
import {
  injectSeedConnections,
  shouldInjectSeedConnectionsForRequest,
  countRealMutualConnections,
} from '../lib/seed/inject-connections';
import {
  toSeedPublicDiscoveryProfile,
  toSeedAlignmentPresentation,
  toSeedMutualConnectionItem,
} from '../lib/seed/adapters';
import {
  createResetSeedDiscoveryActionState,
  shouldSimulateDiscoveryAction,
  resetAllSeedState,
} from '../lib/seed/actions';

console.log('=== WALKTHROUGH VERIFICATION ===');

assert.equal(
  isBetaSeedAccessAllowed({ NODE_ENV: 'production', VERCEL_ENV: 'production' }),
  false
);
assert.equal(
  shouldInjectSeedDiscoveryForRequest({
    realCandidateCount: 0,
    env: { NODE_ENV: 'production', VERCEL_ENV: 'production' },
  }),
  false
);
assert.equal(
  shouldInjectSeedConnectionsForRequest({
    realMutualCount: 0,
    env: { NODE_ENV: 'production', VERCEL_ENV: 'production' },
  }),
  false
);
console.log('✓ production blocked');

assert.equal(
  shouldInjectSeedDiscoveryForRequest({
    realCandidateCount: 0,
    env: { NODE_ENV: 'production', VERCEL_ENV: 'preview' },
  }),
  true
);
assert.equal(
  shouldInjectSeedDiscoveryForRequest({
    realCandidateCount: 3,
    env: { NODE_ENV: 'production', VERCEL_ENV: 'preview' },
  }),
  false
);
console.log('✓ empty-state auto-inject / skip when real candidates exist');

const force = parseSeedQueryParam('1');
const disable = parseSeedQueryParam('0');
assert.equal(force.forceSeed && force.showReset, true);
assert.equal(disable.disableSeed, true);
assert.equal(
  shouldInjectSeedDiscoveryForRequest({
    realCandidateCount: 5,
    forceSeed: true,
    env: { VERCEL_ENV: 'preview' },
  }),
  true
);
assert.equal(
  shouldInjectSeedDiscoveryForRequest({
    realCandidateCount: 0,
    disableSeed: true,
    env: { VERCEL_ENV: 'preview' },
  }),
  false
);
console.log('✓ ?seed=1 force and ?seed=0 disable');

const cards = injectSeedDiscoveryProfiles([]);
assert.equal(cards.length, 40);
assert.ok(cards.every((c) => isSeedProfileId(c.id)));
assert.ok(cards.every((c) => c.photoUrl && c.photoUrl.startsWith('/seed-portraits/')));
console.log('✓ Discovery injects 40 seed cards with portraits');

const hub = injectSeedConnections({
  viewerFirstName: 'Bobby',
  openToChat: [],
  interestReceived: [],
  mutual: [],
  saved: [],
  sent: [],
  educationSeen: true,
  tabCounts: { forYou: 0, openToChat: 0, mutual: 0, saved: 0, sent: 0 },
});
assert.equal(hub.mutual.length, 10);
assert.equal(countRealMutualConnections(hub), 0);
console.log('✓ Connections injects 10 mutuals');

let featuredGalleries = 0;
for (const p of getSeedProfiles()) {
  const pub = toSeedPublicDiscoveryProfile(p);
  const align = toSeedAlignmentPresentation(p);
  assert.ok(
    [
      'Strong Alignment',
      'Promising Alignment',
      'More to Discover',
      'Not Enough Information',
    ].includes(align.alignmentLabel)
  );
  assert.ok(pub.photos && pub.photos.length === p.photoFiles.length);
  for (const file of p.photoFiles) {
    assert.ok(existsSync(join(process.cwd(), 'public/seed-portraits', file)), file);
  }
  if (p.photoFiles.length >= 3) featuredGalleries += 1;
  assert.equal(shouldSimulateDiscoveryAction(p.id), true);
}
assert.equal(featuredGalleries, 12);
console.log('✓ profile galleries, alignment, and simulated actions');

const reset = createResetSeedDiscoveryActionState();
assert.equal(Object.keys(reset).length, 40);
resetAllSeedState();
console.log('✓ reset seed state helpers');

for (const m of getSeedMutualConnectionProfiles()) {
  const item = toSeedMutualConnectionItem(m);
  assert.ok(item.connectionId.startsWith('seed-connection-'));
  assert.ok(item.photoUrl);
}
console.log('✓ mutual connection cards');

console.log('=== ALL WALKTHROUGH CHECKS PASSED ===');
