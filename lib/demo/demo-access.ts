/**
 * Access control for preview-only sample Connections injection.
 * Must never enable sample connections in ordinary production.
 */

export type DemoAccessEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  ENABLE_INTERNAL_DEMOS?: string;
};

/**
 * Allowed when:
 * - local development
 * - Vercel preview
 * - ENABLE_INTERNAL_DEMOS=true
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

/** Alias for Connections sample injection gating. */
export function canInjectSampleConnections(
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

export function isDemoProfileId(profileId: string): boolean {
  return profileId.startsWith('demo-');
}
