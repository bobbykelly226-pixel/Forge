import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { LAUNCH_EVENT_PROPERTY_ALLOWLIST } from '@/lib/analytics/launch-events';
import {
  isProductionAnalyticsHost,
  normalizeAnalyticsPath,
  sanitizeAnalyticsEvent,
  sanitizeAnalyticsUrl,
} from '@/lib/analytics/privacy';

const root = process.cwd();

test('analytics accepts only current Forge production hosts', () => {
  assert.equal(isProductionAnalyticsHost('forge.forgedinlife.com'), true);
  assert.equal(isProductionAnalyticsHost('forgedinlife.com'), true);
  assert.equal(isProductionAnalyticsHost('www.forgedinlife.com'), true);
  assert.equal(isProductionAnalyticsHost('forge-git-main-forgedbydesign.vercel.app'), false);
  assert.equal(isProductionAnalyticsHost('www.swiperightdating.com'), false);
});

test('analytics strips tokens, query strings, hashes, and dynamic member identifiers', () => {
  const profileId = '7f08e90f-b0ce-4db3-bfb8-15a67d26dd30';
  const conversationId = '9f918cb1-7165-47ae-9f58-448fa8b20e32';

  assert.equal(
    sanitizeAnalyticsUrl(
      `https://forge.forgedinlife.com/discovery/profile/${profileId}?source=notification#photos`
    ),
    'https://forge.forgedinlife.com/discovery/profile/[profileId]'
  );
  assert.equal(
    sanitizeAnalyticsUrl(
      `https://forge.forgedinlife.com/connections/c/${conversationId}?token_hash=secret`
    ),
    'https://forge.forgedinlife.com/connections/c/[conversationId]'
  );
  assert.equal(
    sanitizeAnalyticsUrl(
      'https://forge.forgedinlife.com/auth/callback?code=private-code&next=/onboarding'
    ),
    'https://forge.forgedinlife.com/auth/callback'
  );
});

test('analytics normalizes unexpected UUID path segments as a final privacy boundary', () => {
  assert.equal(
    normalizeAnalyticsPath('/example/7f08e90f-b0ce-4db3-bfb8-15a67d26dd30/details'),
    '/example/[id]/details'
  );
});

test('analytics drops Preview, malformed, and non-Forge events', () => {
  assert.equal(
    sanitizeAnalyticsUrl('https://forge-git-launch-analytics.vercel.app/discovery'),
    null
  );
  assert.equal(sanitizeAnalyticsUrl('not a url'), null);
  assert.equal(
    sanitizeAnalyticsEvent({
      type: 'pageview' as const,
      url: 'https://example.com/discovery',
    }),
    null
  );
});

test('launch event properties are aggregate-only and exclude personal content keys', () => {
  const forbidden = /(user|profile|email|name|message|answer|detail|report|note|location|id)/i;
  const keys = Object.values(LAUNCH_EVENT_PROPERTY_ALLOWLIST).flat();

  assert.deepEqual(
    [...new Set(keys)].sort(),
    ['action', 'attachment', 'category', 'flow', 'method', 'response']
  );
  for (const key of keys) {
    assert.doesNotMatch(key, forbidden);
  }
});

test('root observability owns page analytics and performance monitoring', async () => {
  const [layout, observability, events, privacy] = await Promise.all([
    readFile(path.join(root, 'app/layout.tsx'), 'utf8'),
    readFile(path.join(root, 'components/analytics/ForgeObservability.tsx'), 'utf8'),
    readFile(path.join(root, 'lib/analytics/launch-events.ts'), 'utf8'),
    readFile(path.join(root, 'app/privacy/page.tsx'), 'utf8'),
  ]);

  assert.match(layout, /<ForgeObservability \/>/);
  assert.match(observability, /<Analytics/);
  assert.match(observability, /<SpeedInsights/);
  assert.match(observability, /sanitizeAnalyticsEvent/);
  assert.match(events, /isProductionAnalyticsHost\(window\.location\.hostname\)/);
  assert.doesNotMatch(events, /@vercel\/analytics\/server/);
  assert.match(privacy, /Vercel Web Analytics and Speed Insights/);
  assert.match(privacy, /does not send names, email addresses, profile answers/);
});

test('core launch milestones are wired only after successful member actions', async () => {
  const files = await Promise.all(
    [
      'app/signup/SignupForm.tsx',
      'app/login/LoginForm.tsx',
      'components/OnboardingShell.tsx',
      'components/profile/DiscoveryVisibilityToggle.tsx',
      'components/compatibility-profile/CompatibilityProfileShell.tsx',
      'components/discovery/DiscoveryActionsProvider.tsx',
      'components/connections/ConnectionsHubProvider.tsx',
      'components/conversations/ConversationThread.tsx',
      'components/feedback/BetaFeedbackWorkspace.tsx',
    ].map((file) => readFile(path.join(root, file), 'utf8'))
  );
  const source = files.join('\n');

  for (const event of [
    'Account Signup Accepted',
    'Sign In Completed',
    'Onboarding Completed',
    'Compatibility Category Completed',
    'Compatibility Profile Completed',
    'Discovery Visibility Enabled',
    'Discovery Action Completed',
    'Open To Chat Response Completed',
    'Connection Created',
    'Conversation Started',
    'Message Sent',
    'Beta Feedback Submitted',
  ]) {
    assert.match(source, new RegExp(`trackLaunchEvent\\('${event}'`));
  }
});
