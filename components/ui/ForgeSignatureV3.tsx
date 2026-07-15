'use client';

import Link from 'next/link';
import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

/** Comparison box locked to navy reference crop aspect (654×230). */
export const SIGNATURE_V3_COMPARE = {
  widthPx: 360,
  heightPx: Math.round((360 * 230) / 654), // 126
  cropAspect: 654 / 230,
  cropPath: '/internal/forge-button-navy-reference-crop.png',
  cropSource: '/internal/forge-button-approved-reference.png',
  dataCandidate: 'forge-signature-v3',
} as const;

/**
 * Decorative SVG chassis for Signature V3 — navy Tier 1 only.
 * Completely independent from ForgeButtonReferenceChassis / referenceFaithful.
 */
function SignatureV3Chassis() {
  const uid = useId().replace(/:/g, '');
  const metal = `sigv3-metal-${uid}`;
  const metalEdge = `sigv3-edge-${uid}`;
  const rim = `sigv3-rim-${uid}`;
  const face = `sigv3-face-${uid}`;
  const glass = `sigv3-glass-${uid}`;
  const frameMask = `sigv3-frame-${uid}`;
  const channelMask = `sigv3-channel-${uid}`;

  // viewBox matches crop aspect ≈ 654:230
  const W = 654;
  const H = 230;
  // Measured from navy crop: ~15.5% frame each side, ~70% face height
  const T = 34; // chassis thickness
  const CHANNEL = 5;
  const FACE = T + CHANNEL; // 39
  const OUTER_RX = 28; // controlled rounded-rect (~12% of H) — long flats
  const BEVEL_RX = 22;
  const FACE_RX = 17;

  return (
    <svg
      className="forge-sig-v3__svg"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-sig-v3-svg="true"
    >
      <defs>
        {/* Continuous bright chrome — balanced perimeter, not bottom-heavy */}
        <linearGradient id={metal} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="12%" stopColor="#F4F6F8" />
          <stop offset="28%" stopColor="#DDE3EA" />
          <stop offset="45%" stopColor="#B8C0CA" />
          <stop offset="58%" stopColor="#D5DBE3" />
          <stop offset="72%" stopColor="#C7CED6" />
          <stop offset="88%" stopColor="#9AA3AF" />
          <stop offset="100%" stopColor="#7A8492" />
        </linearGradient>
        <linearGradient id={metalEdge} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#C7CED6" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#5A6575" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={rim} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#E8EDF2" />
          <stop offset="100%" stopColor="#AEB7C1" />
        </linearGradient>
        <linearGradient id={face} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#163A66" />
          <stop offset="32%" stopColor="#0B2D5C" />
          <stop offset="68%" stopColor="#0B2D5C" />
          <stop offset="100%" stopColor="#071E3F" />
        </linearGradient>
        <linearGradient id={glass} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.07" />
          <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.015" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <mask id={frameMask} maskUnits="userSpaceOnUse">
          <rect width={W} height={H} rx={OUTER_RX} fill="#fff" />
          <rect x={T} y={T} width={W - T * 2} height={H - T * 2} rx={BEVEL_RX} fill="#000" />
        </mask>
        <mask id={channelMask} maskUnits="userSpaceOnUse">
          <rect
            x={T - 1}
            y={T - 1}
            width={W - (T - 1) * 2}
            height={H - (T - 1) * 2}
            rx={BEVEL_RX + 0.5}
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

      {/* Main chrome chassis ring — even wrap, no pedestal plate */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${metal})`}
        mask={`url(#${frameMask})`}
      />
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${metalEdge})`}
        mask={`url(#${frameMask})`}
        opacity="0.4"
      />

      {/* Continuous outer polished lip */}
      <rect
        x="1.2"
        y="1.2"
        width={W - 2.4}
        height={H - 2.4}
        rx={OUTER_RX - 0.6}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        opacity="0.75"
        mask={`url(#${frameMask})`}
      />
      <rect
        x="2.4"
        y="2.4"
        width={W - 4.8}
        height={H - 4.8}
        rx={OUTER_RX - 1.2}
        fill="none"
        stroke="#68727D"
        strokeWidth="1.2"
        opacity="0.35"
        mask={`url(#${frameMask})`}
      />

      {/* Distinct bright inner silver rim */}
      <rect
        x={T - 1.5}
        y={T - 1.5}
        width={W - (T - 1.5) * 2}
        height={H - (T - 1.5) * 2}
        rx={BEVEL_RX}
        fill="none"
        stroke={`url(#${rim})`}
        strokeWidth="3.2"
        opacity="0.95"
      />
      <rect
        x={T}
        y={T}
        width={W - T * 2}
        height={H - T * 2}
        rx={BEVEL_RX}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.1"
        opacity="0.55"
      />

      {/* Graphite channel */}
      <rect width={W} height={H} fill="#1D252E" mask={`url(#${channelMask})`} opacity="0.88" />
      <rect
        x={FACE - 0.8}
        y={FACE - 0.8}
        width={W - (FACE - 0.8) * 2}
        height={H - (FACE - 0.8) * 2}
        rx={FACE_RX + 0.5}
        fill="none"
        stroke="#26303A"
        strokeWidth="1.4"
        opacity="0.9"
      />

      {/* Recessed navy face */}
      <rect
        x={FACE}
        y={FACE}
        width={W - FACE * 2}
        height={H - FACE * 2}
        rx={FACE_RX}
        fill={`url(#${face})`}
      />
      <rect
        x={FACE}
        y={FACE}
        width={W - FACE * 2}
        height={H - FACE * 2}
        rx={FACE_RX}
        fill="none"
        stroke="#000000"
        strokeWidth="2"
        opacity="0.18"
      />

      {/* Soft integrated upper glass — no ellipse sticker */}
      <rect
        x={FACE + 2}
        y={FACE + 1.5}
        width={W - (FACE + 2) * 2}
        height={(H - FACE * 2) * 0.48}
        rx={FACE_RX - 2}
        fill={`url(#${glass})`}
      />
    </svg>
  );
}

type CommonProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Force comparison box dimensions (primary review). */
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

export type ForgeSignatureV3Props = AsButton | AsLink;

/**
 * ForgeSignatureV3 — navy Tier 1 Signature Implementation Candidate.
 * Authoritative component for /internal/visual-system primary review.
 * Not rolled out to product routes.
 */
export default function ForgeSignatureV3(props: ForgeSignatureV3Props) {
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
    'forge-sig-v3',
    compareSize ? 'forge-sig-v3--compare' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <span className="forge-sig-v3__art" aria-hidden="true">
        <SignatureV3Chassis />
      </span>
      <span className="forge-sig-v3__label">
        {loading ? (
          <>
            <span className="forge-sig-v3__spinner" aria-hidden="true" />
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
    'data-visual-candidate': SIGNATURE_V3_COMPARE.dataCandidate,
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
