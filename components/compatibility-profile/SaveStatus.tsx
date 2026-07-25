'use client';

import { SAVE_STATUS_COPY } from '@/lib/questionnaire/persistence/copy';

export type SaveStatusKind = 'idle' | 'saving' | 'saved' | 'error';

type SaveStatusProps = {
  status: SaveStatusKind;
  errorMessage?: string | null;
  onRetry?: () => void;
};

export default function SaveStatus({ status, errorMessage, onRetry }: SaveStatusProps) {
  if (status === 'idle') return null;

  const message =
    status === 'saving'
      ? SAVE_STATUS_COPY.saving
      : status === 'saved'
        ? SAVE_STATUS_COPY.saved
        : errorMessage || SAVE_STATUS_COPY.error;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium text-[var(--forge-navy)]"
    >
      <span
        className={
          status === 'error'
            ? 'text-[#A61F1F]'
            : status === 'saved'
              ? 'text-[var(--forge-navy)]'
              : 'text-[var(--forge-graphite)]'
        }
      >
        {message}
      </span>
      {status === 'error' && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
