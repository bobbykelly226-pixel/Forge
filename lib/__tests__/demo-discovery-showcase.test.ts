import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  canInjectSampleDiscovery,
  isDemoDiscoveryProfileId,
  isInternalDemoAccessAllowed,
} from '../demo/demo-access';
import {
  clearSampleDiscoveryActionStateSession,
  createResetSampleDiscoveryActionState,
  mergeResetSampleDiscoveryActions,
  readSampleDiscoveryActionStateFromSession,
  SAMPLE_DISCOVERY_ACTION_STORAGE_KEY,
  shouldSimulateDiscoveryAction,
  writeSampleDiscoveryActionStateToSession,
} from '../demo/demo-discovery-actions';
import {
  buildSampleDiscoveryFeedCards,
  countRealDiscoveryCandidates,
  injectSampleDiscoveryProfiles,
  SAMPLE_DISCOVERY_BANNER,
  shouldInjectSampleDiscoveryForRequest,
  stripSampleDiscoveryProfiles,
} from '../demo/inject-sample-discovery';
import {
  getSampleDiscoveryProfileById,
  getSampleDiscoveryProfiles,
  sampleDiscoveryContainsRedFlagLabel,
  sampleDiscoveryFixturesHaveNumericScores,
  toSampleDiscoveryFeedCard,
  toSampleDiscoveryPublicProfile,
} from '../demo/sample-discovery-profiles';
import { createEmptyActionState } from '../discovery-actions-types';
import type { DiscoveryFeedCardModel } from '../discovery/presentation';

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('sample Discovery access control', () => {
  it('allows sample Discovery injection in development and preview', () => {
    assert.equal(canInjectSampleDiscovery({ NODE_ENV: 'development' }), true);
    assert.equal(
      canInjectSampleDiscovery({ NODE_ENV: 'production', VERCEL_ENV: 'preview' }),
      true
    );
    assert.equal(isInternalDemoAccessAllowed({ NODE_ENV: 'development' }), true);
  });

  it('blocks sample Discovery injection in production without the explicit flag', () => {
    assert.equal(
      shouldInjectSampleDiscoveryForRequest({
        realCandidateCount: 0,
        env: { NODE_ENV: 'production', VERCEL_ENV: 'production' },
      }),
      false
    );
  });

  it('auto-injects when preview has zero real candidates and supports ?demo=1', () => {
    assert.equal(
      shouldInjectSampleDiscoveryForRequest({
        realCandidateCount: 0,
        env: { NODE_ENV: 'production', VERCEL_ENV: 'preview' },
      }),
      true
    );
    assert.equal(
      shouldInjectSampleDiscoveryForRequest({
        realCandidateCount: 3,
        env: { NODE_ENV: 'production', VERCEL_ENV: 'preview' },
      }),
      false
    );
    assert.equal(
      shouldInjectSampleDiscoveryForRequest({
        realCandidateCount: 3,
        forceDemoQuery: true,
        env: { NODE_ENV: 'development' },
      }),
      true
    );
  });
});

describe('sample Discovery feed injection', () => {
  it('injects seven sample profiles into the live feed card list', () => {
    const injected = injectSampleDiscoveryProfiles([]);
    assert.equal(injected.length, 7);
    assert.equal(countRealDiscoveryCandidates(injected), 0);
    assert.ok(injected.every((card) => isDemoDiscoveryProfileId(card.id)));
    assert.equal(buildSampleDiscoveryFeedCards().length, 7);
  });

  it('keeps real candidates separate and unchanged when injecting', () => {
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
    const injected = injectSampleDiscoveryProfiles([real]);
    assert.equal(countRealDiscoveryCandidates(injected), 1);
    assert.equal(injected.length, 8);
    assert.ok(injected.some((card) => card.id === 'real-candidate-1'));
    assert.deepEqual(stripSampleDiscoveryProfiles(injected), [real]);
  });

  it('uses the authoritative Discovery feed presentation', () => {
    const page = read('app/discovery/page.tsx');
    const feed = read('components/DiscoveryFeedPrototype.tsx');
    const card = read('components/DiscoveryFeedCard.tsx');
    assert.match(page, /injectSampleDiscoveryProfiles/);
    assert.match(page, /DiscoveryFeed/);
    assert.match(page, /sampleProfilesInjected/);
    assert.match(feed, /DiscoveryFeedCard/);
    assert.match(feed, /SAMPLE_DISCOVERY_BANNER/);
    assert.match(feed, /Hide sample profiles/);
    assert.match(feed, /Reset sample Discovery actions/);
    assert.match(card, /DiscoveryActionTiles/);
    assert.doesNotMatch(feed, /DemoDiscoveryHub/);
    assert.doesNotMatch(card, /Compatibility Index/i);
  });
});

describe('sample Discovery profiles and profile route', () => {
  it('exposes the seven required discovery profile ids', () => {
    assert.deepEqual(
      getSampleDiscoveryProfiles().map((profile) => profile.id),
      [
        'demo-discovery-amanda',
        'demo-discovery-sarah',
        'demo-discovery-nicole',
        'demo-discovery-rachel',
        'demo-discovery-danielle',
        'demo-discovery-monica',
        'demo-discovery-kristin',
      ]
    );
  });

  it('resolves demo-discovery ids through the fixture adapter only', () => {
    const action = read('app/actions/discovery.ts');
    assert.match(action, /isDemoDiscoveryProfileId/);
    assert.match(action, /getSampleDiscoveryProfileById/);
    assert.match(action, /toSampleDiscoveryPublicProfile/);
    assert.match(action, /never query Supabase for demo-discovery/);

    const amanda = getSampleDiscoveryProfileById('demo-discovery-amanda');
    assert.ok(amanda);
    const publicProfile = toSampleDiscoveryPublicProfile(amanda);
    assert.equal(publicProfile.id, 'demo-discovery-amanda');
    assert.equal(publicProfile.location_city, 'Colorado Springs');
    assert.ok((publicProfile.photos ?? []).length >= 1);

    const card = toSampleDiscoveryFeedCard(amanda);
    assert.equal(card.alignmentLabel, 'Strong Alignment');
    assert.equal(card.confidence, '—');
  });

  it('covers required qualitative alignment behaviors for all seven samples', () => {
    const amanda = getSampleDiscoveryProfileById('demo-discovery-amanda');
    const sarah = getSampleDiscoveryProfileById('demo-discovery-sarah');
    const nicole = getSampleDiscoveryProfileById('demo-discovery-nicole');
    const rachel = getSampleDiscoveryProfileById('demo-discovery-rachel');
    const danielle = getSampleDiscoveryProfileById('demo-discovery-danielle');
    const monica = getSampleDiscoveryProfileById('demo-discovery-monica');
    const kristin = getSampleDiscoveryProfileById('demo-discovery-kristin');
    assert.ok(amanda && sarah && nicole && rachel && danielle && monica && kristin);

    assert.equal(amanda.alignmentLabel, 'Strong Alignment');
    assert.equal(amanda.importantFactors.length, 0);
    assert.ok(amanda.characterSignals.includes('Respectful Communicator'));

    assert.equal(sarah.alignmentLabel, 'Promising Alignment');
    assert.ok(sarah.importantFactors.some((factor) => /Faith/i.test(factor.title)));

    assert.equal(nicole.alignmentLabel, 'Promising Alignment');
    assert.match(nicole.importantFactorsSummary ?? '', /children/i);

    assert.equal(rachel.alignmentLabel, 'More to Discover');
    assert.ok(rachel.importantFactors.length >= 2);

    assert.equal(danielle.alignmentLabel, 'Strong Alignment');
    assert.equal(danielle.importantFactors.length, 0);

    assert.equal(monica.alignmentLabel, 'More to Discover');
    assert.ok(monica.importantFactors.some((factor) => factor.isPotentialDealbreaker));

    assert.equal(kristin.alignmentLabel, 'Not Enough Information');
    assert.match(kristin.whySurfacedCopy ?? '', /responsible Relationship Alignment/i);
    assert.equal(kristin.characterSignals.length, 0);

    const profileView = read('components/discovery/DiscoveryProfileView.tsx');
    assert.match(profileView, /PublicProfilePresentation/);
    assert.match(profileView, /toSampleDiscoveryAlignmentPresentation/);
    assert.match(profileView, /DiscoveryActionTiles/);
    assert.match(read('components/discovery/ProfileAlignmentSections.tsx'), /Why Forge surfaced/);
    assert.match(
      read('components/discovery/ProfileAlignmentSections.tsx'),
      /ImportantAlignmentFactorsDrawer/
    );
    assert.match(
      read('components/discovery/ProfileAlignmentSections.tsx'),
      /PublicCharacterSignalsSection/
    );
  });

  it('does not invent Compatibility Index or numeric scores', () => {
    assert.equal(sampleDiscoveryFixturesHaveNumericScores(), false);
    assert.equal(sampleDiscoveryContainsRedFlagLabel(), false);
    const ui = [
      read('components/DiscoveryFeedCard.tsx'),
      read('components/discovery/ProfileAlignmentSections.tsx'),
      read('components/discovery/DiscoveryProfileView.tsx'),
    ].join('\n');
    assert.doesNotMatch(ui, /Compatibility Index/i);
    assert.doesNotMatch(ui, /score:\s*\d/);
  });
});

describe('sample Discovery action simulation safety', () => {
  it('simulates actions only for demo-discovery ids', () => {
    assert.equal(shouldSimulateDiscoveryAction('demo-discovery-amanda'), true);
    assert.equal(shouldSimulateDiscoveryAction('demo-jessica'), false);
    assert.equal(shouldSimulateDiscoveryAction('real-uuid'), false);
  });

  it('resets sample Discovery actions without touching real state', () => {
    const current = {
      'real-1': { ...createEmptyActionState(), interested: true },
      'demo-discovery-amanda': { ...createEmptyActionState(), passed: true, saved: true },
    };
    const reset = mergeResetSampleDiscoveryActions(current);
    assert.equal(reset['real-1']?.interested, true);
    assert.equal(reset['demo-discovery-amanda']?.passed, false);
    assert.equal(reset['demo-discovery-amanda']?.saved, false);
    assert.equal(Object.keys(createResetSampleDiscoveryActionState()).length, 7);
  });

  it('persists sample Discovery actions only in sessionStorage helpers', () => {
    const memory = new Map<string, string>();
    const original = globalThis.sessionStorage;
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
      },
    });

    try {
      writeSampleDiscoveryActionStateToSession({
        'demo-discovery-amanda': { ...createEmptyActionState(), interested: true },
        'real-1': { ...createEmptyActionState(), saved: true },
      });
      const stored = readSampleDiscoveryActionStateFromSession();
      assert.equal(stored['demo-discovery-amanda']?.interested, true);
      assert.equal(stored['real-1'], undefined);
      assert.ok(memory.has(SAMPLE_DISCOVERY_ACTION_STORAGE_KEY));
      clearSampleDiscoveryActionStateSession();
      assert.equal(readSampleDiscoveryActionStateFromSession()['demo-discovery-amanda'], undefined);
    } finally {
      Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: original,
      });
    }
  });

  it('keeps provider simulation free of Supabase writes for sample ids', () => {
    const provider = read('components/discovery/DiscoveryActionsProvider.tsx');
    assert.match(provider, /shouldSimulateDiscoveryAction/);
    assert.match(provider, /resetSampleDiscoveryActions/);
    assert.match(provider, /Sample preview/);
    // Simulation branches patch state before any server action call
    assert.match(provider, /if \(shouldSimulateDiscoveryAction\(profileId\)\)/);
    assert.match(
      provider,
      /if \(shouldSimulateDiscoveryAction\(openToChatPrompt\.profileId\)\)/
    );
  });

  it('does not create fake auth users or live rows from fixtures', () => {
    const fixtures = read('lib/demo/sample-discovery-profiles.ts');
    const inject = read('lib/demo/inject-sample-discovery.ts');
    const combined = `${fixtures}\n${inject}`;
    assert.doesNotMatch(combined, /auth\.admin/);
    assert.doesNotMatch(combined, /signUp\(/);
    assert.doesNotMatch(combined, /\.insert\(/);
    assert.doesNotMatch(combined, /\.upsert\(/);
    assert.doesNotMatch(combined, /createClient\(/);
  });

  it('documents Discovery sample injection and banner copy', () => {
    const docs = read('docs/DEMO_CONNECTIONS_SHOWCASE.md');
    assert.match(docs, /Discovery/);
    assert.equal(
      SAMPLE_DISCOVERY_BANNER,
      'Sample profiles are shown for product preview. Actions are simulated and reset on refresh.'
    );
  });
});
