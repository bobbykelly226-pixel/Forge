import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  QuestionSaveWorker,
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

    // First request should be in flight with revision 3 before we release it.
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

  it('bumpGeneration invalidates stale completions for callers waiting on the old generation', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('q1', 1);
    const oldGeneration = worker.getGeneration();

    const gate = deferred();
    const inFlightSettled = deferred();
    let ranAfterBump = false;

    const stale = worker.enqueue(
      'q1',
      { answer: { value: 'stale' }, generation: oldGeneration },
      async (args) => {
        await gate.promise;
        try {
          return {
            success: true as const,
            data: { revision: 2, writeGeneration: 99, operationId: args.operationId },
          };
        } finally {
          // Allow the worker to consume revision after this run returns.
          queueMicrotask(() => inFlightSettled.resolve());
        }
      }
    );

    const bumped = worker.bumpGeneration();
    assert.equal(bumped, oldGeneration + 1);
    assert.equal(worker.getGeneration(), oldGeneration + 1);

    // Callers still on the old generation must not apply old success data.
    const staleResult = await stale;
    assert.equal(staleResult.ok, false);
    if (!staleResult.ok) {
      assert.equal(staleResult.cancelled, true);
      assert.equal(staleResult.code, 'stale_generation');
    }

    // Release the in-flight request after invalidation; revision is still consumed.
    gate.resolve();
    await inFlightSettled.promise;
    await Promise.resolve();
    assert.equal(worker.getRevision('q1'), 2);

    const fresh = worker.enqueue(
      'q1',
      { answer: { value: 'fresh' }, generation: worker.getGeneration() },
      async (args) => {
        ranAfterBump = true;
        assert.equal(args.expectedRevision, 2);
        return { success: true as const, data: { revision: 3 } };
      }
    );

    const freshResult = await fresh;
    assert.equal(ranAfterBump, true);
    assert.equal(freshResult.ok, true);
    if (freshResult.ok) {
      assert.equal(freshResult.data.revision, 3);
    }

    // Enqueue with a stale generation is rejected immediately.
    const rejected = await worker.enqueue(
      'q1',
      { answer: { value: 'too-old' }, generation: oldGeneration },
      async () => ({ success: true as const, data: { revision: 4 } })
    );
    assert.equal(rejected.ok, false);
    if (!rejected.ok) {
      assert.equal(rejected.cancelled, true);
    }
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
