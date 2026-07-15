'use client';

import Link from 'next/link';
import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

/** Comparison box locked to exact navy reference crop aspect (654×230). */
export const SIGNATURE_V4_COMPARE = {
  widthPx: 360,
  heightPx: Math.round((360 * 230) / 654), // 127
  viewBox: '0 0 654 230' as const,
  cropPath: '/internal/forge-button-navy-reference-crop.png',
  cropSource: '/internal/forge-button-approved-reference.png',
  dataCandidate: 'forge-signature-v4',
} as const;

/**
 * Precision multi-layer chrome SVG for Signature V4.
 * Independent of V3 / referenceFaithful — do not reuse those paths.
 * Decorative only; parent supplies real HTML text + interaction.
 */
function SignatureV4Chassis() {
  const uid = useId().replace(/:/g, '');

  const metalVert = `sigv4-metal-v-${uid}`;
  const metalDiag = `sigv4-metal-d-${uid}`;
  const lip = `sigv4-lip-${uid}`;
  const leftSpec = `sigv4-left-${uid}`;
  const rightSteel = `sigv4-right-${uid}`;
  const upperBright = `sigv4-upper-${uid}`;
  const lowerDepth = `sigv4-lower-${uid}`;
  const bevel = `sigv4-bevel-${uid}`;
  const face = `sigv4-face-${uid}`;
  const faceEdge = `sigv4-face-edge-${uid}`;
  const glassBroad = `sigv4-glass-${uid}`;
  const frameMask = `sigv4-frame-${uid}`;
  const channelMask = `sigv4-channel-${uid}`;
  const lipMask = `sigv4-lip-mask-${uid}`;

  const W = 654;
  const H = 230;
  // ~74% face height → combined top/bottom metal+channel ≈ 26% (~30 units each side)
  const T = 26;
  const CHANNEL = 4;
  const FACE = T + CHANNEL; // 30
  // Nested concentric corners (viewBox units ≈ 11–13 / 8–10 / 6 px at 360×127)
  const OUTER_RX = 22;
  const BEVEL_RX = 16;
  const FACE_RX = 11;

  return (
    <svg
      className="forge-sig-v4__svg"
      viewBox={SIGNATURE_V4_COMPARE.viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
      data-sig-v4-svg="true"
    >
      <defs>
        {/* Main chrome chassis — vertical bright-to-dark steel variation */}
        <linearGradient id={metalVert} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#303840" />
          <stop offset="3%" stopColor="#FDFEFF" />
          <stop offset="9%" stopColor="#DDE3E8" />
          <stop offset="20%" stopColor="#89939D" />
          <stop offset="34%" stopColor="#F7F9FB" />
          <stop offset="48%" stopColor="#BCC4CC" />
          <stop offset="65%" stopColor="#737D87" />
          <stop offset="82%" stopColor="#414A53" />
          <stop offset="94%" stopColor="#C9D0D6" />
          <stop offset="100%" stopColor="#2D343B" />
        </linearGradient>

        <linearGradient id={metalDiag} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#C9D0D6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#2D343B" stopOpacity="0.35" />
        </linearGradient>

        <linearGradient id={lip} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="18%" stopColor="#F8FAFC" />
          <stop offset="40%" stopColor="#E6EBF0" />
          <stop offset="62%" stopColor="#AAB3BD" />
          <stop offset="82%" stopColor="#5D6670" />
          <stop offset="100%" stopColor="#303840" />
        </linearGradient>

        <linearGradient id={leftSpec} x1="0%" y1="50%" x2="40%" y2="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={rightSteel} x1="100%" y1="50%" x2="60%" y2="50%">
          <stop offset="0%" stopColor="#303840" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#303840" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={upperBright} x1="0%" y1="0%" x2="0%" y2="45%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={lowerDepth} x1="0%" y1="100%" x2="0%" y2="55%">
          <stop offset="0%" stopColor="#2D343B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2D343B" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={bevel} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#E6EBF0" />
          <stop offset="100%" stopColor="#89939D" />
        </linearGradient>

        <linearGradient id={face} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1B4D82" />
          <stop offset="18%" stopColor="#174474" />
          <stop offset="42%" stopColor="#0B2D5C" />
          <stop offset="68%" stopColor="#09274F" />
          <stop offset="100%" stopColor="#071D3B" />
        </linearGradient>

        <linearGradient id={faceEdge} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#05162E" stopOpacity="0" />
          <stop offset="70%" stopColor="#05162E" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#05162E" stopOpacity="0.45" />
        </linearGradient>

        <linearGradient id={glassBroad} x1="18%" y1="0%" x2="55%" y2="70%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Chassis ring between outer silhouette and inner opening */}
        <mask id={frameMask} maskUnits="userSpaceOnUse">
          <rect width={W} height={H} rx={OUTER_RX} fill="#fff" />
          <rect x={T} y={T} width={W - T * 2} height={H - T * 2} rx={BEVEL_RX} fill="#000" />
        </mask>

        {/* Outer lip as thin outer band */}
        <mask id={lipMask} maskUnits="userSpaceOnUse">
          <rect width={W} height={H} rx={OUTER_RX} fill="#fff" />
          <rect
            x="3.5"
            y="3.5"
            width={W - 7}
            height={H - 7}
            rx={OUTER_RX - 2}
            fill="#000"
          />
        </mask>

        {/* Graphite channel between bevel and face */}
        <mask id={channelMask} maskUnits="userSpaceOnUse">
          <rect
            x={T - 0.5}
            y={T - 0.5}
            width={W - (T - 0.5) * 2}
            height={H - (T - 0.5) * 2}
            rx={BEVEL_RX + 0.4}
            fill="#fff"
          />
          <rect
            x={FACE}
            y={FACE}
            width={W - FACE * 2}
            height={H - FACE * 2}
            rx={FACE_RX}
            fill="#000"
          />
        </mask>
      </defs>

      {/* 1. Dark external depth shape — aligned, not a pedestal */}
      <rect
        x="0.8"
        y="1.2"
        width={W - 1.6}
        height={H - 1.6}
        rx={OUTER_RX}
        fill="#1A222B"
        opacity="0.35"
      />

      {/* 2. Bright outer polished lip */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${lip})`}
        mask={`url(#${lipMask})`}
      />

      {/* 3. Main chrome chassis ring */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${metalVert})`}
        mask={`url(#${frameMask})`}
      />

      {/* 4. Diagonal bright-to-dark steel variation */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${metalDiag})`}
        mask={`url(#${frameMask})`}
        opacity="0.55"
      />

      {/* 5. Left specular overlay */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${leftSpec})`}
        mask={`url(#${frameMask})`}
      />

      {/* 5b. Right steel overlay */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${rightSteel})`}
        mask={`url(#${frameMask})`}
      />

      {/* 6. Upper chrome brightness + lower-right steel depth */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${upperBright})`}
        mask={`url(#${frameMask})`}
      />
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${lowerDepth})`}
        mask={`url(#${frameMask})`}
      />

      {/* Outer lip hairline definition */}
      <rect
        x="1"
        y="1"
        width={W - 2}
        height={H - 2}
        rx={OUTER_RX - 0.5}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        opacity="0.7"
        mask={`url(#${frameMask})`}
      />
      <rect
        x="2.2"
        y="2.2"
        width={W - 4.4}
        height={H - 4.4}
        rx={OUTER_RX - 1.2}
        fill="none"
        stroke="#5D6670"
        strokeWidth="1"
        opacity="0.4"
        mask={`url(#${frameMask})`}
      />

      {/* 7. Bright inner chrome bevel */}
      <rect
        x={T - 1.8}
        y={T - 1.8}
        width={W - (T - 1.8) * 2}
        height={H - (T - 1.8) * 2}
        rx={BEVEL_RX}
        fill="none"
        stroke={`url(#${bevel})`}
        strokeWidth="3.4"
        opacity="0.95"
      />

      {/* 8. Ultra-fine inner white specular line (~1px at review size) */}
      <rect
        x={T}
        y={T}
        width={W - T * 2}
        height={H - T * 2}
        rx={BEVEL_RX}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.15"
        opacity="0.48"
      />
      {/* Stronger along top inner edge only */}
      <path
        d={`M ${T + BEVEL_RX} ${T + 0.6} H ${W - T - BEVEL_RX}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* 9. Graphite channel */}
      <rect width={W} height={H} fill="#1A222B" mask={`url(#${channelMask})`} opacity="0.95" />
      <rect
        x={FACE - 1}
        y={FACE - 1}
        width={W - (FACE - 1) * 2}
        height={H - (FACE - 1) * 2}
        rx={FACE_RX + 0.5}
        fill="none"
        stroke="#242E38"
        strokeWidth="1.6"
        opacity="0.9"
      />
      <rect
        x={FACE - 0.4}
        y={FACE - 0.4}
        width={W - (FACE - 0.4) * 2}
        height={H - (FACE - 0.4) * 2}
        rx={FACE_RX + 0.2}
        fill="none"
        stroke="#303A44"
        strokeWidth="0.8"
        opacity="0.7"
      />

      {/* 10. Recessed navy glass face */}
      <rect
        x={FACE}
        y={FACE}
        width={W - FACE * 2}
        height={H - FACE * 2}
        rx={FACE_RX}
        fill={`url(#${face})`}
      />

      {/* 11. Navy edge-darkening layer */}
      <rect
        x={FACE}
        y={FACE}
        width={W - FACE * 2}
        height={H - FACE * 2}
        rx={FACE_RX}
        fill={`url(#${faceEdge})`}
      />
      <rect
        x={FACE}
        y={FACE}
        width={W - FACE * 2}
        height={H - FACE * 2}
        rx={FACE_RX}
        fill="none"
        stroke="#05162E"
        strokeWidth="2.2"
        opacity="0.28"
      />

      {/* Ultra-fine glass specular line inside upper face edge */}
      <path
        d={`
          M ${FACE + FACE_RX * 0.55} ${FACE + 1.4}
          H ${W - FACE - FACE_RX * 0.55}
        `}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Soft corner tapers */}
      <path
        d={`M ${FACE + 2} ${FACE + FACE_RX * 0.45} Q ${FACE + 1.2} ${FACE + 1.4} ${FACE + FACE_RX * 0.55} ${FACE + 1.4}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.28"
      />
      <path
        d={`M ${W - FACE - FACE_RX * 0.55} ${FACE + 1.4} Q ${W - FACE - 1.2} ${FACE + 1.4} ${W - FACE - 2} ${FACE + FACE_RX * 0.45}`}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.28"
      />

      {/* 12. Broad integrated upper glass illumination */}
      <path
        d={`
          M ${FACE + FACE_RX * 0.4} ${FACE + 2}
          H ${W - FACE - FACE_RX * 0.4}
          Q ${W - FACE - 1} ${FACE + H * 0.16} ${W * 0.62} ${FACE + H * 0.28}
          Q ${W * 0.42} ${FACE + H * 0.34} ${FACE + 2} ${FACE + H * 0.22}
          Q ${FACE + 1} ${FACE + H * 0.1} ${FACE + FACE_RX * 0.4} ${FACE + 2}
          Z
        `}
        fill={`url(#${glassBroad})`}
      />
    </svg>
  );
}

type CommonProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  compareSize?: boolean;
};

type AsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children' | 'disabled'> & {
    href?: undefined;
  };

type AsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, 'className' | 'children'> & {
    href: string;
  };

export type ForgeSignatureV4Props = AsButton | AsLink;

/**
 * ForgeSignatureV4 — navy Tier 1 Signature Implementation Candidate.
 * Authoritative primary review component for /internal/visual-system.
 * Not rolled out to product routes. Manual approval not granted.
 */
export default function ForgeSignatureV4(props: ForgeSignatureV4Props) {
  const {
    children = 'View My Profile',
    className,
    disabled,
    loading,
    compareSize = true,
    ...rest
  } = props;

  const blockInteraction = Boolean(disabled || loading);
  const classes = [
    'forge-sig-v4',
    compareSize ? 'forge-sig-v4--compare' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <span className="forge-sig-v4__art" aria-hidden="true">
        <SignatureV4Chassis />
      </span>
      <span className="forge-sig-v4__label">
        {loading ? (
          <>
            <span className="forge-sig-v4__spinner" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </span>
    </>
  );

  const shared = {
    className: classes,
    'data-visual-candidate': SIGNATURE_V4_COMPARE.dataCandidate,
    'aria-busy': loading || undefined,
    'data-loading': loading ? 'true' : undefined,
  } as const;

  if ('href' in props && props.href) {
    const { href, ...linkRest } = rest as AsLink;
    if (blockInteraction) {
      return (
        <span {...shared} aria-disabled="true" role="link">
          {body}
        </span>
      );
    }
    return (
      <Link href={href} {...shared} {...linkRest}>
        {body}
      </Link>
    );
  }

  const buttonRest = rest as AsButton;
  return (
    <button
      type={buttonRest.type ?? 'button'}
      disabled={Boolean(disabled) || Boolean(loading)}
      {...shared}
      {...buttonRest}
    >
      {body}
    </button>
  );
}
