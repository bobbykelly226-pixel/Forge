'use client';

import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import ForgeButtonReferenceChassis, {
  REFERENCE_FAITHFUL_FACE_TEXT,
  type ReferenceFaithfulFace,
} from '@/components/ui/ForgeButtonReferenceChassis';

export type ForgeButtonTier = 1 | 2 | 3;

export type ForgeButtonFace = ReferenceFaithfulFace;

/** Surrounding canvas — drives Tier 2 fill so controls stay distinct from their surface. */
export type ForgeButtonSurface = 'soft-slate' | 'white' | 'navy';

/**
 * Tier 1 construction variants for internal visual review.
 * - referenceFaithful: new independent SVG candidate (default for review)
 * - experimental: prior thin-chassis CSS experiment (kept for comparison)
 */
export type ForgeButtonVariant = 'referenceFaithful' | 'experimental';

export type ForgeButtonSize = 'compact' | 'md' | 'lg' | 'sm';

type CommonProps = {
  tier?: ForgeButtonTier;
  children: ReactNode;
  className?: string;
  block?: boolean;
  /**
   * md = standard signature (~58px)
   * lg = large/hero (~68px)
   * compact / sm = experimental below 52px
   */
  size?: ForgeButtonSize;
  face?: ForgeButtonFace;
  surface?: ForgeButtonSurface;
  onDark?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Independent Tier 1 construction. Default: referenceFaithful. */
  variant?: ForgeButtonVariant;
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

function resolveTier1Face(
  face: ForgeButtonFace | undefined,
  surface: ForgeButtonSurface
): ReferenceFaithfulFace {
  if (face) return face;
  if (surface === 'navy') return 'soft-slate';
  return 'navy';
}

function buildClassName(props: {
  tier: ForgeButtonTier;
  block?: boolean;
  size?: ForgeButtonSize;
  face?: ForgeButtonFace;
  surface: ForgeButtonSurface;
  variant: ForgeButtonVariant;
  className?: string;
}): string {
  const classes = ['forge-btn', `forge-btn--tier${props.tier}`];

  if (props.tier === 1) {
    classes.push(
      props.variant === 'referenceFaithful' ? 'forge-btn--rf' : 'forge-btn--experimental'
    );

    const face = resolveTier1Face(props.face, props.surface);
    if (face === 'soft-slate') {
      classes.push('forge-btn--tier1-on-dark', 'forge-btn--tier1-face-soft-slate');
    } else if (face !== 'navy') {
      classes.push(`forge-btn--tier1-face-${face}`);
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
  if (props.size === 'sm' || props.size === 'compact') classes.push('forge-btn--compact');
  if (props.size === 'lg') classes.push('forge-btn--lg');
  if (props.className) classes.push(props.className);

  return classes.join(' ');
}

function ExperimentalContents({
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
      {tier === 1 ? (
        <span className="forge-btn__chassis" aria-hidden="true">
          <span className="forge-btn__chassis-fallback" />
        </span>
      ) : null}
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

function ReferenceFaithfulContents({
  children,
  loading,
  tier,
  face,
}: {
  children: ReactNode;
  loading?: boolean;
  tier: ForgeButtonTier;
  face: ReferenceFaithfulFace;
}) {
  if (tier !== 1) {
    return (
      <span className="forge-btn__face">
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
    );
  }

  return (
    <>
      <span className="forge-btn-rf__art" aria-hidden="true">
        <ForgeButtonReferenceChassis face={face} />
      </span>
      <span className="forge-btn__face forge-btn-rf__face">
        <span
          className="forge-btn__label"
          style={{ color: REFERENCE_FAITHFUL_FACE_TEXT[face] }}
        >
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
 * Forge button system — internal visual review.
 * Tier 1 referenceFaithful: independent SVG chassis candidate.
 * Tier 1 experimental: prior CSS chassis (comparison only).
 * Tier 2/3: quiet supporting actions.
 */
export default function ForgeButton(props: ForgeButtonProps) {
  const {
    tier = 1,
    children,
    className,
    block,
    size = 'md',
    face,
    surface,
    onDark,
    disabled,
    loading,
    variant = 'referenceFaithful',
    ...rest
  } = props;

  const resolvedSurface = resolveSurface(surface, onDark);
  const resolvedFace = resolveTier1Face(face, resolvedSurface);
  const classes = buildClassName({
    tier,
    block,
    size,
    face: resolvedFace,
    surface: resolvedSurface,
    variant,
    className,
  });
  const blockInteraction = Boolean(disabled || loading);

  const contents =
    variant === 'experimental' ? (
      <ExperimentalContents tier={tier} loading={loading}>
        {children}
      </ExperimentalContents>
    ) : (
      <ReferenceFaithfulContents tier={tier} loading={loading} face={resolvedFace}>
        {children}
      </ReferenceFaithfulContents>
    );

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
          {contents}
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
        {contents}
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
      {contents}
    </button>
  );
}
