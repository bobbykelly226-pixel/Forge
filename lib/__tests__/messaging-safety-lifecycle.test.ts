import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('messaging safety lifecycle', () => {
  it('keeps ended history read-only and makes blocking asymmetric', () => {
    const migration = read(
      'supabase/migrations/20260730044245_messaging_safety_lifecycle.sql'
    );
    assert.match(migration, /forge_can_access_conversation_history/);
    assert.match(migration, /Authorized participants read conversation messages/);
    assert.match(migration, /Authorized participants read conversation history attachments/);
    assert.match(migration, /ended_by_user_id/);
    assert.match(migration, /blocked_by_viewer/);
    assert.match(migration, /not blocks\.blocked_viewer/);
    assert.match(migration, /end_connection/);
    assert.match(migration, /block_user/);
  });

  it('separates current and past conversations with clear labels', () => {
    const hub = read('components/conversations/ConversationHub.tsx');
    const thread = read('components/conversations/ConversationThread.tsx');
    const menu = read('components/conversations/ConversationSafetyMenu.tsx');
    assert.match(hub, /Current conversations/);
    assert.match(hub, /Past connections/);
    assert.match(hub, /You ended this connection/);
    assert.match(hub, /You blocked this member/);
    assert.match(thread, /Your shared history remains available/);
    assert.match(thread, /table: 'conversations'/);
    assert.match(menu, /existing messages, photos, and files/);
    assert.match(menu, /keep the history for reporting or documentation/);
  });

  it('keeps safety dialogs visible and makes report submission intentional', () => {
    const menu = read('components/conversations/ConversationSafetyMenu.tsx');
    const notification = read('lib/safety/report-notification.ts');
    assert.match(menu, /createPortal/);
    assert.match(menu, /max-h-\[calc\(100dvh-1\.5rem\)\]/);
    assert.match(menu, /focusConfirm=\{false\}/);
    assert.match(menu, /<textarea[\s\S]*autoFocus/);
    assert.match(notification, /Forge Safety <hello@forgedinlife\.com>/);
    assert.match(notification, /admin@forgedinlife\.com/);
    assert.match(notification, /Safety report saved but review notification failed/);
  });

  it('adds private screenshot evidence and auditable admin email delivery', () => {
    const migration = read(
      'supabase/migrations/20260730191714_safety_reporting_evidence_unblock.sql'
    );
    const menu = read('components/conversations/ConversationSafetyMenu.tsx');
    const notification = read('lib/safety/report-notification.ts');
    const constants = read('lib/conversations/constants.ts');

    assert.match(migration, /create table if not exists public\.report_evidence/);
    assert.match(migration, /'report-evidence'[\s\S]*false[\s\S]*5242880/);
    assert.match(migration, /image\/heic/);
    assert.match(migration, /image\/heif/);
    assert.match(migration, /jsonb_array_length\(p_evidence\)/);
    assert.match(migration, /You can attach up to 3 screenshots/);
    assert.match(migration, /private screenshot evidence/i);
    assert.match(menu, /Add screenshots/);
    assert.match(menu, /available only to Forge[\s\S]*safety reviewers/);
    assert.match(constants, /REPORT_EVIDENCE_MAX_FILES = 3/);
    assert.match(constants, /REPORT_EVIDENCE_MAX_BYTES = 5 \* 1024 \* 1024/);
    assert.match(notification, /attachments/);
    assert.match(notification, /Idempotency-Key/);
    assert.match(notification, /provider_message_id/);
    assert.match(notification, /admin@forgedinlife\.com/);
  });

  it('rate-limits duplicate reports and keeps report records authoritative', () => {
    const migration = read(
      'supabase/migrations/20260730191714_safety_reporting_evidence_unblock.sql'
    );
    const notification = read('lib/safety/report-notification.ts');

    assert.match(migration, /interval '10 minutes'/);
    assert.match(migration, /interval '24 hours'/);
    assert.match(migration, />= 10/);
    assert.match(migration, /'duplicate', true/);
    assert.match(migration, /create table if not exists public\.safety_report_notifications/);
    assert.match(migration, /pending', 'accepted', 'failed', 'not_configured/);
    assert.match(notification, /The protected Forge report record remains authoritative/);
    assert.match(notification, /status: 'failed'/);
    assert.match(notification, /status: 'not_configured'/);
  });

  it('adds audited unblock without reconnecting or reopening messaging', () => {
    const migration = read(
      'supabase/migrations/20260730191714_safety_reporting_evidence_unblock.sql'
    );
    const menu = read('components/conversations/ConversationSafetyMenu.tsx');
    const actions = read('app/actions/conversations.ts');

    assert.match(migration, /create table if not exists public\.safety_action_audit/);
    assert.match(migration, /action in \('block', 'unblock'\)/);
    assert.match(migration, /create or replace function public\.unblock_user/);
    assert.match(migration, /'connection_restored', false/);
    assert.match(migration, /'messaging_reopened', false/);
    assert.match(menu, /Unblock/);
    assert.match(menu, /does not reconnect you or reopen messaging/);
    assert.match(actions, /unblockUserAction/);
  });
});
