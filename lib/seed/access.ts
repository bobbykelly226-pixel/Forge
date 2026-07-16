/**
 * Access control for Forge Beta Seed Data.
 * Runtime-only injection for development and preview. Never in production.
 */

export type SeedAccessEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  ENABLE_INTERNAL_DEMOS?: string;
  ENABLE_BETA_SEED?: string;
};

/**
 * Allowed when:
 * - local development
 * - Vercel preview
 * - ENABLE_BETA_SEED=true or ENABLE_INTERNAL_DEMOS=true (legacy)
 *
 * Production (VERCEL_ENV=production / ordinary production) never allows seed data.
 */
export function isBetaSeedAccessAllowed(env: SeedAccessEnv = process.env): boolean {
  if (env.ENABLE_BETA_SEED === 'true' || env.ENABLE_INTERNAL_DEMOS === 'true') {
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

/** @deprecated Use isBetaSeedAccessAllowed */
export function isInternalDemoAccessAllowed(env: SeedAccessEnv = process.env): boolean {
  return isBetaSeedAccessAllowed(env);
}

export function canInjectSeedData(env: SeedAccessEnv = process.env): boolean {
  return isBetaSeedAccessAllowed(env);
}

export function canInjectSampleConnections(env: SeedAccessEnv = process.env): boolean {
  return canInjectSeedData(env);
}

export function canInjectSampleDiscovery(env: SeedAccessEnv = process.env): boolean {
  return canInjectSeedData(env);
}

export function describeSeedAccessDecision(env: SeedAccessEnv = process.env): {
  allowed: boolean;
  reason: string;
} {
  if (env.ENABLE_BETA_SEED === 'true' || env.ENABLE_INTERNAL_DEMOS === 'true') {
    return { allowed: true, reason: 'ENABLE_BETA_SEED' };
  }
  if (env.VERCEL_ENV === 'preview') {
    return { allowed: true, reason: 'VERCEL_ENV_preview' };
  }
  if (env.NODE_ENV === 'development') {
    return { allowed: true, reason: 'NODE_ENV_development' };
  }
  return { allowed: false, reason: 'production_blocked' };
}

/** @deprecated Use describeSeedAccessDecision */
export function describeDemoAccessDecision(env: SeedAccessEnv = process.env) {
  return describeSeedAccessDecision(env);
}

/** Any beta seed profile id (Discovery or Connections). */
export function isSeedProfileId(profileId: string): boolean {
  return profileId.startsWith('seed-') || profileId.startsWith('demo-');
}

/** @deprecated Use isSeedProfileId */
export function isDemoProfileId(profileId: string): boolean {
  return isSeedProfileId(profileId);
}

/**
 * Discovery feed/profile seed fixtures.
 * Legacy demo-discovery-* ids remain recognized for safety during migration.
 */
export function isSeedDiscoveryProfileId(profileId: string): boolean {
  return (
    profileId.startsWith('seed-') ||
    profileId.startsWith('demo-discovery-')
  );
}

/** @deprecated Use isSeedDiscoveryProfileId */
export function isDemoDiscoveryProfileId(profileId: string): boolean {
  return isSeedDiscoveryProfileId(profileId);
}

/**
 * Connections mutual seed fixtures.
 * Prefer catalog membership for seed-* ids; legacy demo-* (non discovery) remain recognized.
 */
export function isSeedConnectionProfileId(
  profileId: string,
  mutualIds?: ReadonlySet<string> | readonly string[]
): boolean {
  if (profileId.startsWith('demo-discovery-')) return false;
  if (profileId.startsWith('demo-') && !profileId.startsWith('demo-discovery-')) {
    return true;
  }
  if (!profileId.startsWith('seed-')) return false;
  if (!mutualIds) return false;
  if (mutualIds instanceof Set) return mutualIds.has(profileId);
  return (mutualIds as readonly string[]).includes(profileId);
}

/** @deprecated Use isSeedConnectionProfileId with catalog mutual ids */
export function isDemoConnectionProfileId(profileId: string): boolean {
  return isSeedConnectionProfileId(profileId);
}

export type SeedQueryFlags = {
  /** Force inject even when real data exists (?seed=1) */
  forceSeed: boolean;
  /** Force disable seed injection (?seed=0) */
  disableSeed: boolean;
  /** Show developer reset control (?seed=1) */
  showReset: boolean;
};

export function parseSeedQueryParam(seed?: string | string[] | null): SeedQueryFlags {
  const value = Array.isArray(seed) ? seed[0] : seed;
  return {
    forceSeed: value === '1',
    disableSeed: value === '0',
    showReset: value === '1',
  };
}
