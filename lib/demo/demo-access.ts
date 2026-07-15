/**
 * Access control for private internal demo experiences.
 * Demo routes must never be reachable in production without an explicit flag.
 */

export type DemoAccessEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  ENABLE_INTERNAL_DEMOS?: string;
};

/**
 * Recommended access rule:
 * - local development: allowed
 * - Vercel preview: allowed
 * - production: only when ENABLE_INTERNAL_DEMOS=true
 */
export function isInternalDemoAccessAllowed(
  env: DemoAccessEnv = process.env
): boolean {
  if (env.ENABLE_INTERNAL_DEMOS === 'true') {
    return true;
  }

  if (env.VERCEL_ENV === 'preview') {
    return true;
  }

  if (env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/** Quiet empty-state shortcut on real Connections — never in production. */
export function shouldShowConnectionsDemoShortcut(
  env: DemoAccessEnv = process.env
): boolean {
  return isInternalDemoAccessAllowed(env);
}

export function describeDemoAccessDecision(env: DemoAccessEnv = process.env): {
  allowed: boolean;
  reason: string;
} {
  if (env.ENABLE_INTERNAL_DEMOS === 'true') {
    return { allowed: true, reason: 'ENABLE_INTERNAL_DEMOS' };
  }
  if (env.VERCEL_ENV === 'preview') {
    return { allowed: true, reason: 'VERCEL_ENV_preview' };
  }
  if (env.NODE_ENV === 'development') {
    return { allowed: true, reason: 'NODE_ENV_development' };
  }
  return { allowed: false, reason: 'production_blocked' };
}
