'use client';

import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import {
  PUBLIC_DISPLAY_THRESHOLD,
  getSignalDefinition,
  type CharacterSignalId,
  type SignalDisplayStatus,
} from '@/lib/character-signals-mock';

export type SignalCardTone = 'public' | 'pending' | 'growing' | 'neutral';

type CharacterSignalCardProps = {
  signalId: CharacterSignalId;
  confirmationCount: number;
  countLabel?: string;
  status?: SignalDisplayStatus;
  statusLabel?: string;
  showDescription?: boolean;
  showConfirmationProgress?: boolean;
  layout?: 'standard' | 'horizontal';
  tone?: SignalCardTone;
  onViewDetails?: () => void;
  actions?: React.ReactNode;
  detailTriggerRef?:
    | React.RefCallback<HTMLButtonElement>
    | React.RefObject<HTMLButtonElement | null>;
};

const TONE_STYLES: Record<
  SignalCardTone,
  {
    accent: string;
    pale: string;
    badgeBorder: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
  }
> = {
  public: {
    accent: '#557A67',
    pale: '#EDF4EF',
    badgeBorder: 'border-[#557A67]/25',
    badgeBg: 'bg-[#EDF4EF]',
    badgeText: 'text-[#557A67]',
    iconBg: 'bg-[#557A67]',
  },
  pending: {
    accent: '#9A6A22',
    pale: '#FBF3E5',
    badgeBorder: 'border-[#9A6A22]/25',
    badgeBg: 'bg-[#FBF3E5]',
    badgeText: 'text-[#9A6A22]',
    iconBg: 'bg-[#9A6A22]',
  },
  growing: {
    accent: '#586B85',
    pale: '#EEF2F7',
    badgeBorder: 'border-[#586B85]/25',
    badgeBg: 'bg-[#EEF2F7]',
    badgeText: 'text-[#586B85]',
    iconBg: 'bg-[#586B85]',
  },
  neutral: {
    accent: '#667085',
    pale: '#F2F4F7',
    badgeBorder: 'border-[#667085]/20',
    badgeBg: 'bg-[#F2F4F7]',
    badgeText: 'text-[#667085]',
    iconBg: 'bg-[#0B2D5C]',
  },
};

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: SignalCardTone;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${styles.badgeBorder} ${styles.badgeBg} ${styles.badgeText}`}
    >
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}

function ConfirmationProgress({ confirmationCount }: { confirmationCount: number }) {
  const filled = Math.min(Math.max(confirmationCount, 0), PUBLIC_DISPLAY_THRESHOLD);
  const remaining = Math.max(PUBLIC_DISPLAY_THRESHOLD - filled, 0);
  const needsCopy =
    remaining <= 0
      ? 'Ready for your review before public display.'
      : remaining === 1
        ? 'Needs one more independent confirmation.'
        : `Needs ${remaining} more independent confirmations.`;

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#586B85]">
        Recognition progress
      </p>
      <div
        className="mt-2 flex items-center gap-2"
        role="img"
        aria-label={`${filled} of ${PUBLIC_DISPLAY_THRESHOLD} independent confirmations. ${needsCopy}`}
      >
        {Array.from({ length: PUBLIC_DISPLAY_THRESHOLD }).map((_, index) => {
          const isFilled = index < filled;
          return (
            <span
              key={index}
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                isFilled ? 'bg-[#586B85]' : 'border border-[#91A2BA] bg-transparent'
              }`}
            />
          );
        })}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">{needsCopy}</p>
    </div>
  );
}

export default function CharacterSignalCard({
  signalId,
  confirmationCount,
  countLabel,
  status,
  statusLabel,
  showDescription = true,
  showConfirmationProgress = false,
  layout = 'standard',
  tone = 'neutral',
  onViewDetails,
  actions,
  detailTriggerRef,
}: CharacterSignalCardProps) {
  const signal = getSignalDefinition(signalId);
  const styles = TONE_STYLES[tone];

  const resolvedStatusLabel =
    statusLabel ??
    (status === 'public'
      ? 'Public'
      : status === 'hidden'
        ? 'Hidden'
        : status === 'pending'
          ? 'Pending Approval'
          : status === 'private'
            ? 'Kept private'
            : status === 'growing'
              ? 'Private to you'
              : undefined);

  const badgeTone: SignalCardTone =
    status === 'hidden' || status === 'private' ? 'neutral' : tone;

  const resolvedCountLabel = countLabel ?? `Confirmed by ${confirmationCount} people`;

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

  const cardBody = (
    <>
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${styles.iconBg}`}
        >
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
            {resolvedStatusLabel && (
              <StatusBadge label={resolvedStatusLabel} tone={badgeTone} />
            )}
          </div>
          {layout === 'horizontal' && showDescription && (
            <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
              {signal.shortDescription}
            </p>
          )}
          {layout === 'horizontal' && (
            <>
              <p className="mt-3 text-sm font-semibold text-[#0B2D5C]">{resolvedCountLabel}</p>
              {showConfirmationProgress && (
                <ConfirmationProgress confirmationCount={confirmationCount} />
              )}
            </>
          )}
        </div>
      </div>

      {layout === 'standard' && (
        <>
          {showDescription && (
            <p className="text-sm leading-relaxed text-[#5A6575]">{signal.shortDescription}</p>
          )}
          <div>
            <p className="text-sm font-semibold text-[#0B2D5C]">{resolvedCountLabel}</p>
            {showConfirmationProgress && (
              <ConfirmationProgress confirmationCount={confirmationCount} />
            )}
          </div>
        </>
      )}
      {actionRow}
    </>
  );

  if (layout === 'horizontal') {
    return (
      <article
        className="flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white p-5 shadow-[0_10px_32px_rgba(11,45,92,0.05)] sm:p-6"
        style={{ borderLeftWidth: 3, borderLeftColor: styles.accent }}
      >
        {cardBody}
      </article>
    );
  }

  return (
    <article
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white shadow-[0_10px_32px_rgba(11,45,92,0.05)]"
      style={{ borderLeftWidth: 3, borderLeftColor: styles.accent }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">{cardBody}</div>
    </article>
  );
}

