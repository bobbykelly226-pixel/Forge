import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const migration = readFileSync(
  'supabase/migrations/20260814220506_harden_privileged_function_grants.sql',
  'utf8'
);
const databaseTest = readFileSync(
  'supabase/tests/privileged_function_grants.test.sql',
  'utf8'
);

describe('privileged database function grants', () => {
  it('removes inherited public access from internal SECURITY DEFINER functions', () => {
    assert.match(
      migration,
      /revoke all on function public\.ensure_foundational_user_records\(uuid\)[\s\S]*from public, anon, authenticated/i
    );
    assert.match(
      migration,
      /revoke all on function public\.handle_new_user\(\)[\s\S]*from public, anon, authenticated/i
    );
  });

  it('preserves only the execution paths required by Forge', () => {
    assert.match(
      migration,
      /grant execute on function public\.ensure_foundational_user_records\(uuid\)[\s\S]*to authenticated, service_role/i
    );
    assert.match(
      migration,
      /grant execute on function public\.handle_new_user\(\)[\s\S]*to service_role/i
    );
  });

  it('covers anonymous, member, and trusted server-role boundaries in pgTAP', () => {
    assert.match(databaseTest, /'anon'[\s\S]*ensure_foundational_user_records/i);
    assert.match(databaseTest, /'authenticated'[\s\S]*ensure_foundational_user_records/i);
    assert.match(databaseTest, /'anon'[\s\S]*handle_new_user/i);
    assert.match(databaseTest, /'authenticated'[\s\S]*handle_new_user/i);
    assert.match(databaseTest, /'service_role'[\s\S]*handle_new_user/i);
  });
});
