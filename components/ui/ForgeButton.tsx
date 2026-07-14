import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type ForgeButtonTier = 1 | 2 | 3;

type CommonProps = {
  tier?: ForgeButtonTier;
  children: ReactNode;
  className?: string;
  /** Full-width block button */
  block?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Review-only face samples for Tier 1 material studies.
   * Do not use red as a product primary action.
   */
  face?: 'navy' | 'white' | 'graphite' | 'red';
  /** Use light-on-dark secondary/tertiary treatments */
  onDark?: boolean;
  disabled?: boolean;
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
  face?: CommonProps['face'];
  onDark?: boolean;
  className?: string;
}): string {
  const classes = ['forge-btn', `forge-btn--tier${props.tier}`];

  if (props.tier === 1 && props.face && props.face !== 'navy') {
    classes.push(`forge-btn--tier1-face-${props.face}`);
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

/**
 * Forge button system — softened rectangular silhouette (not pills).
 * Tier 1: restrained navy metallic primary
 * Tier 2: quiet outline secondary
 * Tier 3: typography-only tertiary
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
    ...rest
  } = props;

  const classes = buildClassName({ tier, block, size, face, onDark, className });

  if ('href' in props && props.href) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    if (disabled) {
      return (
        <span className={classes} aria-disabled="true" role="link">
          <span>{children}</span>
        </span>
      );
    }
    return (
      <Link href={href} className={classes} {...linkRest}>
        <span>{children}</span>
      </Link>
    );
  }

  const buttonRest = rest as ButtonAsButton;
  return (
    <button type={buttonRest.type ?? 'button'} className={classes} disabled={disabled} {...buttonRest}>
      <span>{children}</span>
    </button>
  );
}
