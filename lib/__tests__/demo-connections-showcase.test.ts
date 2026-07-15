import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  canInjectSampleConnections,
  describeDemoAccessDecision,
  isDemoProfileId,
  isInternalDemoAccessAllowed,
} from '../demo/demo-access';
import {
  buildSampleMutualConnections,
  countRealMutualConnections,
  hubContainsSampleConnections,
  injectSampleConnections,
  SAMPLE_CONNECTIONS_BANNER,
  shouldInjectSampleConnectionsForRequest,
  stripSampleConnections,
} from '../demo/inject-sample-connections';
import {
  getSampleConnectionById,
  getSampleConnections,
  sampleFixtureContainsRedFlagLabel,
  sampleFixturesHaveNumericScores,
  toSampleAlignmentPresentation,
  toSampleHubProfileCard,
  toSamplePublicDiscoveryProfile,
} from '../demo/sample-connections';
import type { ConnectionsHubData } from '../data/connections-hub';

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

describe('sample connections access control', () => {
  it('allows sample injection in development and preview', () => {
    assert.equal(isInternalDemoAccessAllowed({ NODE_ENV: 'development' }), true);
    assert.equal(
      canInjectSampleConnections({ NODE_ENV: 'production', VERCEL_ENV: 'preview' }),
      true
    );
  });

  it('blocks sample injection in production without the explicit flag', () => {
    assert.equal(
      isInternalDemoAccessAllowed({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      }),
      false
    );
    assert.equal(
      describeDemoAccessDecision({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      }).reason,
      'production_blocked'
    );
    assert.equal(
      shouldInjectSampleConnectionsForRequest({
        realMutualCount: 0,
        env: { NODE_ENV: 'production', VERCEL_ENV: 'production' },
      }),
      false
    );
  });

  it('auto-injects when preview has zero real mutual connections', () => {
    assert.equal(
      shouldInjectSampleConnectionsForRequest({
        realMutualCount: 0,
        env: { NODE_ENV: 'production', VERCEL_ENV: 'preview' },
      }),
      true
    );
    assert.equal(
      shouldInjectSampleConnectionsForRequest({
        realMutualCount: 2,
        env: { NODE_ENV: 'production', VERCEL_ENV: 'preview' },
      }),
      false
    );
    assert.equal(
      shouldInjectSampleConnectionsForRequest({
        realMutualCount: 2,
        forceDemoQuery: true,
        env: { NODE_ENV: 'development' },
      }),
      true
    );
  });
});

describe('sample connections injection into real Connections hub', () => {
  it('injects five sample mutual connections into ConnectionsHubData', () => {
    const injected = injectSampleConnections(emptyHub());
    assert.equal(injected.mutual.length, 5);
    assert.equal(injected.tabCounts.mutual, 5);
    assert.ok(hubContainsSampleConnections(injected));
    assert.equal(countRealMutualConnections(injected.mutual), 0);
    assert.ok(injected.mutual.every((item) => isDemoProfileId(item.id)));
  });

  it('keeps real mutuals separate and untouched when injecting', () => {
    const hub = emptyHub();
    hub.mutual = [
      {
        id: 'real-user-1',
        connectionId: 'conn-1',
        source: 'mutual_interest',
        relativeTime: '2 days ago',
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
      },
    ];
    hub.tabCounts.mutual = 1;
    const injected = injectSampleConnections(hub);
    assert.equal(countRealMutualConnections(injected.mutual), 1);
    assert.equal(injected.mutual.length, 6);
    assert.ok(injected.mutual.some((item) => item.id === 'real-user-1'));
    const stripped = stripSampleConnections(injected);
    assert.equal(stripped.mutual.length, 1);
    assert.equal(stripped.mutual[0]?.id, 'real-user-1');
  });

  it('maps samples into the production hub card shape used by MutualConnectionCard', () => {
    const samples = buildSampleMutualConnections();
    assert.equal(samples.length, 5);
    for (const sample of samples) {
      assert.equal(typeof sample.alignmentLabel, 'string');
      assert.equal(sample.confidence, '—');
      assert.ok(Array.isArray(sample.characterSignals));
      assert.equal(sample.source, 'mutual_interest');
    }
    const connectionsPage = read('app/connections/page.tsx');
    const hub = read('components/connections/ConnectionsHubPrototype.tsx');
    const cards = read('components/connections/ConnectionCards.tsx');
    assert.match(connectionsPage, /injectSampleConnections/);
    assert.match(connectionsPage, /ConnectionsHubPrototype/);
    assert.match(hub, /MutualConnectionCard/);
    assert.match(hub, /SAMPLE_CONNECTIONS_BANNER/);
    assert.match(hub, /Hide sample connections/);
    assert.match(cards, /MutualConnectionCard/);
    assert.match(cards, /isDemoProfileId/);
    assert.match(cards, /View Profile/);
    assert.doesNotMatch(cards, /View Compatibility/);
    assert.doesNotMatch(hub, /DemoConnectionsHub/);
  });
});

describe('sample profile fixtures and real profile path', () => {
  it('exposes the five required demo profile ids', () => {
    const ids = getSampleConnections().map((c) => c.id);
    assert.deepEqual(ids, [
      'demo-jessica',
      'demo-megan',
      'demo-lauren',
      'demo-natalie',
      'demo-emily',
    ]);
  });

  it('resolves demo ids through fixture adapters only', () => {
    const discoveryAction = read('app/actions/discovery.ts');
    assert.match(discoveryAction, /isDemoProfileId/);
    assert.match(discoveryAction, /getSampleConnectionById/);
    assert.match(discoveryAction, /toSamplePublicDiscoveryProfile/);
    assert.match(discoveryAction, /Preview-only sample profiles/);
    const demoBranch = discoveryAction.split('isDemoProfileId(profileId)')[1] ?? '';
    assert.doesNotMatch(demoBranch.slice(0, 500), /getDiscoveryProfile\(/);

    const jessica = getSampleConnectionById('demo-jessica');
    assert.ok(jessica);
    const profile = toSamplePublicDiscoveryProfile(jessica);
    assert.equal(profile.id, 'demo-jessica');
    assert.equal(profile.full_name, 'Jessica');
    assert.equal(profile.location_city, 'Colorado Springs');
  });

  it('renders Relationship Alignment, factors, and Character Signals qualitatively', () => {
    const jessica = getSampleConnectionById('demo-jessica');
    const megan = getSampleConnectionById('demo-megan');
    const lauren = getSampleConnectionById('demo-lauren');
    const natalie = getSampleConnectionById('demo-natalie');
    const emily = getSampleConnectionById('demo-emily');
    assert.ok(jessica && megan && lauren && natalie && emily);

    assert.equal(jessica.alignmentLabel, 'Strong Alignment');
    assert.equal(jessica.importantFactors.length, 0);
    assert.ok(jessica.characterSignals.includes('Respectful Communicator'));

    assert.equal(megan.alignmentLabel, 'Promising Alignment');
    assert.match(megan.importantFactors[0]?.explanation ?? '', /worth discussing/i);

    assert.equal(lauren.alignmentLabel, 'More to Discover');
    assert.ok(lauren.importantFactors.some((f) => f.title.includes('Faith')));

    assert.equal(natalie.alignmentLabel, 'More to Discover');
    assert.ok(natalie.importantFactors.some((f) => f.isPotentialDealbreaker));
    assert.match(natalie.importantFactorsSummary ?? '', /Potential dealbreaker/i);

    assert.equal(emily.alignmentLabel, 'Not Enough Information');
    assert.match(
      emily.incompleteAssessmentCopy ?? '',
      /responsible Relationship Alignment assessment/i
    );

    const presentation = toSampleAlignmentPresentation(megan);
    assert.equal(presentation.alignmentLabel, 'Promising Alignment');
    assert.ok(presentation.sharedStrengths.length >= 1);

    const profileView = read('components/discovery/DiscoveryProfileView.tsx');
    const publicPresentation = read('components/discovery/PublicProfilePresentation.tsx');
    const alignmentSections = read('components/discovery/ProfileAlignmentSections.tsx');
    assert.match(profileView, /PublicProfilePresentation/);
    assert.match(profileView, /toSampleAlignmentPresentation/);
    assert.match(publicPresentation, /alignmentPresentation/);
    assert.match(alignmentSections, /AlignmentDetailsDrawer/);
    assert.match(alignmentSections, /ImportantAlignmentFactorsDrawer/);
    assert.match(alignmentSections, /PublicCharacterSignalsSection/);
  });

  it('does not include Compatibility Index or numeric scores', () => {
    assert.equal(sampleFixturesHaveNumericScores(), false);
    for (const connection of getSampleConnections()) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(connection, 'compatibilityIndex'),
        false
      );
      assert.equal(Object.prototype.hasOwnProperty.call(connection, 'breakdown'), false);
    }
    const uiSources = [
      read('components/discovery/ProfileAlignmentSections.tsx'),
      read('components/connections/ConnectionCards.tsx'),
      read('components/discovery/PublicProfilePresentation.tsx'),
      read('components/discovery/DiscoveryProfileView.tsx'),
    ].join('\n');
    assert.doesNotMatch(uiSources, /Compatibility Index/i);
    assert.doesNotMatch(uiSources, /score:\s*\d/);
  });

  it('never labels a person a red flag', () => {
    assert.equal(sampleFixtureContainsRedFlagLabel(), false);
    const sources = [
      read('lib/demo/sample-connections.ts'),
      read('components/ImportantAlignmentFactorsDrawer.tsx'),
      read('docs/DEMO_CONNECTIONS_SHOWCASE.md'),
    ].join('\n');
    assert.doesNotMatch(sources, /is a red flag/i);
  });
});

describe('sample connections safety and retired showcase', () => {
  it('does not create fake auth users or Supabase writes from fixtures', () => {
    const sampleLib = read('lib/demo/sample-connections.ts');
    const injectLib = read('lib/demo/inject-sample-connections.ts');
    const combined = `${sampleLib}\n${injectLib}`;
    assert.doesNotMatch(combined, /auth\.admin/);
    assert.doesNotMatch(combined, /signUp\(/);
    assert.doesNotMatch(combined, /\.insert\(/);
    assert.doesNotMatch(combined, /\.upsert\(/);
    assert.doesNotMatch(combined, /createClient\(/);
  });

  it('keeps messaging and relationship-write actions disabled for demo ids', () => {
    const cards = read('components/connections/ConnectionCards.tsx');
    const profileView = read('components/discovery/DiscoveryProfileView.tsx');
    assert.match(cards, /Start Conversation · Demo only/);
    assert.match(profileView, /Demo only/);
    assert.match(profileView, /isDemo/);
  });

  it('retires the custom internal showcase design', () => {
    const internal = read('app/internal/demo-connections/page.tsx');
    assert.match(internal, /redirect\('\/connections\?demo=1'\)/);
    assert.match(internal, /notFound/);
    assert.doesNotMatch(internal, /DemoConnectionsHub/);
    assert.doesNotMatch(internal, /Compatibility Index/);

    let customShowcaseGone = false;
    try {
      read('components/demo/DemoConnectionsHub.tsx');
    } catch {
      customShowcaseGone = true;
    }
    assert.equal(customShowcaseGone, true);
  });

  it('documents the injection approach and banner copy', () => {
    const docs = read('docs/DEMO_CONNECTIONS_SHOWCASE.md');
    assert.match(docs, /inject/i);
    assert.match(docs, /\/connections/);
    assert.equal(
      SAMPLE_CONNECTIONS_BANNER,
      'Sample connections are shown for product preview. No live member data is affected.'
    );
    assert.match(docs, /Sample connections are shown for product preview/);
  });

  it('keeps mobile-friendly contracts on reused cards and profile presentation', () => {
    const cards = read('components/connections/ConnectionCards.tsx');
    const presentation = read('components/discovery/PublicProfilePresentation.tsx');
    assert.match(cards, /flex-col/);
    assert.match(presentation, /max-w-lg[\s\S]*lg:max-w-5xl/);
    assert.doesNotMatch(cards, /overflow-x-scroll/);
  });

  it('maps hub cards without inventing numeric confidence', () => {
    const jessica = getSampleConnectionById('demo-jessica');
    assert.ok(jessica);
    const card = toSampleHubProfileCard(jessica);
    assert.equal(card.confidence, '—');
    assert.equal(card.alignmentLabel, 'Strong Alignment');
    assert.equal(card.hasImportantFactors, false);
  });
});
