'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { setDiscoveryVisibilityAction } from '@/app/actions/discovery';

type Props = {
  enabled: boolean;
  canEnable: boolean;
  message: string | null;
};

export default function DiscoveryVisibilityToggle({
  enabled: initialEnabled,
  canEnable,
  message,
}: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onToggle = (next: boolean) => {
    if (pending) return;
    if (next && !canEnable) {
      setError(message || 'Couldn’t update. Try again.');
      return;
    }

    setError(null);
    const previous = enabled;
    setEnabled(next);

    startTransition(async () => {
      const result = await setDiscoveryVisibilityAction(next);
      if (!result.success) {
        setEnabled(previous);
        setError('Couldn’t update. Try again.');
        return;
      }
      setEnabled(result.data.enabled);
      router.refresh();
    });
  };

  return (
    <section
      className="rounded-[1.5rem] border border-[#0B2D5C]/08 bg-white/90 px-4 py-4 shadow-[0_8px_28px_rgba(11,45,92,0.04)]"
      aria-labelledby="discovery-visibility-title"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2
            id="discovery-visibility-title"
            className="text-[15px] font-semibold text-[#0B2D5C]"
          >
            Show Me in Discovery
          </h2>
          <p className="mt-1 text-sm leading-snug text-[#5A6575]">
            Let other Forge members discover your profile.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={pending || (!canEnable && !enabled)}
          onClick={() => onToggle(!enabled)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${
            enabled ? 'bg-[#D62828]' : 'bg-[#0B2D5C]/20'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
              enabled ? 'left-7' : 'left-1'
            }`}
          />
          <span className="sr-only">Show Me in Discovery</span>
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-[#D62828]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
