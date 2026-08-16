import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const migration = readFileSync(
  'supabase/migrations/20260816073208_secure_discovery_photo_access.sql',
  'utf8'
);
const discoveryData = readFileSync('lib/data/discovery.ts', 'utf8');

describe('Discovery photo access security', () => {
  it('secures the legacy view and creates an authenticated, viewer-scoped RPC', () => {
    assert.match(
      migration,
      /alter view public\.discoverable_profile_photos[\s\S]*security_invoker = true/i
    );
    assert.match(migration, /security definer/i);
    assert.match(migration, /set search_path = pg_catalog, public/i);
    assert.match(migration, /auth\.uid\(\)/i);
    assert.match(migration, /get_eligible_discovery_profile\(ph\.user_id\)/i);
    assert.match(migration, /ph\.moderation_status = 'approved'/i);
    assert.match(migration, /at most 100 profile ids/i);
  });

  it('grants only authenticated members access to the RPC', () => {
    assert.match(
      migration,
      /revoke all on function public\.list_eligible_discovery_profile_photos\(uuid\[\]\)[\s\S]*from public, anon, authenticated/i
    );
    assert.match(
      migration,
      /grant execute on function public\.list_eligible_discovery_profile_photos\(uuid\[\]\)[\s\S]*to authenticated/i
    );
  });

  it('loads Discovery photos through the viewer-scoped RPC', () => {
    assert.match(
      discoveryData,
      /\.rpc\(\s*'list_eligible_discovery_profile_photos'/i
    );
    assert.doesNotMatch(discoveryData, /\.from\('discoverable_profile_photos'\)/i);
  });
});
