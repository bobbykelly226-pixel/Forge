'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

import type { ConversationStarter } from '@/lib/conversations/types';

type ConversationStartersProps = {
  starters: ConversationStarter[];
  onSelect: (text: string) => void;
};

const VISIBLE_COUNT = 2;

export default function ConversationStarters({ starters, onSelect }: ConversationStartersProps) {
  const [dismissed, setDismissed] = useState(false);
  const [rotation, setRotation] = useState(0);

  const rotatedStarters = useMemo(() => {
    if (starters.length === 0) return [];
    const offset = rotation % starters.length;
    return [...starters.slice(offset), ...starters.slice(0, offset)];
  }, [rotation, starters]);

  const visibleStarters = rotatedStarters.slice(0, VISIBLE_COUNT);

  if (dismissed) {
    return null;
  }

  if (starters.length === 0) {
    return (
      <p className="px-1 text-sm leading-relaxed text-[#8A93A0]">
        Suggestions will appear as more profile details are available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
          Conversation starters
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRotation((value) => value + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#7A8494] transition hover:bg-[#0B2D5C]/06 hover:text-[#0B2D5C]"
            aria-label="Refresh suggestions"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#7A8494] transition hover:bg-[#0B2D5C]/06 hover:text-[#0B2D5C]"
            aria-label="Dismiss suggestions"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {visibleStarters.map((starter) => (
          <li key={starter.id}>
            <button
              type="button"
              onClick={() => onSelect(starter.text)}
              className="w-full rounded-2xl border border-[#0B2D5C]/12 bg-white px-4 py-3 text-left text-[15px] leading-relaxed text-[#0B2D5C] transition hover:border-[#0B2D5C]/25 hover:bg-[#FBF9F6]"
            >
              {starter.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
