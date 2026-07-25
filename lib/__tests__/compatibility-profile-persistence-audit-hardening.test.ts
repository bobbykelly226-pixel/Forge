import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  emptyPersistedAnswer,
  sanitizeAnswerAgainstCatalog,
} from '@/lib/questionnaire/persistence/answer-state';
import { SAVE_STATUS_COPY } from '@/lib/questionnaire/persistence/copy';
import { QuestionSaveWorker } from '@/lib/questionnaire/persistence/save-worker';
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
  const dbTest = read('supabase/tests/compatibility_profile_persistence_v1.test.sql');

  it('enforces catalog integrity inside save_my_questionnaire_response', () => {
    assert.match(migration, /Too many choices were selected for this question/);
    assert.match(migration, /Mutually exclusive choices cannot be combined/);
    assert.match(migration, /Priority choices must be selected base choices/);
    assert.match(migration, /priority choices are excluded/);
    assert.match(migration, /priority choices are not eligible/);
    assert.match(migration, /Priority selections must match the required count/);
    assert.match(migration, /Optional context is not enabled for one or more choices/);
    assert.match(migration, /Identity fields are not configured for this question/);
    assert.match(migration, /Duplicate choice keys are not allowed/);
    assert.match(migration, /Duplicate priority choice keys are not allowed/);
    assert.match(migration, /v_derived_state/);
    assert.match(migration, /v_derived_qualifiers/);
    assert.doesNotMatch(
      migration,
      /p_response_state public\.questionnaire_response_state/
    );
    assert.doesNotMatch(
      migration,
      /p_active_qualifiers public\.questionnaire_response_qualifier/
    );
  });

  it('closes the authenticated direct table write bypass', () => {
    assert.match(
      migration,
      /revoke insert, update, delete on public\.user_questionnaire_progress/i
    );
    assert.match(
      migration,
      /revoke insert, update, delete on public\.user_questionnaire_responses/i
    );
    assert.match(
      migration,
      /revoke insert, update, delete on public\.user_questionnaire_selected_choices/i
    );
    assert.match(
      migration,
      /revoke insert, update, delete on public\.user_questionnaire_priority_selections/i
    );
    assert.match(migration, /drop policy if exists user_questionnaire_responses_insert_own/);
    assert.match(migration, /drop policy if exists user_questionnaire_responses_update_own/);
    assert.match(migration, /drop policy if exists user_questionnaire_responses_delete_own/);
    assert.match(migration, /grant select on public\.user_questionnaire_responses to authenticated/);
    assert.match(migration, /has_table_privilege\('authenticated'/);
    assert.doesNotMatch(dataLayer, /\.from\('user_questionnaire_responses'\)\s*\.insert/);
    assert.doesNotMatch(dataLayer, /\.from\('user_questionnaire_progress'\)\s*\.update/);
    assert.doesNotMatch(shell, /\.from\('user_questionnaire_/);
  });

  it('uses server authoritative revision CAS, write generation, and operation idempotency', () => {
    assert.match(migration, /p_expected_revision/);
    assert.match(migration, /p_expected_write_generation/);
    assert.match(migration, /p_operation_id/);
    assert.match(migration, /user_questionnaire_write_operations/);
    assert.match(migration, /forge_questionnaire_resolve_operation/);
    assert.match(migration, /idempotency_conflict/);
    assert.match(migration, /target_key/);
    assert.match(migration, /write_generation/);
    assert.match(migration, /stale_revision/);
    assert.match(migration, /stale_generation/);
    assert.match(migration, /revision = v_new_revision/);
    assert.match(migration, /coalesce\(v_existing_revision, 0\) <> coalesce\(p_expected_revision, 0\)/);
    assert.match(dataLayer, /p_operation_id/);
    assert.match(actions, /operationId: string/);
  });

  it('persists explicit empty answers for min_selections = 0 without tombstoning them', () => {
    assert.match(migration, /min_selections = 0/);
    assert.match(migration, /Empty choices: optional questions/);
    assert.match(migration, /v_derived_state := 'answered'/);
    assert.match(dataLayer, /minSelections > 0/);
    assert.match(dbTest, /family_children_parenting_q04/);
  });

  it('keeps clear tombstones so delayed saves cannot resurrect cleared answers', () => {
    assert.match(migration, /response_state = 'unanswered'/);
    assert.match(
      migration,
      /create or replace function public\.clear_my_questionnaire_question/
    );
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
    assert.match(shell, /saveWorkerRef\.current\.bumpGeneration/);
    assert.match(shell, /resetQuestions|resetAllQuestions/);
    assert.match(shell, /executeRestartAttempt/);
    assert.match(shell, /pendingRestartRef/);
  });

  it('derives completion in the database and rejects client completed status', () => {
    assert.match(migration, /forge_recalculate_questionnaire_progress/);
    assert.match(migration, /forge_question_currently_eligible/);
    assert.match(migration, /forge_questionnaire_response_is_complete/);
    assert.match(
      migration,
      /forge_user_open_to_parenting_or_stepparenting_role/
    );
    assert.match(migration, /v_has_resume_position/);
    assert.doesNotMatch(
      migration,
      /p_status public\.questionnaire_progress_status/
    );
    assert.doesNotMatch(dataLayer, /p_status:/);
    assert.doesNotMatch(actions, /status\?: 'not_started' \| 'in_progress' \| 'completed'/);
    assert.doesNotMatch(shell, /status:\s*'completed'/);
  });

  it('saves progress before navigation and keeps mutable resume state', () => {
    assert.match(shell, /async function persistProgress/);
    assert.match(shell, /await saveCompatibilityProgressAction/);
    assert.doesNotMatch(shell, /void saveCompatibilityProgressAction/);
    assert.match(shell, /savedProgress/);
    assert.match(shell, /setSavedProgress/);
    assert.doesNotMatch(
      shell,
      /initialProgress\.categoryKey === category\.id/
    );
    assert.match(shell, /async function handleBegin/);
    assert.match(shell, /async function handleBack/);
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

  it('uses QuestionSaveWorker so in-flight revision returns are always consumed', async () => {
    assert.match(shell, /QuestionSaveWorker/);
    assert.doesNotMatch(shell, /QuestionSaveQueue/);
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 7);
    const generation = worker.getGeneration();
    let resolveSlow: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      resolveSlow = resolve;
    });
    const seen: number[] = [];

    const first = worker.enqueue('q1', { answer: { n: 1 }, generation }, async (args) => {
      seen.push(args.expectedRevision);
      await gate;
      return { success: true as const, data: { revision: 8 } };
    });
    const second = worker.enqueue('q1', { answer: { n: 2 }, generation }, async (args) => {
      seen.push(args.expectedRevision);
      return { success: true as const, data: { revision: 9 } };
    });
    resolveSlow?.();
    const [a, b] = await Promise.all([first, second]);
    assert.ok(a.ok);
    assert.ok(b.ok);
    assert.deepEqual(seen, [7, 8]);
    assert.equal(worker.getRevision('q1'), 9);
  });

  it('ships executable pgTAP database tests rather than regex-only RPC proofs', () => {
    assert.match(dbTest, /select plan\(/);
    assert.match(dbTest, /save_my_questionnaire_response/);
    assert.match(dbTest, /authenticated lacks INSERT\/UPDATE\/DELETE on user_questionnaire_progress/);
    assert.match(dbTest, /authenticated lacks all privileges on user_questionnaire_write_operations/);
    assert.match(dbTest, /same operation_id retry/);
    assert.match(dbTest, /idempotency_conflict/);
    assert.match(dbTest, /clear tombstone prevents resurrection/);
    assert.match(dbTest, /family_children_parenting_q04/);
  });

  it('retains transport-failed save attempts for same-operation Retry', () => {
    assert.match(shell, /transportError/);
    assert.match(shell, /hasRetainedAttempt/);
    assert.match(shell, /saveWorkerRef\.current\.retry/);
    const workerSource = read('lib/questionnaire/persistence/save-worker.ts');
    assert.match(workerSource, /retainedAttempt/);
    assert.match(workerSource, /transportError/);
    assert.match(workerSource, /resetQuestions/);
    assert.match(workerSource, /resetAllQuestions/);
  });

  it('drops legacy mutation overloads and requires operation_id', () => {
    assert.match(migration, /legacy questionnaire mutation overloads still present/);
    assert.match(migration, /hardened operation_id RPC signatures missing/);
    assert.match(migration, /operation_id_required/);
    assert.match(
      migration,
      /drop function if exists public\.save_my_questionnaire_response\(text, text, text\[\], text\[\], jsonb, jsonb, bigint, bigint\)/
    );
    assert.match(
      migration,
      /create or replace function public\.save_my_questionnaire_response\(\s*p_version_key text,\s*p_question_key text,\s*p_choice_keys text\[\],\s*p_operation_id uuid,/
    );
    assert.match(dataLayer, /operationId: string/);
    assert.doesNotMatch(dataLayer, /p_operation_id: input\.operationId \?\? undefined/);
    assert.match(actions, /operationId: string/);
    assert.match(shell, /executeRestartAttempt/);
    const coordinator = read('lib/questionnaire/persistence/restart-coordinator.ts');
    assert.match(coordinator, /export async function executeRestartAttempt/);
  });

  it('preserves structured database error codes through rpcResult', () => {
    assert.match(dataLayer, /transportError: true/);
    assert.match(dataLayer, /transportError: false/);
    assert.match(dataLayer, /code: typeof payload\.code === 'string'/);
    assert.doesNotMatch(shell, /outcome\.message\.includes\('newer answer'\)/);
    assert.doesNotMatch(shell, /outcome\.message\.includes\('restarted'\)/);
  });

  it('documents authenticated RPC bypass rejection contracts in SQL', () => {
    const contracts = [
      'One or more choices are invalid for this question.',
      'Too many choices were selected for this question.',
      'Mutually exclusive choices cannot be combined.',
      'Priority choices must be selected base choices.',
      'A newer answer is already saved.',
      'Your Compatibility Profile was restarted. Reload and try again.',
      'Duplicate choice keys are not allowed.',
    ];
    for (const message of contracts) {
      assert.match(migration, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});
