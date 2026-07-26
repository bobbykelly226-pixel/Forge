import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  countTopLevelPgTapAssertions,
  parsePgTapPlan,
} from '@/lib/questionnaire/persistence/pgtap-plan';

describe('pgTAP plan helpers', () => {
  it('counts top-level assertions and ignores plan, finish, comments, and dollar quotes', () => {
    const sql = `
select plan(3);
-- select ok(true, 'commented out');
select ok(true, 'one');
select throws_ok($sql$
  select ok(false, 'nested inside dollar quote must not count');
$sql$, 'x');
select has_function('public', 'forge_example', array['uuid'], 'helper');
select * from finish();
`;
    assert.equal(parsePgTapPlan(sql), 3);
    assert.equal(countTopLevelPgTapAssertions(sql), 3);
  });
});
