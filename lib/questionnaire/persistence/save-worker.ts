/**
 * Per-question save worker that fixes autosave races around server revisions
 * and keeps logical write attempts idempotent across lost responses.
 *
 * Unlike QuestionSaveQueue (which can discard a superseded in-flight revision),
 * this worker always consumes the server revision from every completed request
 * for the current generation, then sends any newer coalesced desired answer
 * with that updated revision.
 *
 * Transport failures retain the in-flight operation ID so Retry resends the
 * exact same logical write. Authoritative results clear the attempt.
 */

export type DesiredAnswer<TAnswer> = {
  answer: TAnswer;
  generation: number;
};

export type SaveWorkerRunArgs<TAnswer> = {
  answer: TAnswer;
  expectedRevision: number;
  operationId: string;
};

export type SaveWorkerSuccessData = {
  revision: number;
  writeGeneration?: number;
  operationId?: string;
};

export type SaveWorkerRunResult =
  | { success: true; data: SaveWorkerSuccessData }
  /** Authoritative DB/business result — do not reuse this operation ID. */
  | { success: false; message: string; code?: string; transportError?: false }
  /** Lost/transport failure — retain operation ID for exact retry. */
  | { success: false; message: string; transportError: true; code?: string };

export type SaveWorkerRunFn<TAnswer> = (
  args: SaveWorkerRunArgs<TAnswer>
) => Promise<SaveWorkerRunResult>;

export type SaveWorkerResult =
  | { ok: true; data: SaveWorkerSuccessData }
  | {
      ok: false;
      message: string;
      code?: string;
      cancelled?: false;
      retriable?: boolean;
    }
  | { ok: false; cancelled: true; message: string; code?: string };

type Waiter = {
  generation: number;
  seq: number;
  resolve: (result: SaveWorkerResult) => void;
};

type PendingDesired<TAnswer> = {
  answer: TAnswer;
  generation: number;
  run: SaveWorkerRunFn<TAnswer>;
};

/** One logical write attempt retained until an authoritative DB result arrives. */
type RetainedAttempt<TAnswer> = {
  answer: TAnswer;
  generation: number;
  run: SaveWorkerRunFn<TAnswer>;
  operationId: string;
  expectedRevision: number;
  /** Resolve only waiters with seq <= this on transport failure. */
  waiterSeqCeiling: number;
};

type QuestionSlot<TAnswer> = {
  revision: number;
  desired: PendingDesired<TAnswer> | null;
  retainedAttempt: RetainedAttempt<TAnswer> | null;
  inFlight: boolean;
  waiters: Waiter[];
  nextWaiterSeq: number;
};

const CANCELLED_MESSAGE = 'Save cancelled after questionnaire restart.';

export class QuestionSaveWorker {
  private generation = 0;
  private readonly slots = new Map<string, QuestionSlot<unknown>>();

  getGeneration(): number {
    return this.generation;
  }

  /** Bump write generation and cancel waiters/pending desired from the prior generation. */
  bumpGeneration(): number {
    this.generation += 1;
    this.cancelAllWaiters(CANCELLED_MESSAGE, 'stale_generation');
    return this.generation;
  }

  /**
   * Invalidate a generation so its waiters cannot resolve UI from stale completions.
   * When `generation` is the current generation, bumps to a new one.
   */
  invalidate(generation: number): number {
    if (generation === this.generation) {
      return this.bumpGeneration();
    }
    for (const slot of this.slots.values()) {
      const remaining: Waiter[] = [];
      for (const waiter of slot.waiters) {
        if (waiter.generation === generation) {
          waiter.resolve({
            ok: false,
            cancelled: true,
            message: CANCELLED_MESSAGE,
            code: 'stale_generation',
          });
        } else {
          remaining.push(waiter);
        }
      }
      slot.waiters = remaining;
      if (slot.desired?.generation === generation) {
        slot.desired = null;
      }
      if (slot.retainedAttempt?.generation === generation) {
        slot.retainedAttempt = null;
      }
    }
    return this.generation;
  }

  setRevision(questionKey: string, revision: number): void {
    const slot = this.ensureSlot(questionKey);
    slot.revision = revision;
  }

  getRevision(questionKey: string): number {
    return this.ensureSlot(questionKey).revision;
  }

  hasRetainedAttempt(questionKey: string): boolean {
    const slot = this.slots.get(questionKey);
    return Boolean(slot?.retainedAttempt && !slot.inFlight);
  }

  /**
   * After a successful category restart: reset revisions for those questions to 0,
   * drop retained attempts/desired work, and cancel their waiters.
   * Untouched question keys keep their revisions.
   */
  resetQuestions(questionKeys: readonly string[]): void {
    for (const questionKey of questionKeys) {
      const slot = this.slots.get(questionKey);
      if (!slot) {
        this.slots.set(questionKey, {
          revision: 0,
          desired: null,
          retainedAttempt: null,
          inFlight: false,
          waiters: [],
          nextWaiterSeq: 0,
        });
        continue;
      }
      const waiters = slot.waiters.splice(0, slot.waiters.length);
      for (const waiter of waiters) {
        waiter.resolve({
          ok: false,
          cancelled: true,
          message: CANCELLED_MESSAGE,
          code: 'stale_generation',
        });
      }
      slot.revision = 0;
      slot.desired = null;
      slot.retainedAttempt = null;
      // inFlight may still be true for a pre-restart request; its completion
      // must not restore revision because generation was bumped / slot reset.
    }
  }

  /** After a successful full restart: clear every slot and revision. */
  resetAllQuestions(): void {
    const keys = [...this.slots.keys()];
    this.resetQuestions(keys);
    this.slots.clear();
  }

  /**
   * Retry a retained transport-failed attempt with the same operation ID and payload.
   * No-op (resolves cancelled) when nothing is retained.
   */
  retry<TAnswer = unknown>(questionKey: string): Promise<SaveWorkerResult> {
    const slot = this.ensureSlot<TAnswer>(questionKey);
    const attempt = slot.retainedAttempt;
    if (!attempt || slot.inFlight) {
      return Promise.resolve({
        ok: false,
        cancelled: true,
        message: CANCELLED_MESSAGE,
        code: 'stale_generation',
      });
    }
    if (attempt.generation !== this.generation) {
      slot.retainedAttempt = null;
      return Promise.resolve({
        ok: false,
        cancelled: true,
        message: CANCELLED_MESSAGE,
        code: 'stale_generation',
      });
    }

    // Raise the ceiling so this retry's waiter is included in transport-failure updates.
    attempt.waiterSeqCeiling = slot.nextWaiterSeq;

    const resultPromise = new Promise<SaveWorkerResult>((resolve) => {
      slot.nextWaiterSeq += 1;
      slot.waiters.push({
        generation: attempt.generation,
        seq: slot.nextWaiterSeq,
        resolve,
      });
      attempt.waiterSeqCeiling = slot.nextWaiterSeq;
    });
    void this.pump(questionKey);
    return resultPromise;
  }

  enqueue<TAnswer>(
    questionKey: string,
    desired: DesiredAnswer<TAnswer>,
    run: SaveWorkerRunFn<TAnswer>
  ): Promise<SaveWorkerResult> {
    if (desired.generation !== this.generation) {
      return Promise.resolve({
        ok: false,
        cancelled: true,
        message: CANCELLED_MESSAGE,
        code: 'stale_generation',
      });
    }

    const slot = this.ensureSlot<TAnswer>(questionKey);

    // Coalesce: only the newest desired answer matters for the next new attempt.
    // A retained transport-failed attempt is retried first (same operation ID).
    slot.desired = {
      answer: desired.answer,
      generation: desired.generation,
      run,
    };

    const resultPromise = new Promise<SaveWorkerResult>((resolve) => {
      slot.nextWaiterSeq += 1;
      slot.waiters.push({
        generation: desired.generation,
        seq: slot.nextWaiterSeq,
        resolve,
      });
    });

    void this.pump(questionKey);
    return resultPromise;
  }

  private ensureSlot<TAnswer>(questionKey: string): QuestionSlot<TAnswer> {
    let slot = this.slots.get(questionKey) as QuestionSlot<TAnswer> | undefined;
    if (!slot) {
      slot = {
        revision: 0,
        desired: null,
        retainedAttempt: null,
        inFlight: false,
        waiters: [],
        nextWaiterSeq: 0,
      };
      this.slots.set(questionKey, slot as QuestionSlot<unknown>);
    }
    return slot;
  }

  private cancelAllWaiters(message: string, code: string): void {
    for (const slot of this.slots.values()) {
      const waiters = slot.waiters.splice(0, slot.waiters.length);
      for (const waiter of waiters) {
        waiter.resolve({
          ok: false,
          cancelled: true,
          message,
          code,
        });
      }
      slot.desired = null;
      // Drop retained attempts from the cancelled generation so Retry cannot
      // resurrect a pre-restart write after bumpGeneration.
      slot.retainedAttempt = null;
    }
  }

  private resolveWaiters(
    slot: QuestionSlot<unknown>,
    generation: number,
    result: SaveWorkerResult,
    options?: { maxSeq?: number }
  ): void {
    const remaining: Waiter[] = [];
    for (const waiter of slot.waiters) {
      const seqOk =
        options?.maxSeq === undefined || waiter.seq <= options.maxSeq;
      if (waiter.generation === generation && seqOk) {
        waiter.resolve(result);
      } else {
        remaining.push(waiter);
      }
    }
    slot.waiters = remaining;
  }

  private async pump(questionKey: string): Promise<void> {
    const slot = this.ensureSlot(questionKey);
    if (slot.inFlight) return;

    // Prefer retrying a retained transport-failed attempt before a newer desired.
    let attempt = slot.retainedAttempt;
    if (attempt && attempt.generation !== this.generation) {
      slot.retainedAttempt = null;
      attempt = null;
    }

    if (!attempt) {
      const pending = slot.desired;
      if (!pending) return;

      if (pending.generation !== this.generation) {
        slot.desired = null;
        this.resolveWaiters(slot, pending.generation, {
          ok: false,
          cancelled: true,
          message: CANCELLED_MESSAGE,
          code: 'stale_generation',
        });
        return;
      }

      // Claim the newest desired; later enqueues while in-flight become the next desired.
      slot.desired = null;
      attempt = {
        answer: pending.answer,
        generation: pending.generation,
        run: pending.run,
        operationId: crypto.randomUUID(),
        expectedRevision: slot.revision,
        waiterSeqCeiling: slot.nextWaiterSeq,
      };
      slot.retainedAttempt = attempt;
    }

    slot.inFlight = true;
    const sentGeneration = attempt.generation;
    const operationId = attempt.operationId;
    const expectedRevision = attempt.expectedRevision;
    const waiterSeqCeiling = attempt.waiterSeqCeiling;

    let outcome: SaveWorkerRunResult;
    try {
      outcome = await attempt.run({
        answer: attempt.answer,
        expectedRevision,
        operationId,
      });
    } catch {
      slot.inFlight = false;
      // Never surface raw transport/network details to waiters or the UI.
      const message = 'Could not save your answer. Try again.';

      if (sentGeneration !== this.generation) {
        slot.retainedAttempt = null;
        this.resolveWaiters(slot, sentGeneration, {
          ok: false,
          cancelled: true,
          message: CANCELLED_MESSAGE,
          code: 'stale_generation',
        });
        return;
      }

      // Keep retainedAttempt so Retry / retry() resends the same operation ID.
      // Only resolve waiters enrolled for this attempt; newer coalesced waiters stay.
      this.resolveWaiters(
        slot,
        sentGeneration,
        { ok: false, message, retriable: true },
        { maxSeq: waiterSeqCeiling }
      );
      return;
    }

    slot.inFlight = false;

    // Transport-marked failure: retain attempt for exact same-operation retry.
    if (!outcome.success && outcome.transportError) {
      if (sentGeneration !== this.generation) {
        slot.retainedAttempt = null;
        this.resolveWaiters(slot, sentGeneration, {
          ok: false,
          cancelled: true,
          message: CANCELLED_MESSAGE,
          code: 'stale_generation',
        });
        return;
      }
      this.resolveWaiters(
        slot,
        sentGeneration,
        {
          ok: false,
          message: outcome.message,
          code: outcome.code,
          retriable: true,
        },
        { maxSeq: waiterSeqCeiling }
      );
      return;
    }

    // Authoritative result: clear retained attempt for this logical write.
    if (
      slot.retainedAttempt &&
      slot.retainedAttempt.operationId === operationId
    ) {
      slot.retainedAttempt = null;
    }

    // Consume returned revision only for the active generation. Pre-restart
    // completions must never restore an obsolete revision after resetQuestions.
    if (outcome.success && sentGeneration === this.generation) {
      slot.revision = outcome.data.revision;
    }

    const desiredAfterFlight = this.slots.get(questionKey)?.desired ?? null;

    if (sentGeneration !== this.generation) {
      this.resolveWaiters(slot, sentGeneration, {
        ok: false,
        cancelled: true,
        message: CANCELLED_MESSAGE,
        code: 'stale_generation',
      });
      if (desiredAfterFlight && desiredAfterFlight.generation === this.generation) {
        void this.pump(questionKey);
      }
      return;
    }

    // Newer desired pending: send it with the recovered/updated revision and a new op ID.
    if (desiredAfterFlight && desiredAfterFlight.generation === this.generation) {
      if (!outcome.success) {
        this.resolveWaiters(slot, sentGeneration, {
          ok: false,
          message: outcome.message,
          code: outcome.code,
        });
        return;
      }
      void this.pump(questionKey);
      return;
    }

    if (outcome.success) {
      this.resolveWaiters(slot, sentGeneration, {
        ok: true,
        data: outcome.data,
      });
    } else {
      this.resolveWaiters(slot, sentGeneration, {
        ok: false,
        message: outcome.message,
        code: outcome.code,
      });
    }
  }
}

/**
 * Stable logical restart operation retained across lost-response retries.
 */
export type RestartOperation = {
  kind: 'category' | 'profile';
  categoryKey?: string;
  operationId: string;
  expectedWriteGeneration: number;
};

export function beginRestartOperation(
  kind: 'category' | 'profile',
  expectedWriteGeneration: number,
  categoryKey?: string
): RestartOperation {
  return {
    kind,
    categoryKey,
    operationId: crypto.randomUUID(),
    expectedWriteGeneration,
  };
}
