/**
 * Runtime injection of beta seed Discovery profiles into the live feed.
 * Never writes to Supabase. Production is blocked by access gating.
 */

import {
  canInjectSeedData,
  isSeedProfileId,
  type SeedAccessEnv,
} from '@/lib/seed/access';
import { toSeedDiscoveryFeedCard } from '@/lib/seed/adapters';
import { getSeedDiscoveryProfiles } from '@/lib/seed/catalog';
import type { DiscoveryFeedCardModel } from '@/lib/discovery/presentation';
import {
  createEmptyActionState,
  type DiscoveryProfileActionState,
} from '@/lib/discovery-actions-types';

export function countRealDiscoveryCandidates(
  profiles: DiscoveryFeedCardModel[]
): number {
  return profiles.filter((profile) => !isSeedProfileId(profile.id)).length;
}

export function buildSeedDiscoveryFeedCards(): DiscoveryFeedCardModel[] {
  return getSeedDiscoveryProfiles().map(toSeedDiscoveryFeedCard);
}

export function buildSeedDiscoveryActionState(): Record<
  string,
  DiscoveryProfileActionState
> {
  return Object.fromEntries(
    getSeedDiscoveryProfiles().map((profile) => [
      profile.id,
      createEmptyActionState(),
    ])
  );
}

/** @deprecated */
export function buildSampleDiscoveryFeedCards(): DiscoveryFeedCardModel[] {
  return buildSeedDiscoveryFeedCards();
}

/** @deprecated */
export function buildSampleDiscoveryActionState(): Record<
  string,
  DiscoveryProfileActionState
> {
  return buildSeedDiscoveryActionState();
}

/**
 * Controlled seed-only Discovery dataset.
 * Replaces live candidates so beta preview never mixes newly created real profiles
 * into the seeded walkthrough. The `profiles` argument is ignored for the result
 * and kept for call-site compatibility.
 */
export function injectSeedDiscoveryProfiles(
  profiles: DiscoveryFeedCardModel[]
): DiscoveryFeedCardModel[] {
  void profiles;
  return buildSeedDiscoveryFeedCards();
}

/** @deprecated */
export function injectSampleDiscoveryProfiles(
  profiles: DiscoveryFeedCardModel[]
): DiscoveryFeedCardModel[] {
  return injectSeedDiscoveryProfiles(profiles);
}

export function shouldInjectSeedDiscoveryForRequest(options: {
  realCandidateCount: number;
  forceSeed?: boolean;
  disableSeed?: boolean;
  env?: SeedAccessEnv;
}): boolean {
  if (options.disableSeed) {
    return false;
  }
  if (!canInjectSeedData(options.env)) {
    return false;
  }
  if (options.forceSeed) {
    return true;
  }
  return options.realCandidateCount === 0;
}

/** @deprecated */
export function shouldInjectSampleDiscoveryForRequest(options: {
  realCandidateCount: number;
  forceDemoQuery?: boolean;
  forceSeed?: boolean;
  disableSeed?: boolean;
  env?: SeedAccessEnv;
}): boolean {
  return shouldInjectSeedDiscoveryForRequest({
    realCandidateCount: options.realCandidateCount,
    forceSeed: options.forceSeed ?? options.forceDemoQuery,
    disableSeed: options.disableSeed,
    env: options.env,
  });
}

export function stripSeedDiscoveryProfiles(
  profiles: DiscoveryFeedCardModel[]
): DiscoveryFeedCardModel[] {
  return profiles.filter((profile) => !isSeedProfileId(profile.id));
}

/** @deprecated */
export function stripSampleDiscoveryProfiles(
  profiles: DiscoveryFeedCardModel[]
): DiscoveryFeedCardModel[] {
  return stripSeedDiscoveryProfiles(profiles);
}
