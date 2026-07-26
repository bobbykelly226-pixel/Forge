/**
 * Serializes and coalesces per-question saves so the latest user selection wins
 * and stale in-flight saves cannot overwrite a newer answer.
 */

export type SaveQueueResult<T> =
  | { ok: true; data: T; superseded?: false }
  | { ok: true; superseded: true }
  | { ok: false; message: string; superseded?: false };

type QueueEntry = {
  latestMutation: number;
  tail: Promise<void>;
};

export class QuestionSaveQueue {
  private readonly queues = new Map<string, QueueEntry>();

  enqueue<T>(
    questionKey: string,
    clientMutation: number,
    run: () => Promise<{ success: true; data: T } | { success: false; message: string }>
  ): Promise<SaveQueueResult<T>> {
    const existing = this.queues.get(questionKey) ?? {
      latestMutation: 0,
      tail: Promise.resolve(),
    };
    existing.latestMutation = Math.max(existing.latestMutation, clientMutation);
    this.queues.set(questionKey, existing);

    const mutation = clientMutation;
    let resolveResult!: (value: SaveQueueResult<T>) => void;
    const resultPromise = new Promise<SaveQueueResult<T>>((resolve) => {
      resolveResult = resolve;
    });

    existing.tail = existing.tail
      .catch(() => undefined)
      .then(async () => {
        const current = this.queues.get(questionKey);
        if (!current || current.latestMutation !== mutation) {
          resolveResult({ ok: true, superseded: true });
          return;
        }
        try {
          const outcome = await run();
          const after = this.queues.get(questionKey);
          if (!after || after.latestMutation !== mutation) {
            resolveResult({ ok: true, superseded: true });
            return;
          }
          if (!outcome.success) {
            resolveResult({ ok: false, message: outcome.message });
            return;
          }
          resolveResult({ ok: true, data: outcome.data });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Could not save your answer. Try again.';
          resolveResult({ ok: false, message });
        }
      });

    return resultPromise;
  }

  /** True when a later mutation for this question is already queued. */
  isSuperseded(questionKey: string, clientMutation: number): boolean {
    const current = this.queues.get(questionKey);
    if (!current) return false;
    return current.latestMutation > clientMutation;
  }
}
