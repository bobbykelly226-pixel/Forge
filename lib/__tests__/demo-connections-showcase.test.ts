import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  describeDemoAccessDecision,
  isInternalDemoAccessAllowed,
  shouldShowConnectionsDemoShortcut,
} from '../demo/demo-access';
import {
  DEMO_CONNECTIONS,
  DEMO_CONNECTIONS_ROUTE,
  DEMO_READ_ONLY_ACTIONS,
  DEMO_VIEWER,
  demoConnectionDetailPath,
  demoFixtureContainsRedFlagLabel,
  factorSeverityStyles,
  getDemoAlignmentCategories,
  getDemoConnectionById,
  getDemoConnections,
  getPotentialDealbreakerFactors,
  isDemoWriteActionAllowed,
  toDemoHubProfileCard,
} from '../demo/demo-connections';

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('demo connections access control', () => {
  it('allows the internal demo route in development', () => {
    assert.equal(
      isInternalDemoAccessAllowed({ NODE_ENV: 'development', VERCEL_ENV: 'production' }),
      true
    );
    assert.equal(describeDemoAccessDecision({ NODE_ENV: 'development' }).reason, 'NODE_ENV_development');
  });

  it('allows the internal demo route on Vercel preview without an explicit flag', () => {
    assert.equal(
      isInternalDemoAccessAllowed({
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
      }),
      true
    );
  });

  it('returns notFound behavior in production without the explicit flag', () => {
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

    const page = read('app/internal/demo-connections/page.tsx');
    const detail = read('app/internal/demo-connections/[id]/page.tsx');
    assert.match(page, /notFound\(\)/);
    assert.match(page, /isInternalDemoAccessAllowed/);
    assert.match(detail, /notFound\(\)/);
    assert.match(detail, /ENABLE_INTERNAL_DEMOS|isInternalDemoAccessAllowed/);
  });

  it('allows production only when ENABLE_INTERNAL_DEMOS=true', () => {
    assert.equal(
      isInternalDemoAccessAllowed({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
        ENABLE_INTERNAL_DEMOS: 'true',
      }),
      true
    );
  });

  it('keeps the preview-only empty-state shortcut absent in production', () => {
    assert.equal(
      shouldShowConnectionsDemoShortcut({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      }),
      false
    );
    assert.equal(
      shouldShowConnectionsDemoShortcut({ NODE_ENV: 'development' }),
      true
    );
    assert.equal(
      shouldShowConnectionsDemoShortcut({
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
      }),
      true
    );

    const connectionsPage = read('app/connections/page.tsx');
    const hub = read('components/connections/ConnectionsHubPrototype.tsx');
    assert.match(connectionsPage, /shouldShowConnectionsDemoShortcut/);
    assert.match(connectionsPage, /showDemoShortcut/);
    assert.match(hub, /Preview Demo Connections/);
    assert.match(hub, /DEMO_CONNECTIONS_ROUTE/);
    assert.match(hub, /showDemoShortcut/);
  });
});

describe('demo connections fixtures', () => {
  it('exposes exactly five demo connections', () => {
    const connections = getDemoConnections();
    assert.equal(connections.length, 5);
    assert.equal(DEMO_CONNECTIONS.length, 5);
    for (const connection of connections) {
      assert.equal(connection.isDemo, true);
      assert.match(connection.id, /^demo-/);
    }
  });

  it('represents each required alignment category', () => {
    const categories = getDemoAlignmentCategories();
    assert.ok(categories.includes('Strong Alignment'));
    assert.ok(categories.includes('Promising Alignment'));
    assert.ok(categories.includes('More to Discover'));
    assert.ok(categories.includes('Not Enough Information'));
  });

  it('shows numeric indexes for Strong and Promising Alignment', () => {
    const jessica = getDemoConnectionById('demo-jessica');
    const megan = getDemoConnectionById('demo-megan');
    assert.ok(jessica);
    assert.ok(megan);
    assert.equal(jessica.alignmentLabel, 'Strong Alignment');
    assert.equal(jessica.compatibilityIndex, 94);
    assert.equal(jessica.compatibilityIndexDisplay, '94');
    assert.equal(megan.alignmentLabel, 'Promising Alignment');
    assert.equal(megan.compatibilityIndex, 83);
  });

  it('shows numeric indexes and factors for More to Discover examples', () => {
    const lauren = getDemoConnectionById('demo-lauren');
    const natalie = getDemoConnectionById('demo-natalie');
    assert.ok(lauren);
    assert.ok(natalie);
    assert.equal(lauren.alignmentLabel, 'More to Discover');
    assert.equal(lauren.compatibilityIndex, 68);
    assert.ok(lauren.importantFactors.length >= 1);
    assert.equal(natalie.alignmentLabel, 'More to Discover');
    assert.equal(natalie.compatibilityIndex, 52);
    assert.ok(natalie.importantFactors.length >= 1);
  });

  it('does not show a misleading score for Not Enough Information', () => {
    const emily = getDemoConnectionById('demo-emily');
    assert.ok(emily);
    assert.equal(emily.alignmentLabel, 'Not Enough Information');
    assert.equal(emily.compatibilityIndex, null);
    assert.equal(emily.compatibilityIndexDisplay, 'Not yet available');
    assert.match(
      emily.incompleteAssessmentCopy ?? '',
      /does not have enough information to make a responsible compatibility assessment/i
    );
    assert.ok(emily.breakdown.every((row) => row.score == null));
  });

  it('renders Important Alignment Factors with correct product language', () => {
    const megan = getDemoConnectionById('demo-megan');
    const lauren = getDemoConnectionById('demo-lauren');
    assert.ok(megan);
    assert.ok(lauren);
    assert.equal(megan.importantFactors[0]?.title, 'Relocation preferences differ');
    assert.match(
      megan.importantFactors[0]?.explanation ?? '',
      /worth discussing if the relationship becomes serious/i
    );
    assert.ok(
      lauren.importantFactors.some((factor) => factor.title === 'Faith importance differs')
    );
    assert.equal(DEMO_VIEWER.label, "Bobby's demo profile");

    const detail = read('components/demo/DemoCompatibilityDetail.tsx');
    assert.match(detail, /Important Alignment Factors/);
    assert.doesNotMatch(detail, /red flag/i);
  });

  it('limits potential dealbreaker language to the serious-conflict example', () => {
    const dealbreakers = getPotentialDealbreakerFactors();
    assert.equal(dealbreakers.length, 1);
    assert.equal(dealbreakers[0]?.title, 'Children preferences differ');
    assert.match(dealbreakers[0]?.summary ?? '', /Potential dealbreaker/i);

    const natalie = getDemoConnectionById('demo-natalie');
    assert.ok(natalie);
    assert.ok(
      natalie.importantFactors.some((factor) => factor.isPotentialDealbreaker === true)
    );

    for (const connection of DEMO_CONNECTIONS) {
      if (connection.id === 'demo-natalie') continue;
      assert.ok(
        connection.importantFactors.every((factor) => !factor.isPotentialDealbreaker)
      );
      assert.doesNotMatch(JSON.stringify(connection), /Potential dealbreaker/i);
    }
  });

  it('never labels a person as a red flag', () => {
    assert.equal(demoFixtureContainsRedFlagLabel(), false);
    const sources = [
      read('lib/demo/demo-connections.ts'),
      read('components/demo/DemoConnectionCard.tsx'),
      read('components/demo/DemoCompatibilityDetail.tsx'),
      read('docs/DEMO_CONNECTIONS_SHOWCASE.md'),
    ].join('\n');
    assert.doesNotMatch(sources, /is a red flag/i);
    assert.doesNotMatch(sources, /labeled a red flag/i);
  });

  it('includes compatibility breakdowns and Character Signals', () => {
    for (const connection of DEMO_CONNECTIONS) {
      assert.ok(connection.breakdown.length >= 5);
      if (connection.id === 'demo-emily') {
        assert.equal(connection.characterSignals.length, 0);
        assert.match(
          connection.characterSignalsEmptyCopy ?? '',
          /No public Character Signals yet/i
        );
      } else {
        assert.ok(connection.characterSignals.length >= 1);
      }
      assert.ok(connection.conversationTopics.length >= 3);
    }

    const card = read('components/demo/DemoConnectionCard.tsx');
    const detail = read('components/demo/DemoCompatibilityDetail.tsx');
    assert.match(card, /Character Signals/);
    assert.match(card, /Compatibility Index/);
    assert.match(detail, /Compatibility breakdown/);
    assert.match(detail, /Suggested topics to discuss/);
  });

  it('opens View Compatibility to the correct demo detail path', () => {
    assert.equal(DEMO_CONNECTIONS_ROUTE, '/internal/demo-connections');
    assert.equal(
      demoConnectionDetailPath('demo-jessica'),
      '/internal/demo-connections/demo-jessica'
    );
    const card = read('components/demo/DemoConnectionCard.tsx');
    assert.match(card, /View Compatibility/);
    assert.match(card, /demoConnectionDetailPath/);
    const detailPage = read('app/internal/demo-connections/[id]/page.tsx');
    assert.match(detailPage, /getDemoConnectionById/);
    assert.match(detailPage, /DemoDetailChrome/);
  });
});

describe('demo connections safety and product invariants', () => {
  it('never allows demo actions to write to Supabase', () => {
    assert.equal(isDemoWriteActionAllowed('send_message'), false);
    assert.equal(isDemoWriteActionAllowed('open_to_chat'), false);
    assert.equal(isDemoWriteActionAllowed('interested'), false);
    assert.deepEqual(DEMO_READ_ONLY_ACTIONS, [
      'view_compatibility',
      'view_demo_profile',
      'navigate_back',
    ]);

    const demoLib = read('lib/demo/demo-connections.ts');
    const card = read('components/demo/DemoConnectionCard.tsx');
    const detail = read('components/demo/DemoCompatibilityDetail.tsx');
    const hub = read('components/demo/DemoConnectionsHub.tsx');
    const combined = [demoLib, card, detail, hub].join('\n');
    assert.doesNotMatch(combined, /createClient\(/);
    assert.doesNotMatch(combined, /from\('connections'\)/);
    assert.doesNotMatch(combined, /from\('interests'\)/);
    assert.doesNotMatch(combined, /from\('open_to_chat/);
    assert.match(card, /Demo only/);
    assert.match(detail, /Demo only/);
  });

  it('does not create fake auth users or live records', () => {
    const demoLib = read('lib/demo/demo-connections.ts');
    const docs = read('docs/DEMO_CONNECTIONS_SHOWCASE.md');
    assert.doesNotMatch(demoLib, /auth\.admin/);
    assert.doesNotMatch(demoLib, /signUp\(/);
    assert.doesNotMatch(demoLib, /\.insert\(/);
    assert.doesNotMatch(demoLib, /\.upsert\(/);
    assert.match(docs, /Why fake live users were not created/i);
    assert.match(docs, /deterministic local fixtures/i);
  });

  it('leaves real Connections behavior unchanged aside from the gated shortcut', () => {
    const provider = read('components/connections/ConnectionsHubProvider.tsx');
    const cards = read('components/connections/ConnectionCards.tsx');
    const hubData = read('lib/data/connections-hub.ts');
    assert.doesNotMatch(provider, /demo-connections/);
    assert.doesNotMatch(cards, /demo-jessica/);
    assert.doesNotMatch(hubData, /DEMO_CONNECTIONS/);
    assert.match(hubData, /loadConnectionsHub|toHubCard|DISCOVERY_NEUTRAL_ALIGNMENT_LABEL/);
  });

  it('maps demo fixtures into hub card shape without inventing live ids', () => {
    const jessica = getDemoConnectionById('demo-jessica');
    assert.ok(jessica);
    const card = toDemoHubProfileCard(jessica);
    assert.equal(card.id, 'demo-jessica');
    assert.equal(card.firstName, 'Jessica');
    assert.equal(card.alignmentLabel, 'Strong Alignment');
    assert.equal(card.hasImportantFactors, false);
    assert.equal(card.photoUrl, null);
  });

  it('uses restrained severity styles for Important Alignment Factors', () => {
    const informational = factorSeverityStyles('informational');
    const discussing = factorSeverityStyles('worth_discussing');
    const dealbreaker = factorSeverityStyles('potential_dealbreaker');
    assert.match(informational.backgroundClass, /E8EEF6|0B2D5C/);
    assert.equal(discussing.badgeLabel, 'Worth discussing');
    assert.equal(dealbreaker.badgeLabel, 'Potential dealbreaker');
    assert.match(dealbreaker.borderClass, /D62828/);
  });

  it('keeps mobile-friendly layout contracts (no forced narrow overflow patterns)', () => {
    const card = read('components/demo/DemoConnectionCard.tsx');
    const detail = read('components/demo/DemoCompatibilityDetail.tsx');
    const hub = read('components/demo/DemoConnectionsHub.tsx');
    assert.match(card, /min-h-11/);
    assert.match(card, /flex-col/);
    assert.match(detail, /overflow-hidden|max-w-|lg:max-w-none/);
    assert.match(hub, /max-w-lg[\s\S]*lg:max-w-none/);
    assert.doesNotMatch(card, /overflow-x-scroll/);
    assert.doesNotMatch(detail, /overflow-x-scroll/);
  });

  it('supports keyboard navigation affordances on primary demo actions', () => {
    const card = read('components/demo/DemoConnectionCard.tsx');
    const detail = read('components/demo/DemoCompatibilityDetail.tsx');
    assert.match(card, /focus-visible:outline/);
    assert.match(detail, /focus-visible:outline/);
    assert.match(card, /<Link[\s\S]*View Compatibility/);
    assert.match(detail, /Back to Demo Connections/);
  });

  it('protects /internal routes in proxy auth gating', () => {
    const proxy = read('proxy.ts');
    assert.match(proxy, /pathname\.startsWith\('\/internal'\)/);
  });

  it('documents the showcase for operators', () => {
    const docs = read('docs/DEMO_CONNECTIONS_SHOWCASE.md');
    assert.match(docs, /\/internal\/demo-connections/);
    assert.match(docs, /ENABLE_INTERNAL_DEMOS/);
    assert.match(docs, /Important Alignment Factors/);
    assert.match(docs, /How to remove the showcase before launch/);
  });
});
