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
  onViewDetails?: () => void;
  actions?: React.ReactNode;
  detailTriggerRef?: React.RefCallback<HTMLButtonElement> | React.RefObject<HTMLButtonElement | null>;
};

export default function CharacterSignalCard({
  signalId,
  confirmationCount,
  countLabel,
  status,
  statusLabel,
  showDescription = true,
  progressCopy,
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
              ? 'Growing · private to you'
              : undefined);

  const resolvedCountLabel =
    countLabel ?? `Confirmed by ${confirmationCount} people`;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_10px_32px_rgba(11,45,92,0.05)]">
      <div className="flex gap-4 p-5 sm:p-6">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B2D5C] text-white">
          <CharacterSignalIcon signalId={signalId} />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className="text-lg leading-tight tracking-[-0.01em] text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            {signal.title}
          </h3>
          {showDescription && (
            <p className="mt-1.5 text-sm leading-relaxed text-[#5A6575]">{signal.shortDescription}</p>
          )}
          <p className="mt-2 text-sm font-semibold text-[#0B2D5C]">{resolvedCountLabel}</p>
          {progressCopy && (
            <p className="mt-1 text-xs leading-relaxed text-[#7A8494]">{progressCopy}</p>
          )}
          {status === 'growing' && !progressCopy && (
            <p className="mt-1 text-xs leading-relaxed text-[#7A8494]">
              {growingProgressCopy(confirmationCount)}
            </p>
          )}
          {resolvedStatusLabel && (
            <p className="mt-2 text-xs font-medium text-[#5A6575]">
              <span className="sr-only">Status: </span>
              {resolvedStatusLabel}
            </p>
          )}
        </div>
      </div>

      {(onViewDetails || actions) && (
        <div className="flex flex-col gap-2 border-t border-[#0B2D5C]/08 px-5 py-4 sm:flex-row sm:flex-wrap sm:px-6">
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
      )}
    </article>
  );
}
