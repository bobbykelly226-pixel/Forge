import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  ARCHITECTURE_COVERAGE_EXAMPLES,
  FORMAT_LABEL_TO_BEHAVIOR,
  FOUNDATION_CAPABILITY_MANIFEST,
  MASTER_ELIGIBILITY_DESCRIPTION,
  MASTER_FORMAT_LABELS,
  MASTER_STRUCTURE_COUNTS,
  resolveResponseBehavior,
} from '@/lib/questionnaire/architecture-coverage';
import { RESPONSE_BEHAVIORS, RESPONSE_STATES } from '@/lib/questionnaire/types';
import { getQuestionnaireCatalog } from '@/lib/questionnaire/catalog';

const MASTER_PATH =
  '/home/ubuntu/.cursor/projects/workspace/uploads/Forge-Compatibility-Profile-150-Final-Locked-Questions_d20f.md';

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readMaster(): string {
  try {
    return readFileSync(MASTER_PATH, 'utf8');
  } catch {
    // CI / environments without the upload still validate against the fixture + manifest.
    return readRepo('lib/questionnaire/fixtures/category-01-master-excerpt.md');
  }
}

describe('questionnaire architecture coverage (ten-category master)', () => {
  it('maps every distinct HQ format label to a reusable response behavior', () => {
    assert.equal(MASTER_FORMAT_LABELS.length, MASTER_STRUCTURE_COUNTS.distinctFormatLabels);
    for (const label of MASTER_FORMAT_LABELS) {
      const behavior = resolveResponseBehavior(label);
      assert.ok(RESPONSE_BEHAVIORS.includes(behavior), label);
      assert.equal(FORMAT_LABEL_TO_BEHAVIOR[label], behavior);
    }
    // All five reusable behaviors are exercised by the master labels.
    const used = new Set(Object.values(FORMAT_LABEL_TO_BEHAVIOR));
    for (const behavior of RESPONSE_BEHAVIORS) {
      assert.ok(used.has(behavior), `unused behavior: ${behavior}`);
    }
  });

  it('covers structural feature counts required by the authoritative master', () => {
    assert.equal(MASTER_STRUCTURE_COUNTS.questions, 150);
    assert.equal(MASTER_STRUCTURE_COUNTS.contextNotes, 31);
    assert.equal(MASTER_STRUCTURE_COUNTS.implementationNotes, 18);
    assert.equal(MASTER_STRUCTURE_COUNTS.eligibilityRuleAttachments, 3);
    assert.equal(MASTER_STRUCTURE_COUNTS.priorityFollowUps, 38);
    assert.equal(MASTER_STRUCTURE_COUNTS.selectAllThatApply, 9);
    assert.equal(MASTER_STRUCTURE_COUNTS.conditionalScenarioQuestions, 4);
    assert.equal(MASTER_STRUCTURE_COUNTS.structuredIdentitySelections, 2);
  });

  it('declares foundation capabilities for notes, eligibility, select-all, and priority exclusions', () => {
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.exactFormatLabelPreservedSeparately, true);
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.contextNotes, true);
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.implementationNotes, true);
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.eligibilityRulesInCatalog, true);
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.conditionalScenarioQuestions, true);
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.selectAllThatApply, true);
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.mutuallyExclusiveChoices, true);
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.priorityFollowUps.excludedChoices, true);
    assert.equal(
      FOUNDATION_CAPABILITY_MANIFEST.priorityFollowUps.minEligibleSelectionsBeforeDisplay,
      true
    );
    assert.equal(FOUNDATION_CAPABILITY_MANIFEST.priorityFollowUps.unorderedSelections, true);
    assert.ok(FOUNDATION_CAPABILITY_MANIFEST.specialResponseStates.includes('no_preference'));
    assert.ok(FOUNDATION_CAPABILITY_MANIFEST.specialResponseStates.includes('context_dependent'));
    assert.ok(FOUNDATION_CAPABILITY_MANIFEST.specialResponseStates.includes('current_priority'));
    for (const state of FOUNDATION_CAPABILITY_MANIFEST.specialResponseStates) {
      assert.ok(RESPONSE_STATES.includes(state));
    }
  });

  it('includes compact examples for every advanced structural pattern without importing Categories 2–10', () => {
    const featureSet = new Set<string>(
      ARCHITECTURE_COVERAGE_EXAMPLES.flatMap((example) => [...example.features])
    );
    const requiredFeatures = [
      'select_all',
      'structured_identity',
      'named_scale_via_format_label',
      'separate_no_preference_state',
      'separate_context_dependent_state',
      'current_priority_state',
      'conditional_scenario',
      'eligibility_rule',
      'priority_excluded_choices',
      'priority_min_eligible_before_display',
      'mutually_exclusive_choice',
    ];
    for (const required of requiredFeatures) {
      assert.ok(featureSet.has(required), required);
    }

    // Live catalog still only contains Category 1.
    const catalog = getQuestionnaireCatalog();
    assert.equal(catalog.categories.length, 1);
    assert.equal(catalog.categories[0].number, 1);
    assert.equal(catalog.eligibilityRules.length, 0);
  });

  it('keeps the master eligibility wording available for future category attachments', () => {
    assert.match(
      MASTER_ELIGIBILITY_DESCRIPTION,
      /Display only when the user has children/
    );
    const master = readMaster();
    if (master.includes('## Category 6')) {
      const count = master.split('**Eligibility:**').length - 1;
      assert.equal(count, MASTER_STRUCTURE_COUNTS.eligibilityRuleAttachments);
      assert.ok(master.includes(MASTER_ELIGIBILITY_DESCRIPTION));
    }
  });

  it('encodes architecture capabilities in the migration SQL', () => {
    const migration = readRepo(
      'supabase/migrations/20260723000000_questionnaire_foundation.sql'
    );
    assert.match(migration, /questionnaire_response_behavior/);
    assert.match(migration, /format_label text not null/);
    assert.match(migration, /context_note text null/);
    assert.match(migration, /implementation_note text null/);
    assert.match(migration, /eligibility_rule_id/);
    assert.match(migration, /is_conditional boolean/);
    assert.match(migration, /select_all_that_apply boolean/);
    assert.match(migration, /priority_excluded_choice_keys/);
    assert.match(migration, /priority_eligible_choice_keys/);
    assert.match(migration, /priority_min_eligible_selections/);
    assert.match(migration, /current_priority/);
    assert.match(migration, /forge_questionnaire_selected_choice_integrity/);
    assert.match(migration, /selected choices exceed max_selections/);
    assert.match(migration, /mutually exclusive choice cannot combine/);
    assert.match(migration, /forge_questionnaire_progress_category_version_match/);
    assert.match(
      migration,
      /current_category must belong to the same questionnaire version/
    );
  });
});
