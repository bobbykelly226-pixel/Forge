/**
 * Count top-level pgTAP assertion calls in a committed SQL test file.
 * Used by audit tests so `select plan(N)` cannot silently drift.
 */

const TAP_ASSERTION_FNS = new Set([
  'ok',
  'is',
  'isnt',
  'isnt_empty',
  'is_empty',
  'throws_ok',
  'lives_ok',
  'dies_ok',
  'isa_ok',
  'matches',
  'doesnt_match',
  'alike',
  'unalike',
  'results_eq',
  'results_ne',
  'bag_eq',
  'bag_ne',
  'set_eq',
  'set_ne',
  'row_eq',
  'cmp_ok',
  'pass',
  'fail',
  'has_function',
  'has_table',
  'has_column',
  'has_view',
  'has_type',
  'has_index',
  'has_pk',
  'has_fk',
  'has_trigger',
  'has_schema',
  'has_role',
  'can',
  'can_ok',
  'is_definer',
  'has_security_definer',
  'function_privs_are',
  'table_privs_are',
  'policy_cmd_is',
  'has_policy',
  'policies_are',
]);

/**
 * Returns the number of top-level `select <tap_fn>(...)` assertions,
 * ignoring `plan` / `finish`, SQL comments, and dollar-quoted bodies.
 */
export function countTopLevelPgTapAssertions(sql: string): number {
  const dollarStack: string[] = [];
  let count = 0;

  for (const line of sql.split(/\r?\n/)) {
    let pos = 0;
    while (pos < line.length) {
      const match = /\$([A-Za-z_]*)\$/.exec(line.slice(pos));
      if (!match || match.index === undefined) break;
      const tag = match[0];
      const at = pos + match.index;
      if (dollarStack.length > 0 && dollarStack[dollarStack.length - 1] === tag) {
        dollarStack.pop();
      } else if (dollarStack.length === 0) {
        dollarStack.push(tag);
      }
      pos = at + tag.length;
    }

    if (dollarStack.length > 0) continue;

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;

    const call = /^select\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/i.exec(trimmed);
    if (!call) continue;

    const fn = call[1].toLowerCase();
    if (fn === 'plan' || fn === 'finish') continue;
    if (TAP_ASSERTION_FNS.has(fn)) count += 1;
  }

  return count;
}

/** Parse `select plan(N);` from a pgTAP SQL file. */
export function parsePgTapPlan(sql: string): number | null {
  const match = /select\s+plan\s*\(\s*(\d+)\s*\)\s*;/i.exec(sql);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}
