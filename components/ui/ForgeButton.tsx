'use client';

import Link from 'next/link';
import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

export type ForgeButtonTier = 1 | 2 | 3;

export type ForgeButtonFace = 'navy' | 'soft-slate' | 'white' | 'graphite' | 'red';

/** Surrounding canvas — drives Tier 2 fill so controls stay distinct from their surface. */
export type ForgeButtonSurface = 'soft-slate' | 'white' | 'navy';

type CommonProps = {
  tier?: ForgeButtonTier;
  children: ReactNode;
  className?: string;
  /** Full-width block button — radius stays 4px */
  block?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Tier 1 face treatment.
   * - navy: Soft Slate / white surfaces (default)
   * - soft-slate: deep navy surfaces (official dark-surface Tier 1)
   * - white / graphite / red: material studies only
   */
  face?: ForgeButtonFace;
  /**
   * Surrounding surface for Tier 2/3 treatments.
   * soft-slate → white/pale Tier 2
   * white → Soft Slate Tier 2
   * navy → translucent Tier 2 + Soft Slate Tier 1 when onDark-equivalent
   */
  surface?: ForgeButtonSurface;
  /**
   * Dark-surface hierarchy helpers (alias for surface="navy").
   * Tier 1 → Soft Slate face; Tier 2/3 → light-on-dark treatments.
   */
  onDark?: boolean;
  disabled?: boolean;
  /** Preserve geometry; announce with aria-busy */
  loading?: boolean;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children' | 'disabled'> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, 'className' | 'children'> & {
    href: string;
  };

export type ForgeButtonProps = ButtonAsButton | ButtonAsLink;

function resolveSurface(surface?: ForgeButtonSurface, onDark?: boolean): ForgeButtonSurface {
  if (onDark) return 'navy';
  return surface ?? 'soft-slate';
}

function buildClassName(props: {
  tier: ForgeButtonTier;
  block?: boolean;
  size?: 'sm' | 'md' | 'lg';
  face?: ForgeButtonFace;
  surface: ForgeButtonSurface;
  className?: string;
}): string {
  const classes = ['forge-btn', `forge-btn--tier${props.tier}`];

  if (props.tier === 1) {
    if (props.surface === 'navy' || props.face === 'soft-slate') {
      classes.push('forge-btn--tier1-on-dark', 'forge-btn--tier1-face-soft-slate');
    } else if (props.face && props.face !== 'navy') {
      classes.push(`forge-btn--tier1-face-${props.face}`);
    }
  }

  if (props.tier === 2) {
    if (props.surface === 'navy') classes.push('forge-btn--tier2-on-dark');
    else if (props.surface === 'white') classes.push('forge-btn--tier2-on-white');
    else classes.push('forge-btn--tier2-on-soft-slate');
  }

  if (props.tier === 3 && props.surface === 'navy') {
    classes.push('forge-btn--tier3-on-dark');
  }

  if (props.block) classes.push('forge-btn--block');
  if (props.size === 'sm') classes.push('forge-btn--sm');
  if (props.size === 'lg') classes.push('forge-btn--lg');
  if (props.className) classes.push(props.className);

  return classes.join(' ');
}

/**
 * Decorative metallic chassis — SVG gradients for bright/mid/dark steel transitions.
 * Non-interactive; clipped by the CSS micro-radius shell.
 */
function MetallicChassis() {
  const uid = useId().replace(/:/g, '');
  const metal = `forge-metal-${uid}`;
  const specular = `forge-spec-${uid}`;
  const steel = `forge-steel-${uid}`;

  return (
    <span className="forge-btn__chassis" aria-hidden="true">
      <svg
        className="forge-btn__chassis-svg"
        viewBox="0 0 100 48"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id={metal} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="10%" stopColor="#F6F8FA" />
            <stop offset="22%" stopColor="#E8EDF2" />
            <stop offset="34%" stopColor="#C7CED6" />
            <stop offset="46%" stopColor="#68727D" />
            <stop offset="58%" stopColor="#AEB7C1" />
            <stop offset="70%" stopColor="#E8EDF2" />
            <stop offset="82%" stopColor="#929CA7" />
            <stop offset="100%" stopColor="#4C5661" />
          </linearGradient>
          <linearGradient id={steel} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#303943" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#68727D" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.35" />
          </linearGradient>
          <radialGradient id={specular} cx="12%" cy="8%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#F6F8FA" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="48" fill={`url(#${metal})`} />
        <rect width="100" height="48" fill={`url(#${steel})`} />
        <rect width="100" height="48" fill={`url(#${specular})`} />
        {/* Bottom-edge polish catch */}
        <rect x="18" y="42" width="64" height="5" fill="#E8EDF2" opacity="0.45" />
      </svg>
    </span>
  );
}

function ButtonContents({
  children,
  loading,
  tier,
}: {
  children: ReactNode;
  loading?: boolean;
  tier: ForgeButtonTier;
}) {
  return (
    <>
      {tier === 1 ? <MetallicChassis /> : null}
      {tier === 1 ? <span className="forge-btn__bevel" aria-hidden="true" /> : null}
      <span className="forge-btn__face">
        {tier === 1 ? <span className="forge-btn__glass" aria-hidden="true" /> : null}
        <span className="forge-btn__label">
          {loading ? (
            <>
              <span className="forge-btn__spinner" aria-hidden="true" />
              <span>{children}</span>
            </>
          ) : (
            children
          )}
        </span>
      </span>
    </>
  );
}

/**
 * Forge button system — micro-radius rectangle (outer 4px).
 * Tier 1: substantial polished metallic chassis + bevel + graphite + recessed face + glass
 * Tier 2: quiet architectural outline (surface-aware fills)
 * Tier 3: typography-only tertiary
 *
 * Review-only until manually approved for product rollout.
 */
export default function ForgeButton(props: ForgeButtonProps) {
  const {
    tier = 1,
    children,
    className,
    block,
    size = 'md',
    face = 'navy',
    surface,
    onDark,
    disabled,
    loading,
    ...rest
  } = props;

  const resolvedSurface = resolveSurface(surface, onDark);
  const classes = buildClassName({
    tier,
    block,
    size,
    face,
    surface: resolvedSurface,
    className,
  });
  const blockInteraction = Boolean(disabled || loading);

  if ('href' in props && props.href) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    if (blockInteraction) {
      return (
        <span
          className={classes}
          aria-disabled="true"
          role="link"
          aria-busy={loading || undefined}
          data-loading={loading ? 'true' : undefined}
        >
          <ButtonContents tier={tier} loading={loading}>
            {children}
          </ButtonContents>
        </span>
      );
    }
    return (
      <Link
        href={href}
        className={classes}
        aria-busy={loading || undefined}
        data-loading={loading ? 'true' : undefined}
        {...linkRest}
      >
        <ButtonContents tier={tier} loading={loading}>
          {children}
        </ButtonContents>
      </Link>
    );
  }

  const buttonRest = rest as ButtonAsButton;
  return (
    <button
      type={buttonRest.type ?? 'button'}
      className={classes}
      disabled={Boolean(disabled) || Boolean(loading)}
      aria-busy={loading || undefined}
      data-loading={loading ? 'true' : undefined}
      {...buttonRest}
    >
      <ButtonContents tier={tier} loading={loading}>
        {children}
      </ButtonContents>
    </button>
  );
}
