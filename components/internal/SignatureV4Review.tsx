'use client';

import Image from 'next/image';
import { useState } from 'react';

import ForgeSignatureV4, {
  SIGNATURE_V4_COMPARE,
} from '@/components/ui/ForgeSignatureV4';

type ReviewMode = 'side-by-side' | 'overlay' | 'implementation-only';

/**
 * Internal-only navy Signature V4 review tool.
 * Exact crop vs ForgeSignatureV4 at identical dimensions.
 */
export default function SignatureV4Review() {
  const [mode, setMode] = useState<ReviewMode>('side-by-side');
  const { widthPx, heightPx, cropPath } = SIGNATURE_V4_COMPARE;

  return (
    <div className="forge-sig-v4-review" data-review-tool="signature-v4">
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
              Implementation candidate — Signature V4
            </p>
            <div
              style={{
                width: widthPx,
                height: heightPx,
                background: 'var(--forge-app-background, #E8EBF0)',
              }}
              className="flex items-center justify-center"
            >
              <ForgeSignatureV4 compareSize />
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
              <ForgeSignatureV4 compareSize />
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
            Overlay is decorative (pointer-events: none). Interactive control remains Signature V4.
          </p>
        </div>
      ) : null}

      {mode === 'implementation-only' ? (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A93A0]">
            Implementation candidate — Signature V4
          </p>
          <div
            style={{
              width: widthPx,
              height: heightPx,
              background: 'var(--forge-app-background, #E8EBF0)',
            }}
            className="flex items-center justify-center"
          >
            <ForgeSignatureV4 compareSize />
          </div>
        </div>
      ) : null}

      <ul className="mt-5 grid gap-1.5 border border-[#0B2D5C]/08 bg-[#F7F8FA] p-4 text-xs text-[#5A6575] sm:grid-cols-2 lg:grid-cols-3">
        <li>• Outer silhouette</li>
        <li>• Chrome sharpness</li>
        <li>• Upper polished lip</li>
        <li>• Side metal definition</li>
        <li>• Lower steel depth</li>
        <li>• Inner silver rim</li>
        <li>• Graphite channel</li>
        <li>• Face proportion</li>
        <li>• Navy depth</li>
        <li>• Glass specular line</li>
        <li>• Broad reflection</li>
        <li>• Typography</li>
        <li>• Contact shadow</li>
      </ul>

      <p className="mt-3 text-[11px] text-[#8A93A0]">
        Comparison box {widthPx}×{heightPx}px · viewBox {SIGNATURE_V4_COMPARE.viewBox} ·
        data-visual-candidate=&quot;{SIGNATURE_V4_COMPARE.dataCandidate}&quot;
      </p>
    </div>
  );
}
