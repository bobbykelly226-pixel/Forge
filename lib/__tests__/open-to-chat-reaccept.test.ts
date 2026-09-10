import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260910224646_reactivate_connection_on_reaccept.sql'
  ),
  'utf8'
);

const hubSource = readFileSync(
  join(process.cwd(), 'lib/data/connections-hub.ts'),
  'utf8'
);

const hardeningMigration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260910225823_harden_latest_connection_function_search_paths.sql'
  ),
  'utf8'
);

describe('Open to Chat reacceptance', () => {
  it('reactivates the unique connection and its ended conversation', () => {
    assert.match(
      migration,
      /on conflict \(user_a_id, user_b_id\) do update\s+set status = 'active'/i
    );
    assert.match(
      migration,
      /update public\.conversations\s+set status = 'active',[\s\S]*ended_at = null,[\s\S]*ended_by_user_id = null/i
    );
  });

  it('refreshes the acceptance notification for a reused request', () => {
    assert.match(
      migration,
      /notification_type = 'open_to_chat_accepted'[\s\S]*entity_id = p_request_id/i
    );
    assert.match(migration, /read_at = null,[\s\S]*created_at = now\(\)/i);
  });

  it('restores the required system-first search path on replaced functions', () => {
    for (const signature of [
      /send_interest\(uuid\)/i,
      /send_open_to_chat\(uuid, text\)/i,
      /forge_ensure_connection\([\s\S]*uuid, uuid, public\.connection_source[\s\S]*\)/i,
      /respond_open_to_chat\(uuid, text\)/i,
    ]) {
      assert.match(hardeningMigration, signature);
    }
    assert.equal(
      (hardeningMigration.match(/set search_path to pg_catalog, public/gi) ?? []).length,
      4
    );
  });

  it('shows active connections in Mutual and removes accepted requests from Sent', () => {
    assert.match(
      hubSource,
      /from\('connections'\)[\s\S]*?\.select\('id, user_a_id, user_b_id, source, created_at, updated_at, status'\)[\s\S]*?\.eq\('status', 'active'\)/i
    );
    assert.doesNotMatch(
      hubSource,
      /from\('open_to_chat_requests'\)[\s\S]*?\.eq\('sender_id', user\.id\)[\s\S]*?\.in\('status', \['pending', 'deferred', 'accepted'\]\)/i
    );
  });
});
