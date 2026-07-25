/**
 * Per-question save worker that fixes autosave races around server revisions.
 *
 * Unlike QuestionSaveQueue (which can discard a superseded in-flight revision),
 * this worker always consumes the server revision from every completed request,
 * then sends any newer coalesced desired answer with that updated revision.
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
  | { success: false; message: string; code?: string };

export type SaveWorkerRunFn<TAnswer> = (
  args: SaveWorkerRunArgs<TAnswer>
) => Promise<SaveWorkerRunResult>;

export type SaveWorkerResult =
  | { ok: true; data: SaveWorkerSuccessData }
  | { ok: false; message: string; code?: string; cancelled?: false }
  | { ok: false; cancelled: true; message: string; code?: string };

type Waiter = {
  generation: number;
  resolve: (result: SaveWorkerResult) => void;
};

type PendingDesired<TAnswer> = {
  answer: TAnswer;
  generation: number;
  run: SaveWorkerRunFn<TAnswer>;
};

type QuestionSlot<TAnswer> = {
  revision: number;
  desired: PendingDesired<TAnswer> | null;
  inFlight: boolean;
  waiters: Waiter[];
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

    // Coalesce: only the newest desired answer matters.
    slot.desired = {
      answer: desired.answer,
      generation: desired.generation,
      run,
    };

    const resultPromise = new Promise<SaveWorkerResult>((resolve) => {
      slot.waiters.push({ generation: desired.generation, resolve });
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
        inFlight: false,
        waiters: [],
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
    }
  }

  private resolveWaiters(
    slot: QuestionSlot<unknown>,
    generation: number,
    result: SaveWorkerResult
  ): void {
    const remaining: Waiter[] = [];
    for (const waiter of slot.waiters) {
      if (waiter.generation === generation) {
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
    slot.inFlight = true;

    const operationId = crypto.randomUUID();
    const expectedRevision = slot.revision;
    const sentGeneration = pending.generation;

    let outcome: SaveWorkerRunResult;
    try {
      outcome = await pending.run({
        answer: pending.answer,
        expectedRevision,
        operationId,
      });
    } catch (error) {
      slot.inFlight = false;
      const message =
        error instanceof Error ? error.message : 'Could not save your answer. Try again.';

      // A newer desired for the same generation may have arrived; try that next.
      if (slot.desired && slot.desired.generation === this.generation) {
        void this.pump(questionKey);
        return;
      }

      if (sentGeneration !== this.generation) {
        this.resolveWaiters(slot, sentGeneration, {
          ok: false,
          cancelled: true,
          message: CANCELLED_MESSAGE,
          code: 'stale_generation',
        });
        return;
      }

      this.resolveWaiters(slot, sentGeneration, { ok: false, message });
      return;
    }

    // ALWAYS consume returned revision, even when a newer local desired superseded this answer.
    if (outcome.success) {
      slot.revision = outcome.data.revision;
    }

    slot.inFlight = false;

    // Generation was bumped while in flight: do not resolve UI with this completion.
    if (sentGeneration !== this.generation) {
      this.resolveWaiters(slot, sentGeneration, {
        ok: false,
        cancelled: true,
        message: CANCELLED_MESSAGE,
        code: 'stale_generation',
      });
      if (slot.desired && slot.desired.generation === this.generation) {
        void this.pump(questionKey);
      }
      return;
    }

    // Newer desired pending for the same generation: send it with the updated revision.
    if (slot.desired && slot.desired.generation === this.generation) {
      void this.pump(questionKey);
      return;
    }

    // Final attempt for the current newest desired.
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
