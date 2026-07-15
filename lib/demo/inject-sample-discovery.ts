/**
 * Preview-only adapter: merge sample Discovery profiles into the live feed
 * card list consumed by DiscoveryFeedPrototype.
 *
 * Never writes to Supabase. Real candidates remain separate.
 */

import { canInjectSampleDiscovery, isDemoDiscoveryProfileId } from '@/lib/demo/demo-access';
import {
  getSampleDiscoveryProfiles,
  toSampleDiscoveryFeedCard,
} from '@/lib/demo/sample-discovery-profiles';
import type { DiscoveryFeedCardModel } from '@/lib/discovery/presentation';
import {
  createEmptyActionState,
  type DiscoveryProfileActionState,
} from '@/lib/discovery-actions-types';

export const SAMPLE_DISCOVERY_BANNER =
  'Sample profiles are shown for product preview. Actions are simulated and reset on refresh.';

export function countRealDiscoveryCandidates(
  profiles: DiscoveryFeedCardModel[]
): number {
  return profiles.filter((profile) => !isDemoDiscoveryProfileId(profile.id)).length;
}

export function buildSampleDiscoveryFeedCards(): DiscoveryFeedCardModel[] {
  return getSampleDiscoveryProfiles().map(toSampleDiscoveryFeedCard);
}

export function buildSampleDiscoveryActionState(): Record<
  string,
  DiscoveryProfileActionState
> {
  return Object.fromEntries(
    getSampleDiscoveryProfiles().map((profile) => [
      profile.id,
      createEmptyActionState(),
    ])
  );
}

/**
 * Prepend sample cards; keep all real candidates. De-dupe by id.
 */
export function injectSampleDiscoveryProfiles(
  profiles: DiscoveryFeedCardModel[]
): DiscoveryFeedCardModel[] {
  const samples = buildSampleDiscoveryFeedCards();
  const real = profiles.filter((profile) => !isDemoDiscoveryProfileId(profile.id));
  const realIds = new Set(real.map((profile) => profile.id));
  return [...samples.filter((sample) => !realIds.has(sample.id)), ...real];
}

export function shouldInjectSampleDiscoveryForRequest(options: {
  realCandidateCount: number;
  forceDemoQuery?: boolean;
  env?: NodeJS.ProcessEnv;
}): boolean {
  if (!canInjectSampleDiscovery(options.env)) {
    return false;
  }
  if (options.forceDemoQuery) {
    return true;
  }
  return options.realCandidateCount === 0;
}

export function stripSampleDiscoveryProfiles(
  profiles: DiscoveryFeedCardModel[]
): DiscoveryFeedCardModel[] {
  return profiles.filter((profile) => !isDemoDiscoveryProfileId(profile.id));
}
