import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  canInjectSeedData,
  describeSeedAccessDecision,
  isBetaSeedAccessAllowed,
  isSeedProfileId,
  parseSeedQueryParam,
} from '../seed/access';
import {
  seedFixtureContainsRedFlagLabel,
  seedFixturesHaveNumericScores,
} from '../seed/adapters';
import {
  getSeedDiscoveryProfiles,
  getSeedMutualConnectionProfiles,
  getSeedProfiles,
} from '../seed/catalog';
import {
  countRealMutualConnections,
  injectSeedConnections,
  shouldInjectSeedConnectionsForRequest,
} from '../seed/inject-connections';
import {
  countRealDiscoveryCandidates,
  injectSeedDiscoveryProfiles,
  shouldInjectSeedDiscoveryForRequest,
} from '../seed/inject-discovery';
import type { ConnectionsHubData } from '../data/connections-hub';
import type { DiscoveryFeedCardModel } from '../discovery/presentation';

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

function emptyHub(): ConnectionsHubData {
  return {
    viewerFirstName: 'Bobby',
    openToChat: [],
    interestReceived: [],
    mutual: [],
    saved: [],
    sent: [],
    educationSeen: true,
    tabCounts: { forYou: 0, openToChat: 0, mutual: 0, saved: 0, sent: 0 },
  };
}

describe('beta seed catalog', () => {
  it('has 40 profiles: 20 women, 20 men, 10 mutuals', () => {
    const profiles = getSeedProfiles();
    assert.equal(profiles.length, 40);
    assert.equal(getSeedDiscoveryProfiles().length, 40);
    assert.equal(
      profiles.filter((profile) => profile.gender === 'woman').length,
      20
    );
    assert.equal(
      profiles.filter((profile) => profile.gender === 'man').length,
      20
    );
    assert.equal(getSeedMutualConnectionProfiles().length, 10);
  });

  it('uses seed- profile ids', () => {
    for (const profile of getSeedProfiles()) {
      assert.ok(profile.id.startsWith('seed-'), profile.id);
      assert.ok(isSeedProfileId(profile.id));
    }
  });

  it('has no red flag labels or numeric scores', () => {
    assert.equal(seedFixtureContainsRedFlagLabel(), false);
    assert.equal(seedFixturesHaveNumericScores(), false);
  });

  it('references only portrait files that exist on disk', () => {
    const { existsSync } = require('node:fs') as typeof import('node:fs');
    const profiles = getSeedProfiles();
    let multi = 0;
    for (const profile of profiles) {
      assert.ok(profile.photoFiles.length >= 1, profile.id);
      assert.ok(profile.photoFiles[0]?.endsWith('-1.png'), profile.id);
      for (const file of profile.photoFiles) {
        assert.ok(
          existsSync(join(root, 'public/seed-portraits', file)),
          `${profile.id} missing ${file}`
        );
      }
      if (profile.photoFiles.length >= 3) multi += 1;
    }
    assert.equal(multi, 12);
  });
});

describe('beta seed access control', () => {
  it('allows injection in development and preview', () => {
    assert.equal(isBetaSeedAccessAllowed({ NODE_ENV: 'development' }), true);
    assert.equal(
      canInjectSeedData({ NODE_ENV: 'production', VERCEL_ENV: 'preview' }),
      true
    );
  });

  it('blocks injection in production without an explicit flag', () => {
    assert.equal(
      isBetaSeedAccessAllowed({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      }),
      false
    );
    assert.equal(
      describeSeedAccessDecision({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      }).reason,
      'production_blocked'
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
  });

  it('honors ?seed=1 force and ?seed=0 disable', () => {
    assert.deepEqual(parseSeedQueryParam('1'), {
      forceSeed: true,
      disableSeed: false,
      showReset: true,
    });
    assert.deepEqual(parseSeedQueryParam('0'), {
      forceSeed: false,
      disableSeed: true,
      showReset: false,
    });

    assert.equal(
      shouldInjectSeedDiscoveryForRequest({
        realCandidateCount: 3,
        forceSeed: true,
        env: { NODE_ENV: 'development' },
      }),
      true
    );
    assert.equal(
      shouldInjectSeedDiscoveryForRequest({
        realCandidateCount: 0,
        disableSeed: true,
        env: { NODE_ENV: 'development' },
      }),
      false
    );
    assert.equal(
      shouldInjectSeedConnectionsForRequest({
        realMutualCount: 2,
        forceSeed: true,
        env: { NODE_ENV: 'development' },
      }),
      true
    );
    assert.equal(
      shouldInjectSeedConnectionsForRequest({
        realMutualCount: 0,
        disableSeed: true,
        env: { NODE_ENV: 'development' },
      }),
      false
    );
  });
});

describe('beta seed injection', () => {
  it('injects 40 discovery cards and 10 mutual connections', () => {
    const discovery = injectSeedDiscoveryProfiles([]);
    assert.equal(discovery.length, 40);
    assert.equal(countRealDiscoveryCandidates(discovery), 0);
    assert.ok(discovery.every((card) => isSeedProfileId(card.id)));

    const hub = injectSeedConnections(emptyHub());
    assert.equal(hub.mutual.length, 10);
    assert.equal(countRealMutualConnections(hub), 0);
    assert.ok(hub.mutual.every((item) => isSeedProfileId(item.id)));
  });

  it('keeps real candidates and counts them via hub data', () => {
    const real: DiscoveryFeedCardModel = {
      id: 'real-candidate-1',
      firstName: 'Real',
      age: 40,
      location: 'Denver, Colorado',
      alignmentLabel: 'More to Discover',
      confidence: '—',
      hasImportantFactors: false,
      aboutPreview: null,
      characterSignals: [],
      portraitGradient: 'linear-gradient(#000,#fff)',
      photoUrl: null,
    };
    const discovery = injectSeedDiscoveryProfiles([real]);
    assert.equal(countRealDiscoveryCandidates(discovery), 1);
    assert.equal(discovery.length, 41);

    const withReal = emptyHub();
    withReal.mutual = [
      {
        id: 'real-mutual-1',
        firstName: 'Real',
        age: 38,
        location: 'Austin, Texas',
        alignmentLabel: 'Promising Alignment',
        confidence: '—',
        hasImportantFactors: false,
        aboutPreview: null,
        characterSignals: [],
        portraitGradient: 'linear-gradient(#000,#fff)',
        photoUrl: null,
        connectionId: 'conn-real-1',
        source: 'mutual_interest',
        relativeTime: 'Recently',
      },
    ];
    assert.equal(countRealMutualConnections(withReal), 1);
    const injected = injectSeedConnections(withReal);
    assert.equal(countRealMutualConnections(injected), 1);
    assert.equal(injected.mutual.length, 11);
  });
});

describe('beta seed UI wiring', () => {
  it('wires Discovery and Connections pages to seed modules', () => {
    const discoveryPage = read('app/discovery/page.tsx');
    const connectionsPage = read('app/connections/page.tsx');
    const feed = read('components/DiscoveryFeedPrototype.tsx');
    const hub = read('components/connections/ConnectionsHubPrototype.tsx');
    const cards = read('components/connections/ConnectionCards.tsx');
    const profileView = read('components/discovery/DiscoveryProfileView.tsx');
    const provider = read('components/discovery/DiscoveryActionsProvider.tsx');
    const discoveryAction = read('app/actions/discovery.ts');
    const internal = read('app/internal/demo-connections/page.tsx');

    assert.match(discoveryPage, /@\/lib\/seed\/inject-discovery/);
    assert.match(discoveryPage, /parseSeedQueryParam/);
    assert.match(discoveryPage, /seedProfilesInjected/);
    assert.match(discoveryPage, /showSeedReset/);
    assert.match(connectionsPage, /@\/lib\/seed\/inject-connections/);
    assert.match(connectionsPage, /countRealMutualConnections\(initialData\)/);
    assert.match(connectionsPage, /seedConnectionsInjected/);
    assert.match(discoveryAction, /getSeedProfileById/);
    assert.match(discoveryAction, /canInjectSeedData/);
    assert.match(discoveryAction, /isSeedProfileId/);
    assert.match(internal, /\/connections\?seed=1/);

    assert.doesNotMatch(feed, /SAMPLE_DISCOVERY_BANNER|Hide sample profiles|demo|sample|fake/i);
    assert.doesNotMatch(hub, /SAMPLE_CONNECTIONS_BANNER|Hide sample connections/i);
    assert.match(feed, /Reset Seed State/);
    assert.match(hub, /Reset Seed State/);
    assert.match(feed, /showSeedReset/);
    assert.match(hub, /showSeedReset/);

    assert.match(cards, /isSeedProfileId/);
    assert.match(cards, /Start Conversation/);
    assert.doesNotMatch(cards, /Demo only/i);

    assert.match(profileView, /toSeedAlignmentPresentation/);
    assert.match(profileView, /getSeedProfileById/);
    assert.doesNotMatch(profileView, /Sample preview|Demo only/i);

    assert.match(provider, /@\/lib\/seed\/actions/);
    assert.match(provider, /resetSeedState/);
    assert.doesNotMatch(provider, /Sample preview/i);
    assert.match(provider, /Seed state was reset/);
  });

  it('documents the seed system without user-facing demo banners', () => {
    const docs = read('docs/BETA_SEED_DATA.md');
    assert.match(docs, /\?seed=1/);
    assert.match(docs, /\?seed=0/);
    assert.match(docs, /40/);
    assert.match(docs, /lib\/seed\//);
    assert.doesNotMatch(docs, /Hide sample/);
  });

  it('no longer depends on lib/demo', () => {
    const sources = [
      read('app/discovery/page.tsx'),
      read('app/connections/page.tsx'),
      read('app/actions/discovery.ts'),
      read('components/DiscoveryFeedPrototype.tsx'),
      read('components/connections/ConnectionsHubPrototype.tsx'),
      read('components/connections/ConnectionCards.tsx'),
      read('components/discovery/DiscoveryProfileView.tsx'),
      read('components/discovery/DiscoveryActionsProvider.tsx'),
      read('components/discovery/ProfileAlignmentSections.tsx'),
    ];
    for (const source of sources) {
      assert.doesNotMatch(source, /@\/lib\/demo/);
    }
  });
});
