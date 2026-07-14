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
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onToggle = (next: boolean) => {
    if (pending) return;
    if (next && !canEnable) {
      setError(message || 'Discovery visibility is unavailable for this account.');
      return;
    }

    setError(null);
    setStatus(null);
    const previous = enabled;
    setEnabled(next);

    startTransition(async () => {
      const result = await setDiscoveryVisibilityAction(next);
      if (!result.success) {
        setEnabled(previous);
        setError(result.message);
        return;
      }
      setEnabled(result.data.enabled);
      setStatus(result.data.message);
      router.refresh();
    });
  };

  return (
    <section
      className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_32px_rgba(11,45,92,0.04)]"
      aria-labelledby="discovery-visibility-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="discovery-visibility-title"
            className="text-xl text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Show Me in Discovery
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
            Allow other Forge members to discover your profile. You can turn this off at any time.
            Profile completion is optional — share only what you are ready to share.
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

      {!canEnable ? (
        <p className="mt-4 rounded-2xl bg-[#F8F6F2] px-4 py-3 text-sm text-[#5A6575]" role="status">
          Discovery visibility is unavailable for this account.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-[#D62828]" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="mt-3 text-sm text-[#0B2D5C]" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
