'use client';

import { useId } from 'react';

export type ReferenceFaithfulFace = 'navy' | 'soft-slate' | 'white' | 'graphite' | 'red';

const FACE_STOPS: Record<
  ReferenceFaithfulFace,
  { top: string; mid: string; bottom: string; text: string }
> = {
  navy: {
    top: '#1A4578',
    mid: '#0B2D5C',
    bottom: '#071E3F',
    text: '#FFFFFF',
  },
  'soft-slate': {
    top: '#F4F6F8',
    mid: '#E8EBF0',
    bottom: '#D5DBE3',
    text: '#0B2D5C',
  },
  white: {
    top: '#FFFFFF',
    mid: '#F7F8FA',
    bottom: '#E8EDF2',
    text: '#0B2D5C',
  },
  graphite: {
    top: '#7A8492',
    mid: '#5A6575',
    bottom: '#3F4754',
    text: '#F4F6F8',
  },
  red: {
    top: '#E04545',
    mid: '#D62828',
    bottom: '#A81C1C',
    text: '#FFFFFF',
  },
};

/**
 * Independent SVG chassis for the referenceFaithful Tier 1 candidate.
 *
 * Canonical viewBox 320×60 derived from the approved rendering:
 * - chassis thickness ≈ 17% of height (≈10.2 / 60)
 * - outer corner radius ≈ 18% of height (≈11 / 60)
 * - face inset past metal + graphite channel
 * - nested concentric radii
 *
 * Decorative only — parent supplies real HTML text and interaction.
 */
export default function ForgeButtonReferenceChassis({
  face = 'navy',
}: {
  face?: ReferenceFaithfulFace;
}) {
  const uid = useId().replace(/:/g, '');
  const stops = FACE_STOPS[face];

  const metal = `rf-metal-${uid}`;
  const metalVert = `rf-metal-v-${uid}`;
  const steel = `rf-steel-${uid}`;
  const specular = `rf-spec-${uid}`;
  const bevel = `rf-bevel-${uid}`;
  const faceGrad = `rf-face-${uid}`;
  const glass = `rf-glass-${uid}`;
  const frameMask = `rf-frame-mask-${uid}`;
  const channelMask = `rf-channel-mask-${uid}`;

  // Proportions in viewBox units (height = 60)
  // Chassis ring ≈ 10.2 → 17% of height
  const T = 10.2;
  const CHANNEL = 1.6;
  const FACE_INSET = T + CHANNEL;
  const OUTER_RX = 11;
  const FACE_RX = 6.5;
  const BEVEL_RX = 8;
  const W = 320;
  const H = 60;

  return (
    <svg
      className="forge-btn-rf__svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Main polished silver — bright TL → dark BR */}
        <linearGradient id={metal} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="8%" stopColor="#F6F8FA" />
          <stop offset="18%" stopColor="#E8EDF2" />
          <stop offset="32%" stopColor="#C7CED6" />
          <stop offset="48%" stopColor="#8A949F" />
          <stop offset="62%" stopColor="#AEB7C1" />
          <stop offset="78%" stopColor="#D5DBE3" />
          <stop offset="90%" stopColor="#68727D" />
          <stop offset="100%" stopColor="#3F4754" />
        </linearGradient>

        <linearGradient id={metalVert} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#C7CED6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#303943" stopOpacity="0.55" />
        </linearGradient>

        <linearGradient id={steel} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#303943" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#68727D" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={specular} cx="8%" cy="6%" r="42%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="40%" stopColor="#F6F8FA" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={bevel} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#E8EDF2" />
          <stop offset="100%" stopColor="#68727D" />
        </linearGradient>

        <linearGradient id={faceGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stops.top} />
          <stop offset="38%" stopColor={stops.mid} />
          <stop offset="72%" stopColor={stops.mid} />
          <stop offset="100%" stopColor={stops.bottom} />
        </linearGradient>

        {/* Shaped glass — strongest upper-left, tapers diagonally */}
        <linearGradient id={glass} x1="15%" y1="0%" x2="70%" y2="85%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Punch chassis ring */}
        <mask id={frameMask} maskUnits="userSpaceOnUse">
          <rect width={W} height={H} rx={OUTER_RX} fill="#fff" />
          <rect
            x={T}
            y={T}
            width={W - T * 2}
            height={H - T * 2}
            rx={BEVEL_RX}
            fill="#000"
          />
        </mask>

        {/* Graphite channel ring between bevel and face */}
        <mask id={channelMask} maskUnits="userSpaceOnUse">
          <rect
            x={T - 0.4}
            y={T - 0.4}
            width={W - (T - 0.4) * 2}
            height={H - (T - 0.4) * 2}
            rx={BEVEL_RX + 0.3}
            fill="#fff"
          />
          <rect
            x={FACE_INSET}
            y={FACE_INSET}
            width={W - FACE_INSET * 2}
            height={H - FACE_INSET * 2}
            rx={FACE_RX}
            fill="#000"
          />
        </mask>
      </defs>

      {/* 1–2 Dark lower chassis depth plate */}
      <rect
        x="0.6"
        y="1.2"
        width={W - 1.2}
        height={H - 1.4}
        rx={OUTER_RX}
        fill="#303943"
        opacity="0.55"
      />

      {/* 3 Main polished silver chassis */}
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
        fill={`url(#${metalVert})`}
        mask={`url(#${frameMask})`}
        opacity="0.55"
      />
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${steel})`}
        mask={`url(#${frameMask})`}
        opacity="0.7"
      />

      {/* 4 Bright upper/left specular lip */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${specular})`}
        mask={`url(#${frameMask})`}
      />
      {/* Thin outer polished lip strokes */}
      <path
        d={`M ${OUTER_RX} 1.1 H ${W - OUTER_RX}`}
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
        fill="none"
      />
      <path
        d={`M 1.1 ${OUTER_RX} V ${H - OUTER_RX - 4}`}
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
        fill="none"
      />
      {/* Bottom polish catch */}
      <path
        d={`M ${W * 0.28} ${H - 1.4} H ${W * 0.72}`}
        stroke="#E8EDF2"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
        fill="none"
      />

      {/* 5–6 Inner polished silver bevel rim */}
      <rect
        x={T - 0.8}
        y={T - 0.8}
        width={W - (T - 0.8) * 2}
        height={H - (T - 0.8) * 2}
        rx={BEVEL_RX}
        fill="none"
        stroke={`url(#${bevel})`}
        strokeWidth="2.2"
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
        strokeWidth="0.9"
        opacity="0.55"
      />

      {/* 7 Graphite inset channel */}
      <rect
        width={W}
        height={H}
        fill="#1D252E"
        mask={`url(#${channelMask})`}
        opacity="0.92"
      />
      <rect
        x={FACE_INSET - 0.5}
        y={FACE_INSET - 0.5}
        width={W - (FACE_INSET - 0.5) * 2}
        height={H - (FACE_INSET - 0.5) * 2}
        rx={FACE_RX + 0.4}
        fill="none"
        stroke="#26303A"
        strokeWidth="1.1"
        opacity="0.95"
      />

      {/* 8 Recessed colored face */}
      <rect
        x={FACE_INSET}
        y={FACE_INSET}
        width={W - FACE_INSET * 2}
        height={H - FACE_INSET * 2}
        rx={FACE_RX}
        fill={`url(#${faceGrad})`}
      />
      {/* Edge darkening / inset depth */}
      <rect
        x={FACE_INSET}
        y={FACE_INSET}
        width={W - FACE_INSET * 2}
        height={H - FACE_INSET * 2}
        rx={FACE_RX}
        fill="none"
        stroke="#000000"
        strokeWidth="1.6"
        opacity="0.28"
      />
      <rect
        x={FACE_INSET + 0.8}
        y={FACE_INSET + 0.8}
        width={W - (FACE_INSET + 0.8) * 2}
        height={H - (FACE_INSET + 0.8) * 2}
        rx={FACE_RX - 0.6}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="0.6"
        opacity="0.08"
      />

      {/* 9 Inner face highlight (floor catch) */}
      <path
        d={`M ${FACE_INSET + FACE_RX} ${H - FACE_INSET - 1.2} H ${W - FACE_INSET - FACE_RX}`}
        stroke="#FFFFFF"
        strokeWidth="0.8"
        opacity="0.12"
        fill="none"
      />

      {/* 10 Shaped glass reflection — curved/diagonal upper region */}
      <path
        d={`
          M ${FACE_INSET + 1.5} ${FACE_INSET + 1.2}
          H ${W - FACE_INSET - 1.5}
          Q ${W - FACE_INSET - 1.5} ${FACE_INSET + H * 0.22} ${W * 0.62} ${FACE_INSET + H * 0.34}
          Q ${W * 0.38} ${FACE_INSET + H * 0.42} ${FACE_INSET + 1.5} ${FACE_INSET + H * 0.28}
          Z
        `}
        fill={`url(#${glass})`}
      />
      <ellipse
        cx={W * 0.32}
        cy={FACE_INSET + 7}
        rx={W * 0.22}
        ry="9"
        fill="#FFFFFF"
        opacity="0.1"
      />
    </svg>
  );
}

export const REFERENCE_FAITHFUL_FACE_TEXT: Record<ReferenceFaithfulFace, string> = {
  navy: FACE_STOPS.navy.text,
  'soft-slate': FACE_STOPS['soft-slate'].text,
  white: FACE_STOPS.white.text,
  graphite: FACE_STOPS.graphite.text,
  red: FACE_STOPS.red.text,
};

/** Documented proportion tokens for tests / review. */
export const REFERENCE_FAITHFUL_PROPORTIONS = {
  viewBoxWidth: 320,
  viewBoxHeight: 60,
  chassisThicknessRatio: 10.2 / 60,
  outerRadiusRatio: 11 / 60,
  faceInsetRatio: (10.2 + 1.6) / 60,
  standardHeightPx: 58,
  largeHeightPx: 68,
  compactExperimentalHeightPx: 48,
} as const;
