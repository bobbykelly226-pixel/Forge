import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { getBetaFeedbackCategory } from '@/lib/feedback/constants';
import { validateBetaFeedbackFormData } from '@/lib/feedback/validation';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function validFormData() {
  const formData = new FormData();
  formData.set('category', 'broken');
  formData.set('area', 'discovery');
  formData.set('message', 'The Interested button did not respond when I tapped it.');
  formData.set('contactRequested', 'on');
  return formData;
}

describe('beta feedback intake', () => {
  it('validates and normalizes a complete beta feedback submission', () => {
    const result = validateBetaFeedbackFormData(validFormData());

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data, {
      category: 'broken',
      area: 'discovery',
      message: 'The Interested button did not respond when I tapped it.',
      contactRequested: true,
    });
  });

  it('rejects invalid categories, areas, and message lengths on the server', () => {
    const formData = new FormData();
    formData.set('category', 'safety_report');
    formData.set('area', 'unknown');
    formData.set('message', 'short');

    const result = validateBetaFeedbackFormData(formData);

    assert.equal(result.success, false);
    if (result.success) return;
    assert.match(result.fieldErrors.category ?? '', /Choose/);
    assert.match(result.fieldErrors.area ?? '', /Choose/);
    assert.match(result.fieldErrors.message ?? '', /at least 10/);
  });

  it('defines category-specific beta response expectations', () => {
    assert.match(getBetaFeedbackCategory('broken').responseExpectation, /two business days/);
    assert.match(getBetaFeedbackCategory('support').responseExpectation, /as soon as practical/);
    assert.match(getBetaFeedbackCategory('idea').responseExpectation, /not guaranteed/);
  });

  it('creates a private authenticated table with least-privilege grants', () => {
    const migration = read(
      'supabase/migrations/20260731142911_beta_feedback_intake.sql'
    );

    assert.match(migration, /create table public\.beta_feedback_submissions/);
    assert.match(migration, /enable row level security/);
    assert.match(migration, /revoke all[\s\S]*from public, anon, authenticated/);
    assert.match(migration, /grant insert \([\s\S]*\) on table public\.beta_feedback_submissions to authenticated/);
    assert.match(migration, /submitter_id = \(select auth\.uid\(\)\)/);
    assert.doesNotMatch(migration, /policy[\s\S]*for select[\s\S]*to authenticated/i);
  });

  it('keeps product feedback distinct from member safety reporting', () => {
    const migration = read(
      'supabase/migrations/20260731142911_beta_feedback_intake.sql'
    );
    const workspace = read('components/feedback/BetaFeedbackWorkspace.tsx');
    const notification = read('lib/feedback/notification.ts');

    assert.match(migration, /Safety and member reports remain in user_reports/);
    assert.match(workspace, /Need to report a member or safety concern/);
    assert.match(workspace, /separate protected review process/);
    assert.match(notification, /This is product feedback, not a member safety report/);
  });

  it('records a reference and sends an idempotent private admin notification', () => {
    const action = read('app/actions/feedback.ts');
    const notification = read('lib/feedback/notification.ts');

    assert.match(action, /supabase\.auth\.getUser\(\)/);
    assert.match(action, /crypto\.randomUUID\(\)/);
    assert.match(action, /beta_feedback_submissions/);
    assert.match(action, /after\(async \(\) =>/);
    assert.match(notification, /admin@forgedinlife\.com/);
    assert.match(notification, /Idempotency-Key/);
    assert.match(notification, /notification_status/);
    assert.match(notification, /provider_message_id/);
  });

  it('exposes feedback across the authenticated shell without changing primary mobile nav', () => {
    const desktopNav = read('components/ForgeDesktopAppNav.tsx');
    const utilityBar = read('components/DiscoveryDesktopTopBar.tsx');
    const profile = read('components/profile/MyProfileHub.tsx');
    const bottomNav = read('components/ForgeAppBottomNav.tsx');

    assert.match(desktopNav, /Beta Feedback/);
    assert.match(utilityBar, /Send Beta Feedback/);
    assert.match(profile, /Report a bug, ask for help, or share an idea/);
    assert.doesNotMatch(bottomNav, /Beta Feedback/);
  });
});
