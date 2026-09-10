import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260910231030_resolve_interests_on_connection.sql'
  ),
  'utf8'
);

const hubSource = readFileSync(join(process.cwd(), 'lib/data/connections-hub.ts'), 'utf8');
const cardSource = readFileSync(
  join(process.cwd(), 'components/connections/ConnectionCards.tsx'),
  'utf8'
);

describe('connected pair state cleanup', () => {
  it('resolves pending interests when the pair becomes connected', () => {
    assert.match(
      migration,
      /update public\.interests[\s\S]*set status = 'mutual'[\s\S]*where status = 'pending'/i
    );
    assert.match(migration, /sender_id = v_a and recipient_id = v_b/i);
    assert.match(migration, /sender_id = v_b and recipient_id = v_a/i);
  });

  it('keeps resolved interests out of Sent', () => {
    assert.match(
      hubSource,
      /from\('interests'\)[\s\S]*?\.eq\('sender_id', user\.id\)[\s\S]*?\.eq\('status', 'pending'\)/i
    );
    assert.doesNotMatch(
      hubSource,
      /\.in\('status', \['pending', 'mutual'\]\)/i
    );
  });

  it('uses Open to Chat language for Open to Chat connections', () => {
    assert.match(cardSource, /profile\.source === 'open_to_chat'/i);
    assert.match(cardSource, /both open to a conversation/i);
  });
});
