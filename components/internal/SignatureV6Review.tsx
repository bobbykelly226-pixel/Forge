'use client';

import Image from 'next/image';
import { useState } from 'react';

import ForgeSignatureV6, {
  SIGNATURE_V6_COMPARE,
} from '@/components/ui/ForgeSignatureV6';

type ReviewMode = 'side-by-side' | 'overlay' | 'implementation-only';

/**
 * Internal-only navy Signature V6 review tool.
 * Exact crop vs literal Gemini SVG at 360×127.
 */
export default function SignatureV6Review() {
  const [mode, setMode] = useState<ReviewMode>('side-by-side');
  const { widthPx, heightPx, cropPath } = SIGNATURE_V6_COMPARE;

  return (
    <div className="forge-sig-v6-review" data-review-tool="signature-v6">
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['side-by-side', 'Side by side'],
            ['overlay', 'Overlay reference'],
            ['implementation-only', 'Implementation only'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              mode === id
                ? 'border-[#0B2D5C] bg-[#0B2D5C] text-white'
                : 'border-[#0B2D5C]/20 bg-white text-[#0B2D5C]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'side-by-side' ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A93A0]">
              Actual navy reference
            </p>
            <div
              className="relative overflow-hidden"
              style={{
                width: widthPx,
                height: heightPx,
                background: 'var(--forge-app-background, #E8EBF0)',
              }}
            >
              <Image
                src={cropPath}
                alt="Exact navy button crop from the approved reference plate"
                width={654}
                height={230}
                className="h-full w-full object-fill"
                unoptimized
                priority
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A93A0]">
              Implementation candidate — Signature V6
            </p>
            <div
              style={{
                width: widthPx,
                height: heightPx,
                background: 'var(--forge-app-background, #E8EBF0)',
              }}
              className="flex items-center justify-center"
            >
              <ForgeSignatureV6 compareSize />
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'overlay' ? (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A93A0]">
            Overlay reference @ 50% — design-review tool only
          </p>
          <div
            className="relative"
            style={{
              width: widthPx,
              height: heightPx,
              background: 'var(--forge-app-background, #E8EBF0)',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <ForgeSignatureV6 compareSize />
            </div>
            <Image
              src={cropPath}
              alt=""
              width={654}
              height={230}
              aria-hidden="true"
              unoptimized
              className="pointer-events-none absolute inset-0 h-full w-full object-fill"
              style={{ opacity: 0.5 }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#8A93A0]">
            Overlay is decorative (pointer-events: none). Interactive control remains Signature V6.
          </p>
        </div>
      ) : null}

      {mode === 'implementation-only' ? (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A93A0]">
            Implementation candidate — Signature V6
          </p>
          <div
            style={{
              width: widthPx,
              height: heightPx,
              background: 'var(--forge-app-background, #E8EBF0)',
            }}
            className="flex items-center justify-center"
          >
            <ForgeSignatureV6 compareSize />
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] text-[#8A93A0]">
        Comparison box {widthPx}×{heightPx}px · viewBox {SIGNATURE_V6_COMPARE.viewBox} ·
        data-visual-candidate=&quot;{SIGNATURE_V6_COMPARE.dataCandidate}&quot;
      </p>
    </div>
  );
}
