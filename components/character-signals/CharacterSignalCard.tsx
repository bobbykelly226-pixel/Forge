'use client';

import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import {
  getSignalDefinition,
  growingProgressCopy,
  type CharacterSignalId,
  type SignalDisplayStatus,
} from '@/lib/character-signals-mock';

type CharacterSignalCardProps = {
  signalId: CharacterSignalId;
  confirmationCount: number;
  countLabel?: string;
  status?: SignalDisplayStatus;
  statusLabel?: string;
  showDescription?: boolean;
  progressCopy?: string;
  layout?: 'standard' | 'horizontal';
  onViewDetails?: () => void;
  actions?: React.ReactNode;
  detailTriggerRef?:
    | React.RefCallback<HTMLButtonElement>
    | React.RefObject<HTMLButtonElement | null>;
};

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-[#0B2D5C]/12 bg-[#E8EEF6]/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#0B2D5C]">
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}

export default function CharacterSignalCard({
  signalId,
  confirmationCount,
  countLabel,
  status,
  statusLabel,
  showDescription = true,
  progressCopy,
  layout = 'standard',
  onViewDetails,
  actions,
  detailTriggerRef,
}: CharacterSignalCardProps) {
  const signal = getSignalDefinition(signalId);
  const resolvedStatusLabel =
    statusLabel ??
    (status === 'public'
      ? 'Displayed on profile'
      : status === 'hidden'
        ? 'Hidden'
        : status === 'pending'
          ? 'Ready for your approval'
          : status === 'private'
            ? 'Kept private'
            : status === 'growing'
              ? 'Private to you'
              : undefined);

  const resolvedCountLabel = countLabel ?? `Confirmed by ${confirmationCount} people`;
  const resolvedProgress =
    progressCopy ?? (status === 'growing' ? growingProgressCopy(confirmationCount) : undefined);

  const actionRow =
    onViewDetails || actions ? (
      <div className="mt-auto flex flex-col gap-2 border-t border-[#0B2D5C]/08 pt-4 sm:flex-row sm:flex-wrap">
        {actions}
        {onViewDetails && (
          <button
            ref={detailTriggerRef}
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center justify-center rounded-2xl border border-[#0B2D5C]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#FBF9F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
          >
            View Details
          </button>
        )}
      </div>
    ) : null;

  if (layout === 'horizontal') {
    return (
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 p-5 shadow-[0_10px_32px_rgba(11,45,92,0.05)] sm:p-6 lg:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B2D5C] text-white">
            <CharacterSignalIcon signalId={signalId} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3
                className="min-w-0 text-lg leading-snug tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {signal.title}
              </h3>
              {resolvedStatusLabel && <StatusBadge label={resolvedStatusLabel} />}
            </div>
            {showDescription && (
              <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
                {signal.shortDescription}
              </p>
            )}
            <p className="mt-3 text-sm font-semibold text-[#0B2D5C]">{resolvedCountLabel}</p>
            {resolvedProgress && (
              <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[#7A8494]">
                {resolvedProgress}
              </p>
            )}
          </div>
        </div>
        {actionRow}
      </article>
    );
  }

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_10px_32px_rgba(11,45,92,0.05)]">
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B2D5C] text-white">
            <CharacterSignalIcon signalId={signalId} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3
                className="min-w-0 text-lg leading-snug tracking-[-0.01em] text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {signal.title}
              </h3>
              {resolvedStatusLabel && <StatusBadge label={resolvedStatusLabel} />}
            </div>
          </div>
        </div>

        {showDescription && (
          <p className="text-sm leading-relaxed text-[#5A6575]">{signal.shortDescription}</p>
        )}
        <div>
          <p className="text-sm font-semibold text-[#0B2D5C]">{resolvedCountLabel}</p>
          {resolvedProgress && (
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[#7A8494]">
              {resolvedProgress}
            </p>
          )}
        </div>
        {actionRow}
      </div>
    </article>
  );
}
