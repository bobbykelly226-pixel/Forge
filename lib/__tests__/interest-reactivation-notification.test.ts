import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260910215236_refresh_reactivated_interest_notification.sql'
  ),
  'utf8'
);

describe('reactivated interest notifications', () => {
  it('detects the withdrawn-to-pending transition before the upsert', () => {
    assert.match(migration, /select i\.status = 'withdrawn'\s+into v_was_withdrawn/i);
    assert.match(migration, /where existing_interest\.status = 'withdrawn'/i);
  });

  it('refreshes only a reactivated interest notification', () => {
    assert.match(migration, /if v_was_withdrawn then\s+update public\.notifications/i);
    assert.match(migration, /read_at = null,\s+created_at = now\(\)/i);
    assert.match(migration, /notification_type = 'interest_received'/i);
    assert.match(migration, /entity_id = v_interest_id/i);
  });

  it('still delegates initial notification creation to the trusted helper', () => {
    assert.match(migration, /perform public\.forge_create_notification\(/i);
    assert.match(
      migration,
      /revoke all on function public\.send_interest\(uuid\) from public, anon/i
    );
  });
});
