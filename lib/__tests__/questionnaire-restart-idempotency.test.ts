import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  beginRestartOperation,
  QuestionSaveWorker,
  type RestartOperation,
} from '@/lib/questionnaire/persistence/save-worker';

/**
 * Models the shell's stable restart attempt: one operation ID + expected
 * write generation retained until an authoritative result arrives.
 */
async function runRestartAttempt(
  pending: RestartOperation | null,
  kind: 'category' | 'profile',
  expectedWriteGeneration: number,
  categoryKey: string | undefined,
  execute: (op: RestartOperation) => Promise<
    | { success: true; writeGeneration: number }
    | { success: false; transportError?: boolean; message: string }
  >
): Promise<{
  pending: RestartOperation | null;
  result:
    | { success: true; writeGeneration: number }
    | { success: false; message: string };
}> {
  const op =
    pending &&
    pending.kind === kind &&
    pending.categoryKey === categoryKey
      ? pending
      : beginRestartOperation(kind, expectedWriteGeneration, categoryKey);

  const outcome = await execute(op);
  if (!outcome.success) {
    // Retain op across transport / lost-response failures.
    return {
      pending: op,
      result: { success: false, message: outcome.message },
    };
  }
  return {
    pending: null,
    result: { success: true, writeGeneration: outcome.writeGeneration },
  };
}

describe('restart operation idempotency', () => {
  it('category restart lost response retries with the same operation ID and expected generation', async () => {
    const seen: RestartOperation[] = [];
    let attempts = 0;
    let pending: RestartOperation | null = null;

    const first = await runRestartAttempt(
      pending,
      'category',
      4,
      'relationship_vision_intentions',
      async (op) => {
        seen.push(op);
        attempts += 1;
        if (attempts === 1) {
          return {
            success: false,
            transportError: true,
            message: 'Network interrupted before the restart response arrived.',
          };
        }
        return { success: true, writeGeneration: 5 };
      }
    );
    assert.equal(first.result.success, false);
    pending = first.pending;
    assert.ok(pending);
    assert.equal(pending.operationId, seen[0]?.operationId);
    assert.equal(pending.expectedWriteGeneration, 4);

    const second = await runRestartAttempt(
      pending,
      'category',
      4,
      'relationship_vision_intentions',
      async (op) => {
        seen.push(op);
        return { success: true, writeGeneration: 5 };
      }
    );
    assert.equal(second.result.success, true);
    if (second.result.success) {
      assert.equal(second.result.writeGeneration, 5);
    }
    assert.equal(second.pending, null);
    assert.equal(seen.length, 2);
    assert.equal(seen[0]?.operationId, seen[1]?.operationId);
    assert.equal(seen[0]?.expectedWriteGeneration, 4);
    assert.equal(seen[1]?.expectedWriteGeneration, 4);
  });

  it('full restart lost response retries with the same operation ID', async () => {
    const seen: string[] = [];
    let attempts = 0;
    let pending: RestartOperation | null = null;

    const first = await runRestartAttempt(
      pending,
      'profile',
      2,
      undefined,
      async (op) => {
        seen.push(op.operationId);
        attempts += 1;
        if (attempts === 1) {
          return {
            success: false,
            transportError: true,
            message: 'Could not restart your Compatibility Profile. Try again.',
          };
        }
        return { success: true, writeGeneration: 3 };
      }
    );
    pending = first.pending;
    assert.ok(pending);

    const second = await runRestartAttempt(
      pending,
      'profile',
      2,
      undefined,
      async (op) => {
        seen.push(op.operationId);
        return { success: true, writeGeneration: 3 };
      }
    );
    assert.equal(second.result.success, true);
    assert.equal(seen[0], seen[1]);
    assert.equal(second.pending, null);
  });

  it('after successful category restart the first new save uses revision 0', async () => {
    const worker = new QuestionSaveWorker();
    worker.setRevision('relationship_vision_intentions_q01', 6);
    worker.setRevision('family_children_parenting_q01', 3);

    // Simulate successful category restart handling in the shell.
    worker.bumpGeneration();
    worker.resetQuestions([
      'relationship_vision_intentions_q01',
      'relationship_vision_intentions_q02',
    ]);

    assert.equal(worker.getRevision('relationship_vision_intentions_q01'), 0);
    assert.equal(worker.getRevision('family_children_parenting_q01'), 3);

    const generation = worker.getGeneration();
    const seen: number[] = [];
    const result = await worker.enqueue(
      'relationship_vision_intentions_q01',
      { answer: { value: 'new' }, generation },
      async (args) => {
        seen.push(args.expectedRevision);
        return { success: true as const, data: { revision: 1 } };
      }
    );
    assert.equal(result.ok, true);
    assert.deepEqual(seen, [0]);
  });
});
