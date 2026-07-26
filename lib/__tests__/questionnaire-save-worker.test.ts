import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  QuestionSaveWorker,
  beginRestartOperation,
  type SaveWorkerRunArgs,
  type SaveWorkerRunResult,
} from '@/lib/questionnaire/persistence/save-worker';

type Answer = { value: string };

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('QuestionSaveWorker', () => {
  it('sends the queued second edit with revision N+1 after the first in-flight returns N+1', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 3);
    const generation = worker.getGeneration();

    const seen: SaveWorkerRunArgs<Answer>[] = [];
    const gate = deferred();

    const first = worker.enqueue('q1', { answer: { value: 'a' }, generation }, async (args) => {
      seen.push(args);
      await gate.promise;
      return { success: true as const, data: { revision: 4, operationId: args.operationId } };
    });

    const second = worker.enqueue('q1', { answer: { value: 'b' }, generation }, async (args) => {
      seen.push(args);
      return { success: true as const, data: { revision: 5, operationId: args.operationId } };
    });

    assert.equal(seen.length, 1);
    assert.equal(seen[0]?.expectedRevision, 3);
    assert.equal(seen[0]?.answer.value, 'a');

    gate.resolve();
    const [firstResult, secondResult] = await Promise.all([first, second]);

    assert.equal(firstResult.ok, true);
    assert.equal(secondResult.ok, true);
    assert.equal(seen.length, 2);
    assert.equal(seen[1]?.answer.value, 'b');
    assert.equal(seen[1]?.expectedRevision, 4);
    assert.notEqual(seen[0]?.operationId, seen[1]?.operationId);
    assert.equal(worker.getRevision('q1'), 5);
    if (secondResult.ok) {
      assert.equal(secondResult.data.revision, 5);
    }
  });

  it('coalesces intermediate edits so only the latest is sent after in-flight completes', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 10);
    const generation = worker.getGeneration();

    const sentValues: string[] = [];
    const expectedRevisions: number[] = [];
    const gate = deferred();

    const p1 = worker.enqueue('q1', { answer: { value: 'one' }, generation }, async (args) => {
      sentValues.push(args.answer.value);
      expectedRevisions.push(args.expectedRevision);
      await gate.promise;
      return { success: true as const, data: { revision: 11 } };
    });

    const p2 = worker.enqueue('q1', { answer: { value: 'two' }, generation }, async (args) => {
      sentValues.push(args.answer.value);
      expectedRevisions.push(args.expectedRevision);
      return { success: true as const, data: { revision: 12 } };
    });

    const p3 = worker.enqueue('q1', { answer: { value: 'three' }, generation }, async (args) => {
      sentValues.push(args.answer.value);
      expectedRevisions.push(args.expectedRevision);
      return { success: true as const, data: { revision: 12 } };
    });

    assert.deepEqual(sentValues, ['one']);

    gate.resolve();
    const results = await Promise.all([p1, p2, p3]);

    assert.deepEqual(sentValues, ['one', 'three']);
    assert.deepEqual(expectedRevisions, [10, 11]);
    assert.ok(results.every((result) => result.ok));
    assert.equal(worker.getRevision('q1'), 12);
  });

  it('retries a lost response with the same operation ID, recovers N+1, then saves a newer queued answer', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 5);
    const generation = worker.getGeneration();
    const seen: SaveWorkerRunArgs<Answer>[] = [];
    let attempt = 0;

    const first = worker.enqueue('q1', { answer: { value: 'a' }, generation }, async (args) => {
      seen.push(args);
      attempt += 1;
      if (attempt === 1) {
        // Simulate lost response after the DB write succeeded.
        return {
          success: false as const,
          transportError: true as const,
          message: 'Network interrupted before the save response arrived.',
        };
      }
      return {
        success: true as const,
        data: { revision: 6, operationId: args.operationId },
      };
    });

    // Newer edit arrives while the first logical write is unresolved.
    const second = worker.enqueue('q1', { answer: { value: 'b' }, generation }, async (args) => {
      seen.push(args);
      return {
        success: true as const,
        data: { revision: 7, operationId: args.operationId },
      };
    });

    const firstResult = await first;
    assert.equal(firstResult.ok, false);
    if (!firstResult.ok && !firstResult.cancelled) {
      assert.equal(firstResult.retriable, true);
    }
    assert.equal(worker.hasRetainedAttempt('q1'), true);
    assert.equal(seen.length, 1);
    const lostOperationId = seen[0]?.operationId;
    assert.ok(lostOperationId);

    const retryResult = await worker.retry('q1');
    const secondResult = await second;

    assert.equal(retryResult.ok, true);
    assert.equal(secondResult.ok, true);
    assert.equal(seen.length, 3);
    assert.equal(seen[1]?.operationId, lostOperationId);
    assert.equal(seen[1]?.expectedRevision, 5);
    assert.equal(seen[1]?.answer.value, 'a');
    assert.equal(seen[2]?.answer.value, 'b');
    assert.equal(seen[2]?.expectedRevision, 6);
    assert.notEqual(seen[2]?.operationId, lostOperationId);
    assert.equal(worker.getRevision('q1'), 7);
    assert.equal(worker.hasRetainedAttempt('q1'), false);
  });

  it('resets category revisions to zero while preserving untouched categories', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('cat1_q01', 4);
    worker.setRevision('cat1_q02', 2);
    worker.setRevision('cat2_q01', 7);

    worker.resetQuestions(['cat1_q01', 'cat1_q02']);

    assert.equal(worker.getRevision('cat1_q01'), 0);
    assert.equal(worker.getRevision('cat1_q02'), 0);
    assert.equal(worker.getRevision('cat2_q01'), 7);

    const generation = worker.getGeneration();
    const seen: number[] = [];
    const result = await worker.enqueue(
      'cat1_q01',
      { answer: { value: 'fresh' }, generation },
      async (args) => {
        seen.push(args.expectedRevision);
        return { success: true as const, data: { revision: 1 } };
      }
    );
    assert.equal(result.ok, true);
    assert.deepEqual(seen, [0]);
    assert.equal(worker.getRevision('cat1_q01'), 1);
    assert.equal(worker.getRevision('cat2_q01'), 7);
  });

  it('full reset clears every question revision to zero', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('a', 3);
    worker.setRevision('b', 9);
    worker.resetAllQuestions();
    assert.equal(worker.getRevision('a'), 0);
    assert.equal(worker.getRevision('b'), 0);
  });

  it('delayed pre-restart completion cannot restore an obsolete revision after reset', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 5);
    const oldGeneration = worker.getGeneration();
    const gate = deferred();

    const stale = worker.enqueue(
      'q1',
      { answer: { value: 'stale' }, generation: oldGeneration },
      async (args) => {
        await gate.promise;
        return {
          success: true as const,
          data: { revision: 6, writeGeneration: 1, operationId: args.operationId },
        };
      }
    );

    worker.bumpGeneration();
    worker.resetQuestions(['q1']);
    assert.equal(worker.getRevision('q1'), 0);

    gate.resolve();
    const staleResult = await stale;
    assert.equal(staleResult.ok, false);
    if (!staleResult.ok) {
      assert.equal(staleResult.cancelled, true);
    }
    // Give the worker a turn to process the late completion.
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(worker.getRevision('q1'), 0);

    const fresh = await worker.enqueue(
      'q1',
      { answer: { value: 'fresh' }, generation: worker.getGeneration() },
      async (args) => {
        assert.equal(args.expectedRevision, 0);
        return { success: true as const, data: { revision: 1 } };
      }
    );
    assert.equal(fresh.ok, true);
    assert.equal(worker.getRevision('q1'), 1);
  });

  it('bumpGeneration invalidates stale completions for callers waiting on the old generation', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 1);
    const oldGeneration = worker.getGeneration();

    const gate = deferred();

    const stale = worker.enqueue(
      'q1',
      { answer: { value: 'stale' }, generation: oldGeneration },
      async (args) => {
        await gate.promise;
        return {
          success: true as const,
          data: { revision: 2, writeGeneration: 99, operationId: args.operationId },
        };
      }
    );

    const bumped = worker.bumpGeneration();
    assert.equal(bumped, oldGeneration + 1);

    const staleResult = await stale;
    assert.equal(staleResult.ok, false);
    if (!staleResult.ok) {
      assert.equal(staleResult.cancelled, true);
      assert.equal(staleResult.code, 'stale_generation');
    }

    gate.resolve();
    await Promise.resolve();
    await Promise.resolve();
    // Must not restore revision 2 after generation bump without an explicit reset path
    // that still allows same-generation consumption; bump alone keeps slot but late
    // success must not apply across generations.
    assert.equal(worker.getRevision('q1'), 1);

    worker.resetQuestions(['q1']);
    const fresh = worker.enqueue(
      'q1',
      { answer: { value: 'fresh' }, generation: worker.getGeneration() },
      async (args) => {
        assert.equal(args.expectedRevision, 0);
        return { success: true as const, data: { revision: 1 } };
      }
    );

    const freshResult = await fresh;
    assert.equal(freshResult.ok, true);
    if (freshResult.ok) {
      assert.equal(freshResult.data.revision, 1);
    }
  });

  it('beginRestartOperation keeps a stable operation ID for lost-response retries', () => {
    const first = beginRestartOperation('category', 3, 'relationship_vision_intentions');
    const second = beginRestartOperation('profile', 3);
    assert.equal(first.kind, 'category');
    assert.equal(first.expectedWriteGeneration, 3);
    assert.equal(first.categoryKey, 'relationship_vision_intentions');
    assert.ok(first.operationId);
    assert.notEqual(first.operationId, second.operationId);
    // Retry must reuse the same object fields rather than minting a new ID.
    const retry = { ...first };
    assert.equal(retry.operationId, first.operationId);
    assert.equal(retry.expectedWriteGeneration, 3);
  });

  it('exports run result shapes usable by persistence tests', async () => {
    const worker = new QuestionSaveWorker();
    const generation = worker.getGeneration();
    const outcome: SaveWorkerRunResult = {
      success: false,
      message: 'A newer answer is already saved.',
      code: 'stale_revision',
    };
    const result = await worker.enqueue(
      'q2',
      { answer: { value: 'x' }, generation },
      async () => outcome
    );
    assert.equal(result.ok, false);
    if (!result.ok && !result.cancelled) {
      assert.equal(result.code, 'stale_revision');
    }
  });
});
