'use client';

import Link from 'next/link';
import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

/** Exact comparison size — Gemini SVG / navy crop. */
export const SIGNATURE_V6_COMPARE = {
  widthPx: 360,
  heightPx: 127,
  viewBox: '0 0 360 127' as const,
  cropPath: '/internal/forge-button-navy-reference-crop.png',
  dataCandidate: 'forge-signature-v6',
} as const;

/**
 * Gemini recalibrated SVG chassis — geometry/colors/stops unchanged.
 * React attribute syntax + unique IDs via useId() only.
 */
function SignatureV6Chassis() {
  const uid = useId().replace(/:/g, '');
  const brightChrome = `bright-chrome-${uid}`;
  const deepGlassNavy = `deep-glass-navy-${uid}`;
  const crispInnerGlow = `crisp-inner-glow-${uid}`;

  return (
    <svg
      className="v6-chassis"
      viewBox="0 0 360 127"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      pointerEvents="none"
      data-sig-v6-svg="true"
    >
      <defs>
        <linearGradient id={brightChrome} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="8%" stopColor="#E2E5EC" />
          <stop offset="25%" stopColor="#A3A8B5" />
          <stop offset="48%" stopColor="#5A5E6B" />
          <stop offset="50%" stopColor="#141518" />
          <stop offset="54%" stopColor="#F5F7FA" />
          <stop offset="75%" stopColor="#9CA2B0" />
          <stop offset="100%" stopColor="#222429" />
        </linearGradient>

        <linearGradient id={deepGlassNavy} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0E2447" />
          <stop offset="35%" stopColor="#07152B" />
          <stop offset="100%" stopColor="#020813" />
        </linearGradient>

        <filter id={crispInnerGlow} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="shadowDiff"
          />
          <feFlood floodColor="#FFFFFF" floodOpacity="0.35" />
          <feComposite in2="shadowDiff" operator="in" />
          <feComposite in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      <rect
        x="1.5"
        y="1.5"
        width="357"
        height="124"
        rx="6"
        stroke={`url(#${brightChrome})`}
        strokeWidth="3"
        fill="#1A1C22"
      />

      <rect
        x="4.5"
        y="4.5"
        width="351"
        height="118"
        rx="4.5"
        stroke="#090B0E"
        strokeWidth="1.5"
        fill="none"
      />

      <rect
        x="6"
        y="6"
        width="348"
        height="115"
        rx="3.5"
        fill={`url(#${deepGlassNavy})`}
        filter={`url(#${crispInnerGlow})`}
      />

      <path
        d="M 9 10 Q 9 7 14 7 L 346 7 Q 351 7 351 10 L 351 22 C 351 14 9 14 9 22 Z"
        fill="#FFFFFF"
        fillOpacity="0.22"
      />

      <line
        x1="12"
        y1="8"
        x2="348"
        y2="8"
        stroke="#FFFFFF"
        strokeOpacity="0.5"
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

export type ForgeSignatureV6Props = AsButton | AsLink;

/**
 * ForgeSignatureV6 — Signature Implementation Candidate.
 * Literal Gemini recalibrated SVG. Internal review only. Not product-rolled-out.
 */
export default function ForgeSignatureV6(props: ForgeSignatureV6Props) {
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
    'forge-signature-v6',
    compareSize ? 'forge-signature-v6--compare' : '',
    block ? 'forge-signature-v6--block' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <SignatureV6Chassis />
      <span className="v6-text">
        {loading ? (
          <>
            <span className="forge-signature-v6__spinner" aria-hidden="true" />
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
    'data-visual-candidate': SIGNATURE_V6_COMPARE.dataCandidate,
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
