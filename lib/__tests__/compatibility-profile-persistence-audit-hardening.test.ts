import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  emptyPersistedAnswer,
  sanitizeAnswerAgainstCatalog,
} from '@/lib/questionnaire/persistence/answer-state';
import { SAVE_STATUS_COPY } from '@/lib/questionnaire/persistence/copy';
import { QuestionSaveQueue } from '@/lib/questionnaire/persistence/save-queue';
import { getQuestionnaireCatalog } from '@/lib/questionnaire/catalog';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Compatibility Profile Persistence V1 audit hardening', () => {
  const migration = read(
    'supabase/migrations/20260725000000_compatibility_profile_persistence_v1.sql'
  );
  const dataLayer = read('lib/data/questionnaire.ts');
  const actions = read('app/actions/questionnaire.ts');
  const shell = read('components/compatibility-profile/CompatibilityProfileShell.tsx');
  const catalog = getQuestionnaireCatalog();

  it('enforces catalog integrity inside save_my_questionnaire_response', () => {
    assert.match(migration, /Too many choices were selected for this question/);
    assert.match(migration, /Mutually exclusive choices cannot be combined/);
    assert.match(migration, /Priority choices must be selected base choices/);
    assert.match(migration, /priority choices are excluded/);
    assert.match(migration, /priority choices are not eligible/);
    assert.match(migration, /Priority selections must match the required count/);
    assert.match(migration, /Optional context is not enabled for one or more choices/);
    assert.match(migration, /Identity fields are not configured for this question/);
    assert.match(migration, /v_derived_state/);
    assert.match(migration, /v_derived_qualifiers/);
    // Client trusted state/qualifiers removed from RPC signature.
    assert.doesNotMatch(
      migration,
      /p_response_state public\.questionnaire_response_state/
    );
    assert.doesNotMatch(
      migration,
      /p_active_qualifiers public\.questionnaire_response_qualifier/
    );
  });

  it('uses server authoritative revision CAS and write generation protection', () => {
    assert.match(migration, /p_expected_revision/);
    assert.match(migration, /p_expected_write_generation/);
    assert.match(migration, /write_generation/);
    assert.match(migration, /stale_revision/);
    assert.match(migration, /stale_generation/);
    assert.match(migration, /revision = v_new_revision/);
    // Equal expected revisions cannot rewrite without increment.
    assert.match(migration, /coalesce\(v_existing_revision, 0\) <> coalesce\(p_expected_revision, 0\)/);
  });

  it('keeps clear tombstones so delayed saves cannot resurrect cleared answers', () => {
    assert.match(migration, /response_state = 'unanswered'/);
    assert.match(
      migration,
      /create or replace function public\.clear_my_questionnaire_question/
    );
    // Clear must bump revision rather than hard-delete without a tombstone path.
    assert.match(
      migration,
      /clear_my_questionnaire_question[\s\S]*revision = v_new_revision/
    );
    assert.match(dataLayer, /Preserve tombstone revisions/);
  });

  it('bumps write generation on category and full restart to block delayed saves', () => {
    assert.match(
      migration,
      /clear_my_questionnaire_category[\s\S]*write_generation = v_new_generation/
    );
    assert.match(
      migration,
      /clear_my_questionnaire_profile[\s\S]*write_generation = v_new_generation/
    );
  });

  it('derives completion in the database and rejects client completed status', () => {
    assert.match(migration, /forge_recalculate_questionnaire_progress/);
    assert.match(migration, /forge_question_currently_eligible/);
    assert.match(migration, /forge_questionnaire_response_is_complete/);
    assert.match(
      migration,
      /forge_user_open_to_parenting_or_stepparenting_role/
    );
    assert.doesNotMatch(
      migration,
      /p_status public\.questionnaire_progress_status/
    );
    assert.doesNotMatch(dataLayer, /p_status:/);
    assert.doesNotMatch(actions, /status\?: 'not_started' \| 'in_progress' \| 'completed'/);
    assert.doesNotMatch(shell, /status:\s*'completed'/);
  });

  it('awaits progress saves and surfaces retriable progress failures', () => {
    assert.match(shell, /async function persistProgress/);
    assert.match(shell, /await saveCompatibilityProgressAction/);
    assert.doesNotMatch(shell, /void saveCompatibilityProgressAction/);
    assert.match(shell, /SAVE_STATUS_COPY\.progressError|progressError/);
    assert.match(shell, /pendingProgress/);
    assert.match(shell, /retryPendingSave/);
    assert.equal(
      SAVE_STATUS_COPY.progressError,
      'Could not save your progress. Try again.'
    );
  });

  it('does not send client derived response state or qualifiers to the save RPC', () => {
    assert.doesNotMatch(dataLayer, /p_response_state:/);
    assert.doesNotMatch(dataLayer, /p_active_qualifiers:/);
    assert.doesNotMatch(dataLayer, /p_client_mutation:/);
    assert.match(dataLayer, /p_expected_revision:/);
    assert.match(dataLayer, /p_expected_write_generation:/);
  });

  it('keeps local sanitize behavior for UI while DB remains authoritative', () => {
    const question = catalog.categories[0].questions[0];
    const foreign = catalog.categories[1].questions[0].choices[0].id;
    const sanitized = sanitizeAnswerAgainstCatalog(question, {
      ...emptyPersistedAnswer(),
      selectedChoiceIds: [foreign, question.choices[0].id],
      revision: 3,
    });
    assert.deepEqual(sanitized.selectedChoiceIds, [question.choices[0].id]);
    assert.equal(sanitized.revision, 3);
  });

  it('coalesces local save tokens without advancing server revision locally', async () => {
    const queue = new QuestionSaveQueue();
    const seenExpected: number[] = [];
    let resolveSlow: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      resolveSlow = resolve;
    });

    const first = queue.enqueue('q1', 1, async () => {
      await gate;
      seenExpected.push(1);
      return { success: true as const, data: { revision: 5 } };
    });
    const second = queue.enqueue('q1', 2, async () => {
      seenExpected.push(2);
      return { success: true as const, data: { revision: 5 } };
    });
    resolveSlow?.();
    const [a, b] = await Promise.all([first, second]);
    assert.ok(a.ok);
    assert.ok(b.ok);
    assert.ok(seenExpected.includes(2));
  });

  it('documents authenticated RPC bypass rejection contracts in SQL', () => {
    // Executable against a linked DB once available.
    const contracts = [
      'One or more choices are invalid for this question.',
      'Too many choices were selected for this question.',
      'Mutually exclusive choices cannot be combined.',
      'Priority choices must be selected base choices.',
      'A newer answer is already saved.',
      'Your Compatibility Profile was restarted. Reload and try again.',
    ];
    for (const message of contracts) {
      assert.match(migration, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});
