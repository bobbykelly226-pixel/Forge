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
 * Visual-correction pass against the smooth chrome rounded-rectangle reference:
 * - controlled concentric corner family (not capsule, not chamfer)
 * - balanced chrome perimeter (no heavy bottom rail)
 * - substantial metal with dominant recessed face
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

  // viewBox height = 60
  // Chassis ≈ 14% of height — substantial but leaves dominant face
  const T = 8.4;
  const CHANNEL = 1.35;
  const FACE_INSET = T + CHANNEL;
  // Controlled corner family — long flats, modest radius (~12.5% of height)
  const OUTER_RX = 7.5;
  const BEVEL_RX = 5.4;
  const FACE_RX = 4.2;
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
        {/* Balanced polished silver — bright TL, restrained BR (not heavy bottom rail) */}
        <linearGradient id={metal} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="10%" stopColor="#F6F8FA" />
          <stop offset="22%" stopColor="#E8EDF2" />
          <stop offset="38%" stopColor="#C7CED6" />
          <stop offset="52%" stopColor="#AEB7C1" />
          <stop offset="68%" stopColor="#D5DBE3" />
          <stop offset="82%" stopColor="#929CA7" />
          <stop offset="100%" stopColor="#68727D" />
        </linearGradient>

        <linearGradient id={metalVert} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="42%" stopColor="#C7CED6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#4C5661" stopOpacity="0.28" />
        </linearGradient>

        <linearGradient id={steel} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#303943" stopOpacity="0.32" />
          <stop offset="50%" stopColor="#68727D" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={specular} cx="10%" cy="8%" r="38%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#F6F8FA" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={bevel} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#E8EDF2" />
          <stop offset="100%" stopColor="#8A949F" />
        </linearGradient>

        <linearGradient id={faceGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stops.top} />
          <stop offset="38%" stopColor={stops.mid} />
          <stop offset="72%" stopColor={stops.mid} />
          <stop offset="100%" stopColor={stops.bottom} />
        </linearGradient>

        {/* Broad soft upper-face glass — integrated, not an isolated oval */}
        <linearGradient id={glass} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.26" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="78%" stopColor="#FFFFFF" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

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

        <mask id={channelMask} maskUnits="userSpaceOnUse">
          <rect
            x={T - 0.3}
            y={T - 0.3}
            width={W - (T - 0.3) * 2}
            height={H - (T - 0.3) * 2}
            rx={BEVEL_RX + 0.2}
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

      {/* Subtle depth plate — aligned to chassis, not a protruding base rail */}
      <rect
        x="0.4"
        y="0.6"
        width={W - 0.8}
        height={H - 0.8}
        rx={OUTER_RX}
        fill="#303943"
        opacity="0.22"
      />

      {/* Main polished silver chassis */}
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
        opacity="0.45"
      />
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${steel})`}
        mask={`url(#${frameMask})`}
        opacity="0.45"
      />

      {/* Bright upper/left specular lip */}
      <rect
        width={W}
        height={H}
        rx={OUTER_RX}
        fill={`url(#${specular})`}
        mask={`url(#${frameMask})`}
      />
      <path
        d={`M ${OUTER_RX} 1.05 H ${W - OUTER_RX}`}
        stroke="#FFFFFF"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.88"
        fill="none"
      />
      <path
        d={`M 1.05 ${OUTER_RX} V ${H - OUTER_RX - 2}`}
        stroke="#FFFFFF"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.65"
        fill="none"
      />
      {/* Bottom-center metal glint on the chassis rim only — NOT a detached rail */}
      <path
        d={`M ${W * 0.38} ${H - T * 0.35} H ${W * 0.62}`}
        stroke="#E8EDF2"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.35"
        fill="none"
      />

      {/* Inner polished silver bevel rim */}
      <rect
        x={T - 0.6}
        y={T - 0.6}
        width={W - (T - 0.6) * 2}
        height={H - (T - 0.6) * 2}
        rx={BEVEL_RX}
        fill="none"
        stroke={`url(#${bevel})`}
        strokeWidth="1.8"
        opacity="0.92"
      />
      <rect
        x={T}
        y={T}
        width={W - T * 2}
        height={H - T * 2}
        rx={BEVEL_RX}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="0.75"
        opacity="0.45"
      />

      {/* Graphite inset channel */}
      <rect
        width={W}
        height={H}
        fill="#1D252E"
        mask={`url(#${channelMask})`}
        opacity="0.9"
      />
      <rect
        x={FACE_INSET - 0.4}
        y={FACE_INSET - 0.4}
        width={W - (FACE_INSET - 0.4) * 2}
        height={H - (FACE_INSET - 0.4) * 2}
        rx={FACE_RX + 0.3}
        fill="none"
        stroke="#26303A"
        strokeWidth="1"
        opacity="0.95"
      />

      {/* Recessed colored face */}
      <rect
        x={FACE_INSET}
        y={FACE_INSET}
        width={W - FACE_INSET * 2}
        height={H - FACE_INSET * 2}
        rx={FACE_RX}
        fill={`url(#${faceGrad})`}
      />
      <rect
        x={FACE_INSET}
        y={FACE_INSET}
        width={W - FACE_INSET * 2}
        height={H - FACE_INSET * 2}
        rx={FACE_RX}
        fill="none"
        stroke="#000000"
        strokeWidth="1.3"
        opacity="0.22"
      />

      {/* Broad soft glass reflection following upper face contour */}
      <path
        d={`
          M ${FACE_INSET + FACE_RX * 0.35} ${FACE_INSET + 0.8}
          H ${W - FACE_INSET - FACE_RX * 0.35}
          Q ${W - FACE_INSET - 0.5} ${FACE_INSET + H * 0.18}
            ${W - FACE_INSET - 1} ${FACE_INSET + H * 0.36}
          Q ${W * 0.5} ${FACE_INSET + H * 0.46}
            ${FACE_INSET + 1} ${FACE_INSET + H * 0.36}
          Q ${FACE_INSET + 0.5} ${FACE_INSET + H * 0.18}
            ${FACE_INSET + FACE_RX * 0.35} ${FACE_INSET + 0.8}
          Z
        `}
        fill={`url(#${glass})`}
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
  chassisThicknessRatio: 8.4 / 60,
  outerRadiusRatio: 7.5 / 60,
  faceInsetRatio: (8.4 + 1.35) / 60,
  standardHeightPx: 58,
  largeHeightPx: 68,
  compactExperimentalHeightPx: 48,
} as const;
