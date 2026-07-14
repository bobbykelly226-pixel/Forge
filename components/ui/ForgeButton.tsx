import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type ForgeButtonTier = 1 | 2 | 3;

export type ForgeButtonFace = 'navy' | 'soft-slate' | 'white' | 'graphite' | 'red';

type CommonProps = {
  tier?: ForgeButtonTier;
  children: ReactNode;
  className?: string;
  /** Full-width block button — radius stays 4px / 3px */
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
   * Dark-surface hierarchy helpers.
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

function buildClassName(props: {
  tier: ForgeButtonTier;
  block?: boolean;
  size?: 'sm' | 'md' | 'lg';
  face?: ForgeButtonFace;
  onDark?: boolean;
  className?: string;
}): string {
  const classes = ['forge-btn', `forge-btn--tier${props.tier}`];

  if (props.tier === 1) {
    if (props.onDark || props.face === 'soft-slate') {
      classes.push('forge-btn--tier1-on-dark', 'forge-btn--tier1-face-soft-slate');
    } else if (props.face && props.face !== 'navy') {
      classes.push(`forge-btn--tier1-face-${props.face}`);
    }
  }
  if (props.tier === 2 && props.onDark) {
    classes.push('forge-btn--tier2-on-dark');
  }
  if (props.tier === 3 && props.onDark) {
    classes.push('forge-btn--tier3-on-dark');
  }
  if (props.block) classes.push('forge-btn--block');
  if (props.size === 'sm') classes.push('forge-btn--sm');
  if (props.size === 'lg') classes.push('forge-btn--lg');
  if (props.className) classes.push(props.className);

  return classes.join(' ');
}

function ButtonContents({
  children,
  loading,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
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

/**
 * Forge button system — micro-radius rectangle (exactly 4px outer / 3px inner).
 * Tier 1: polished silver metallic frame + recessed face
 * Tier 2: quiet outline secondary (same silhouette family)
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
    onDark,
    disabled,
    loading,
    ...rest
  } = props;

  const classes = buildClassName({ tier, block, size, face, onDark, className });
  /* Loading keeps metallic construction; still blocks activation. */
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
          <ButtonContents loading={loading}>{children}</ButtonContents>
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
        <ButtonContents loading={loading}>{children}</ButtonContents>
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
      <ButtonContents loading={loading}>{children}</ButtonContents>
    </button>
  );
}
