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

const DOLLAR_TAG = /\$([A-Za-z_]*)\$/g;

/**
 * Returns the number of top-level `select <tap_fn>(...)` assertions,
 * ignoring `plan` / `finish`, SQL comments, and dollar-quoted bodies.
 */
export function countTopLevelPgTapAssertions(sql: string): number {
  let dollarTag: string | null = null;
  let count = 0;

  for (const rawLine of sql.split(/\r?\n/)) {
    const startedInside = dollarTag !== null;
    let visible = '';
    let i = 0;

    while (i < rawLine.length) {
      DOLLAR_TAG.lastIndex = i;
      const match = DOLLAR_TAG.exec(rawLine);
      if (!match || match.index === undefined) {
        if (dollarTag === null) visible += rawLine.slice(i);
        break;
      }

      const tag = match[0];
      const at = match.index;

      if (dollarTag === null) {
        // Outside quotes: keep text before the opener, then enter the quote.
        visible += rawLine.slice(i, at);
        dollarTag = tag;
        i = at + tag.length;
        continue;
      }

      if (tag === dollarTag) {
        // Close current dollar quote; discard quoted content.
        dollarTag = null;
        i = at + tag.length;
        continue;
      }

      // Different tag inside an open quote — still quoted content.
      i = at + tag.length;
    }

    if (startedInside) continue;

    const trimmed = visible.trim();
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
