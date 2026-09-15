import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  OPEN_TO_CHAT_DAILY_LIMIT,
  OPEN_TO_CHAT_PREMIUM_DAILY_LIMIT,
  OPEN_TO_CHAT_RECIPIENT_COOLDOWN_DAYS,
  OPEN_TO_CHAT_ROLLING_WINDOW_HOURS,
  OPEN_TO_CHAT_SEND_COOLDOWN_SECONDS,
} from '@/lib/discovery/config';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260915195514_open_to_chat_limits.sql'),
  'utf8'
);
const drawerSource = readFileSync(join(process.cwd(), 'components/OpenToChatDrawer.tsx'), 'utf8');
const relationshipsSource = readFileSync(join(process.cwd(), 'lib/data/relationships.ts'), 'utf8');

describe('FIX-011 Open to Chat limits', () => {
  it('locks the founder-approved allowance contract', () => {
    assert.equal(OPEN_TO_CHAT_DAILY_LIMIT, 3);
    assert.equal(OPEN_TO_CHAT_PREMIUM_DAILY_LIMIT, 5);
    assert.equal(OPEN_TO_CHAT_ROLLING_WINDOW_HOURS, 24);
    assert.equal(OPEN_TO_CHAT_RECIPIENT_COOLDOWN_DAYS, 7);
    assert.equal(OPEN_TO_CHAT_SEND_COOLDOWN_SECONDS, 60);
  });

  it('enforces count, repeat-recipient, and burst limits atomically in PostgreSQL', () => {
    assert.match(migration, /pg_advisory_xact_lock/i);
    assert.match(migration, /v_daily_count >= 3/i);
    assert.match(migration, /interval '24 hours'/i);
    assert.match(migration, /interval '7 days'/i);
    assert.match(migration, /interval '60 seconds'/i);
  });

  it('does not trust a race-prone application precheck', () => {
    assert.doesNotMatch(relationshipsSource, /count_open_to_chat_sent_today/);
    assert.match(relationshipsSource, /retryAt:/);
  });

  it('explains the allowance without promising paid extras', () => {
    assert.match(drawerSource, /OPEN_TO_CHAT_ROLLING_WINDOW_HOURS/);
    assert.match(drawerSource, /-hour period/i);
    assert.match(drawerSource, /Requests do not carry over/i);
    assert.match(drawerSource, /same person once every/i);
    assert.doesNotMatch(drawerSource, /buy|purchase|bundle/i);
  });

  it('keeps authoritative limit failures visible inside the open drawer', () => {
    assert.match(drawerSource, /role="alert"/i);
    assert.match(drawerSource, /Available again/i);
    assert.match(drawerSource, /requests remain in your rolling/i);
    assert.match(drawerSource, /onAllowanceRequested/);
    assert.match(drawerSource, /disabled=\{sending\}/i);
  });
});
