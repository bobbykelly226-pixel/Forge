import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  executeRestartAttempt,
  type RestartOperation,
} from '@/lib/questionnaire/persistence/restart-coordinator';
import { QuestionSaveWorker } from '@/lib/questionnaire/persistence/save-worker';

describe('executeRestartAttempt (production restart coordinator)', () => {
  it('thrown category-restart response preserves the same operation ID for Retry', async () => {
    const seen: string[] = [];
    let pending: RestartOperation | null = null;
    let attempts = 0;

    const first = await executeRestartAttempt({
      pending,
      kind: 'category',
      categoryKey: 'relationship_vision_intentions',
      currentWriteGeneration: 4,
      execute: async (op) => {
        seen.push(op.operationId);
        attempts += 1;
        if (attempts === 1) {
          throw new Error('network down');
        }
        return { success: true, writeGeneration: 5 };
      },
    });
    assert.equal(first.result.success, false);
    if (!first.result.success) {
      assert.equal(first.result.transportError, true);
    }
    assert.ok(first.pending);
    assert.equal(first.applySuccess, false);
    pending = first.pending;

    const second = await executeRestartAttempt({
      pending,
      kind: 'category',
      categoryKey: 'relationship_vision_intentions',
      currentWriteGeneration: 4,
      execute: async (op) => {
        seen.push(op.operationId);
        return { success: true, writeGeneration: 5 };
      },
    });
    assert.equal(second.result.success, true);
    assert.equal(second.applySuccess, true);
    assert.equal(second.pending, null);
    assert.equal(seen[0], seen[1]);
    assert.equal(pending?.expectedWriteGeneration, 4);
  });

  it('thrown full-restart response preserves the same operation ID', async () => {
    const seen: string[] = [];
    let pending: RestartOperation | null = null;

    const first = await executeRestartAttempt({
      pending,
      kind: 'profile',
      currentWriteGeneration: 2,
      execute: async (op) => {
        seen.push(op.operationId);
        throw new Error('socket hang up');
      },
    });
    pending = first.pending;
    assert.ok(pending);

    const second = await executeRestartAttempt({
      pending,
      kind: 'profile',
      currentWriteGeneration: 2,
      execute: async (op) => {
        seen.push(op.operationId);
        return { success: true, writeGeneration: 3 };
      },
    });
    assert.equal(second.result.success, true);
    assert.equal(seen[0], seen[1]);
  });

  it('transport-classified returned failure preserves the operation', async () => {
    const first = await executeRestartAttempt({
      pending: null,
      kind: 'category',
      categoryKey: 'family_children_parenting',
      currentWriteGeneration: 1,
      execute: async () => ({
        success: false,
        message: 'Could not restart this category. Try again.',
        transportError: true,
      }),
    });
    assert.ok(first.pending);
    assert.equal(first.applySuccess, false);
  });

  it('authoritative failure abandons the operation', async () => {
    const first = await executeRestartAttempt({
      pending: null,
      kind: 'category',
      categoryKey: 'family_children_parenting',
      currentWriteGeneration: 1,
      execute: async () => ({
        success: false,
        message: 'Your Compatibility Profile was restarted. Reload and try again.',
        code: 'stale_generation',
        transportError: false,
      }),
    });
    assert.equal(first.pending, null);
    assert.equal(first.applySuccess, false);
  });

  it('idempotency_conflict abandons and a new attempt gets a new operation ID', async () => {
    const abandoned = await executeRestartAttempt({
      pending: null,
      kind: 'profile',
      currentWriteGeneration: 7,
      execute: async () => ({
        success: false,
        message: 'This operation id was already used with a different request.',
        code: 'idempotency_conflict',
        transportError: false,
      }),
    });
    assert.equal(abandoned.pending, null);

    const ids: string[] = [];
    const next = await executeRestartAttempt({
      pending: null,
      kind: 'profile',
      currentWriteGeneration: 7,
      execute: async (op) => {
        ids.push(op.operationId);
        return { success: true, writeGeneration: 8 };
      },
    });
    assert.equal(next.result.success, true);
    assert.equal(ids.length, 1);
    assert.ok(ids[0]);
  });

  it('successful category restart path reports applySuccess without resetting untouched revisions', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('relationship_vision_intentions_q01', 6);
    worker.setRevision('family_children_parenting_q01', 3);

    const attempt = await executeRestartAttempt({
      pending: null,
      kind: 'category',
      categoryKey: 'relationship_vision_intentions',
      currentWriteGeneration: 2,
      execute: async () => ({ success: true, writeGeneration: 3 }),
    });
    assert.equal(attempt.applySuccess, true);
    assert.equal(attempt.pending, null);

    // Production shell applies these only after applySuccess.
    worker.bumpGeneration();
    worker.resetQuestions([
      'relationship_vision_intentions_q01',
      'relationship_vision_intentions_q02',
    ]);
    assert.equal(worker.getRevision('relationship_vision_intentions_q01'), 0);
    assert.equal(worker.getRevision('family_children_parenting_q01'), 3);
  });

  it('failed restart does not apply success side effects (no revision reset)', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 9);
    const attempt = await executeRestartAttempt({
      pending: null,
      kind: 'category',
      categoryKey: 'relationship_vision_intentions',
      currentWriteGeneration: 1,
      execute: async () => {
        throw new Error('failed');
      },
    });
    assert.equal(attempt.applySuccess, false);
    assert.ok(attempt.pending);
    // Shell must not call resetQuestions when applySuccess is false.
    assert.equal(worker.getRevision('q1'), 9);
  });

  it('successful full restart resets every revision when shell applies side effects', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('a', 2);
    worker.setRevision('b', 5);
    const attempt = await executeRestartAttempt({
      pending: null,
      kind: 'profile',
      currentWriteGeneration: 0,
      execute: async () => ({ success: true, writeGeneration: 1 }),
    });
    assert.equal(attempt.applySuccess, true);
    worker.bumpGeneration();
    worker.resetAllQuestions();
    assert.equal(worker.getRevision('a'), 0);
    assert.equal(worker.getRevision('b'), 0);
  });

  it('delayed pre-restart completion cannot restore an obsolete revision after reset', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 5);
    const oldGeneration = worker.getGeneration();
    let resolveGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      resolveGate = resolve;
    });

    const stale = worker.enqueue(
      'q1',
      { answer: { value: 'stale' }, generation: oldGeneration },
      async () => {
        await gate;
        return { success: true as const, data: { revision: 6 } };
      }
    );

    const restart = await executeRestartAttempt({
      pending: null,
      kind: 'category',
      categoryKey: 'cat',
      currentWriteGeneration: 1,
      execute: async () => ({ success: true, writeGeneration: 2 }),
    });
    assert.equal(restart.applySuccess, true);
    worker.bumpGeneration();
    worker.resetQuestions(['q1']);
    assert.equal(worker.getRevision('q1'), 0);

    resolveGate();
    const staleResult = await stale;
    assert.equal(staleResult.ok, false);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(worker.getRevision('q1'), 0);
  });
});
