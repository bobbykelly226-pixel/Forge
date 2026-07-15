'use client';

import Link from 'next/link';
import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

/** Exact comparison size from supplied Gemini SVG / navy crop. */
export const SIGNATURE_V5_COMPARE = {
  widthPx: 360,
  heightPx: 127,
  viewBox: '0 0 360 127' as const,
  cropPath: '/internal/forge-button-navy-reference-crop.png',
  dataCandidate: 'forge-signature-v5',
} as const;

/**
 * Supplied Gemini SVG chassis — geometry/colors/stops unchanged.
 * Only React attribute syntax + unique IDs via useId().
 */
function SignatureV5Chassis() {
  const uid = useId().replace(/:/g, '');
  const chromeRim = `chrome-rim-${uid}`;
  const glassNavy = `glass-navy-${uid}`;
  const innerGlow = `inner-glow-${uid}`;

  return (
    <svg
      className="btn-chassis"
      viewBox="0 0 360 127"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      pointerEvents="none"
      data-sig-v5-svg="true"
    >
      <defs>
        <linearGradient id={chromeRim} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="12%" stopColor="#A3A8B5" />
          <stop offset="45%" stopColor="#4A4E5A" />
          <stop offset="50%" stopColor="#1F2126" />
          <stop offset="55%" stopColor="#E2E5EC" />
          <stop offset="85%" stopColor="#737885" />
          <stop offset="100%" stopColor="#141518" />
        </linearGradient>

        <linearGradient id={glassNavy} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0E254A" />
          <stop offset="30%" stopColor="#081730" />
          <stop offset="100%" stopColor="#030A16" />
        </linearGradient>

        <filter id={innerGlow} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="shadowDiff"
          />
          <feFlood floodColor="#FFFFFF" floodOpacity="0.4" />
          <feComposite in2="shadowDiff" operator="in" />
          <feComposite in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      <rect
        x="0.5"
        y="0.5"
        width="359"
        height="126"
        rx="6"
        stroke={`url(#${chromeRim})`}
        strokeWidth="5"
        fill="#181A1F"
      />

      <rect
        x="5.5"
        y="5.5"
        width="349"
        height="116"
        rx="5"
        stroke="#2B2E36"
        strokeWidth="1.5"
        fill="none"
      />

      <rect
        x="7"
        y="7"
        width="346"
        height="112"
        rx="4"
        fill={`url(#${glassNavy})`}
        filter={`url(#${innerGlow})`}
      />

      <path
        d="M 12 12 Q 12 9 17 9 L 343 9 Q 348 9 348 12 L 348 24 C 348 15 12 15 12 24 Z"
        fill="#FFFFFF"
        fillOpacity="0.25"
      />

      <line
        x1="16"
        y1="10"
        x2="344"
        y2="10"
        stroke="#FFFFFF"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
    </svg>
  );
}

type CommonProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  /** Exact 360×127 comparison size (default true for review). */
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

export type ForgeSignatureV5Props = AsButton | AsLink;

/**
 * ForgeSignatureV5 — Signature Implementation Candidate.
 * Literal Gemini SVG chassis. Internal review only. Not product-rolled-out.
 */
export default function ForgeSignatureV5(props: ForgeSignatureV5Props) {
  const {
    children = 'View My Profile',
    className,
    disabled,
    loading,
    block,
    compareSize = true,
    ...rest
  } = props;

  const blockInteraction = Boolean(disabled || loading);
  const classes = [
    'forge-premium-btn',
    compareSize ? 'forge-premium-btn--compare' : '',
    block ? 'forge-premium-btn--block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <SignatureV5Chassis />
      <span className="btn-text">
        {loading ? (
          <>
            <span className="forge-premium-btn__spinner" aria-hidden="true" />
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
    'data-visual-candidate': SIGNATURE_V5_COMPARE.dataCandidate,
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
