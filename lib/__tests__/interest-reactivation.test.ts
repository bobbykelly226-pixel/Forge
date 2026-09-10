import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260910214317_reactivate_withdrawn_interest.sql'
  ),
  'utf8'
);

describe('interest reactivation', () => {
  it('reactivates a withdrawn unique pair instead of returning false success', () => {
    assert.match(
      migration,
      /on conflict \(sender_id, recipient_id\) do update\s+set status = 'pending', updated_at = now\(\)\s+where existing_interest\.status = 'withdrawn'/i
    );
  });

  it('keeps sender and recipient reads aligned with the active status', () => {
    assert.match(migration, /returning id into v_interest_id/i);
    assert.match(migration, /and i\.status in \('pending', 'mutual'\)/i);
    assert.match(migration, /'interested', true/i);
  });

  it('preserves the authenticated-only function boundary', () => {
    assert.match(migration, /security definer\s+set search_path = public/i);
    assert.match(migration, /if v_uid is null then raise exception 'Authentication required'/i);
    assert.match(
      migration,
      /revoke all on function public\.send_interest\(uuid\) from public, anon/i
    );
    assert.match(
      migration,
      /grant execute on function public\.send_interest\(uuid\) to authenticated/i
    );
  });
});
