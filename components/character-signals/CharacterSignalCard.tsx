'use client';

import CharacterSignalIcon from '@/components/character-signals/CharacterSignalIcon';
import {
  getSignalDefinition,
  type CharacterSignalId,
} from '@/lib/character-signals-mock';

type CharacterSignalCardProps = {
  signalId: CharacterSignalId;
  confirmationCount: number;
  countLabel?: string;
  actions?: React.ReactNode;
};

/**
 * Quiet Character Signal row for profile management surfaces.
 * Intentionally lightweight — not a dashboard or progression card.
 */
export default function CharacterSignalCard({
  signalId,
  confirmationCount,
  countLabel,
  actions,
}: CharacterSignalCardProps) {
  const signal = getSignalDefinition(signalId);
  const resolvedCountLabel =
    countLabel ??
    `Confirmed by ${confirmationCount} ${confirmationCount === 1 ? 'person' : 'people'}`;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-[#0B2D5C]/08 bg-white/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#0B2D5C]">
          <CharacterSignalIcon signalId={signalId} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-[#0B2D5C]">{signal.title}</h3>
          <p className="mt-1 text-sm text-[#5A6575]">{resolvedCountLabel}</p>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{actions}</div> : null}
    </article>
  );
}
