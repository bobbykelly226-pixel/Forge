/**
 * Production restart attempt coordinator for Compatibility Profile.
 *
 * Used by CompatibilityProfileShell so lost-response retries reuse one
 * logical operation ID, while authoritative failures abandon it.
 */

import { SAVE_STATUS_COPY } from '@/lib/questionnaire/persistence/copy';
import {
  beginRestartOperation,
  type RestartOperation,
} from '@/lib/questionnaire/persistence/save-worker';

export type RestartExecuteSuccess = {
  success: true;
  writeGeneration: number;
};

export type RestartExecuteFailure = {
  success: false;
  message: string;
  code?: string;
  /** True for thrown/network/ambiguous failures — retain the logical operation. */
  transportError?: boolean;
};

export type RestartExecuteResult = RestartExecuteSuccess | RestartExecuteFailure;

export type RestartAttemptOutcome = {
  pending: RestartOperation | null;
  result: RestartExecuteResult;
  /** Apply generation bump, revision reset, and UI clear only on authoritative success. */
  applySuccess: boolean;
};

const AUTHORITATIVE_ABORT_CODES = new Set([
  'stale_generation',
  'idempotency_conflict',
  'operation_id_required',
]);

function shouldAbandonOnFailure(result: RestartExecuteFailure): boolean {
  // Explicit transport/ambiguous failures retain the logical operation for Retry.
  if (result.transportError === true) return false;
  // Explicit authoritative {ok:false} payloads abandon the operation.
  if (result.transportError === false) return true;
  // Fall back: known non-retriable codes abandon even if transportError was omitted.
  if (result.code && AUTHORITATIVE_ABORT_CODES.has(result.code)) return true;
  // Ambiguous — retain for a safe same-operation retry.
  return false;
}

/**
 * Execute one category or full restart attempt.
 * Retains the same operation ID across transport failures; abandons on
 * authoritative failure; clears pending on success.
 */
export async function executeRestartAttempt(input: {
  pending: RestartOperation | null;
  kind: 'category' | 'profile';
  categoryKey?: string;
  currentWriteGeneration: number;
  execute: (op: RestartOperation) => Promise<RestartExecuteResult>;
}): Promise<RestartAttemptOutcome> {
  const matchesPending =
    input.pending &&
    input.pending.kind === input.kind &&
    input.pending.categoryKey === input.categoryKey;

  const op = matchesPending
    ? input.pending!
    : beginRestartOperation(
        input.kind,
        input.currentWriteGeneration,
        input.categoryKey
      );

  try {
    const outcome = await input.execute(op);
    if (outcome.success) {
      return {
        pending: null,
        result: outcome,
        applySuccess: true,
      };
    }

    if (shouldAbandonOnFailure(outcome)) {
      return {
        pending: null,
        result: outcome,
        applySuccess: false,
      };
    }

    return {
      pending: op,
      result: outcome,
      applySuccess: false,
    };
  } catch {
    return {
      pending: op,
      result: {
        success: false,
        message: SAVE_STATUS_COPY.restartError,
        transportError: true,
      },
      applySuccess: false,
    };
  }
}

/**
 * Always restore restartBusy in finally, including thrown transport failures.
 * Production shell uses this so busy-state handling is unit-testable.
 */
export async function withRestartBusy<T>(
  setBusy: (busy: boolean) => void,
  run: () => Promise<T>
): Promise<T> {
  setBusy(true);
  try {
    return await run();
  } finally {
    setBusy(false);
  }
}

export type { RestartOperation };
