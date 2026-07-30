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
});
