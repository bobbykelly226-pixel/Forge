import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260915182458_open_to_chat_seven_day_expiration.sql'
  ),
  'utf8'
);
const drawerSource = readFileSync(join(process.cwd(), 'components/OpenToChatDrawer.tsx'), 'utf8');
const actionsSource = readFileSync(
  join(process.cwd(), 'components/discovery/DiscoveryActionTiles.tsx'),
  'utf8'
);
const hubSource = readFileSync(join(process.cwd(), 'lib/data/connections-hub.ts'), 'utf8');
const discoverySource = readFileSync(join(process.cwd(), 'lib/data/discovery.ts'), 'utf8');

describe('Open to Chat seven-day expiration', () => {
  it('assigns a fresh seven-day window on new and reactivated requests', () => {
    assert.match(migration, /expires_at set default \(now\(\) \+ interval '7 days'\)/i);
    assert.match(migration, /values \(v_uid, p_recipient_id, v_note, 'pending', now\(\) \+ interval '7 days'\)/i);
    assert.match(migration, /expires_at = excluded\.expires_at/i);
  });

  it('expires stale requests before resending or responding', () => {
    assert.match(migration, /status = 'expired'[\s\S]*coalesce\(r\.expires_at, r\.created_at \+ interval '7 days'\) <= now\(\)/i);
    assert.match(migration, /for update;[\s\S]*v_req\.expires_at[\s\S]*status = 'expired'/i);
    assert.match(migration, /'This request has expired\.'/i);
  });

  it('removes expired requests from active Discovery and Connections reads', () => {
    assert.match(hubSource, /\.in\('status', \['pending', 'deferred'\]\)[\s\S]*?\.gt\('expires_at', new Date\(\)\.toISOString\(\)\)/i);
    assert.match(discoverySource, /status\.eq\.accepted,expires_at\.gt\.\$\{new Date\(\)\.toISOString\(\)\}/i);
  });

  it('explains recipient choice, private outcomes, acceptance, expiration, and safety', () => {
    assert.match(drawerSource, /accept, privately decline, or simply let the request expire/i);
    assert.match(drawerSource, /will not receive a negative notification/i);
    assert.match(drawerSource, /conversation opens only if they accept/i);
    assert.match(drawerSource, /expires after seven[\s\S]*days/i);
    assert.match(drawerSource, /safety tools remain available/i);
  });

  it('keeps education available through a persistent accessible information icon', () => {
    assert.match(actionsSource, /aria-label="Learn about Open to Chat"/i);
    assert.match(actionsSource, /<Info[^>]+aria-hidden="true"/i);
    assert.doesNotMatch(actionsSource, /aria-label="Learn about Open to Chat"[\s\S]{0,400}<span>Learn more<\/span>/i);
  });
});
