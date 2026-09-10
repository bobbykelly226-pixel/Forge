import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  buildNotificationBody,
  isSupportedNotificationType,
  resolveNotificationDestination,
} from '@/lib/notifications/resolve';

const enumMigration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260910220523_add_open_to_chat_received_notification_type.sql'
  ),
  'utf8'
);
const deliveryMigration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260910220533_notify_open_to_chat_recipient.sql'
  ),
  'utf8'
);

describe('Open to Chat recipient notification', () => {
  it('adds a distinct notification type', () => {
    assert.match(enumMigration, /add value if not exists 'open_to_chat_received'/i);
    assert.ok(isSupportedNotificationType('open_to_chat_received'));
    assert.equal(
      buildNotificationBody('open_to_chat_received', 'Jimmy'),
      'Jimmy is open to starting a conversation.'
    );
  });

  it('notifies the recipient and routes directly to Open to Chat', () => {
    assert.match(deliveryMigration, /p_recipient_id,\s*v_uid,\s*'open_to_chat_received'/i);
    assert.match(deliveryMigration, /'open_to_chat_request'::public\.notification_entity_type/i);
    assert.match(deliveryMigration, /'\/connections\?tab=openToChat'/i);
    assert.equal(
      resolveNotificationDestination('/connections?tab=openToChat'),
      '/connections?tab=openToChat'
    );
  });

  it('reactivates a closed unique request and refreshes its notification', () => {
    assert.match(deliveryMigration, /on conflict \(sender_id, recipient_id\) do update/i);
    assert.match(deliveryMigration, /existing_request\.status in \('declined', 'expired'\)/i);
    assert.match(deliveryMigration, /if v_reactivated then\s+update public\.notifications/i);
    assert.match(deliveryMigration, /read_at = null,\s+created_at = now\(\)/i);
  });
});
