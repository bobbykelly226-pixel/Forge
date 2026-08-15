import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const migration = readFileSync(
  'supabase/migrations/20260814231500_harden_function_search_paths.sql',
  'utf8'
);
const databaseTest = readFileSync(
  'supabase/tests/function_security_audit.test.sql',
  'utf8'
);

describe('database function security audit', () => {
  it('pins SECURITY DEFINER and otherwise mutable public functions', () => {
    assert.match(migration, /p\.prosecdef/i);
    assert.match(migration, /setting like 'search_path=%'/i);
    assert.match(migration, /pg_catalog, public/i);
  });

  it('preserves the additional trusted schemas already required at runtime', () => {
    assert.match(migration, /pg_catalog, public, storage/i);
    assert.match(migration, /pg_catalog, public, pg_temp/i);
  });

  it('regression-tests grants, search paths, and a required member RPC', () => {
    assert.match(databaseTest, /anonymous users cannot execute public SECURITY DEFINER functions/i);
    assert.match(databaseTest, /PUBLIC cannot execute public SECURITY DEFINER functions/i);
    assert.match(databaseTest, /every public SECURITY DEFINER function puts pg_catalog first/i);
    assert.match(databaseTest, /every public-schema function has an explicit search_path/i);
    assert.match(databaseTest, /list_eligible_discovery_profiles/i);
    assert.match(databaseTest, /report_user/i);
  });
});
