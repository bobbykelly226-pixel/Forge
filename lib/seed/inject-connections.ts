/**
 * Runtime injection of beta seed Connections mutuals into the live hub.
 * Never writes to Supabase. Production is blocked by access gating.
 */

import {
  canInjectSeedData,
  isSeedProfileId,
  type SeedAccessEnv,
} from '@/lib/seed/access';
import { toSeedMutualConnectionItem } from '@/lib/seed/adapters';
import { getSeedMutualConnectionProfiles } from '@/lib/seed/catalog';
import type { ConnectionsHubData } from '@/lib/data/connections-hub';

export function countRealMutualConnections(data: ConnectionsHubData): number {
  return data.mutual.filter((item) => !isSeedProfileId(item.id)).length;
}

export function injectSeedConnections(data: ConnectionsHubData): ConnectionsHubData {
  const seeds = getSeedMutualConnectionProfiles().map(toSeedMutualConnectionItem);
  const realMutual = data.mutual.filter((item) => !isSeedProfileId(item.id));
  const realIds = new Set(realMutual.map((item) => item.id));
  const mutual = [
    ...seeds.filter((seed) => !realIds.has(seed.id)),
    ...realMutual,
  ];

  return {
    ...data,
    mutual,
    tabCounts: {
      ...data.tabCounts,
      mutual: mutual.length,
    },
  };
}

/** @deprecated */
export function injectSampleConnections(data: ConnectionsHubData): ConnectionsHubData {
  return injectSeedConnections(data);
}

export function shouldInjectSeedConnectionsForRequest(options: {
  realMutualCount: number;
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
  return options.realMutualCount === 0;
}

/** @deprecated */
export function shouldInjectSampleConnectionsForRequest(options: {
  realMutualCount: number;
  forceDemoQuery?: boolean;
  forceSeed?: boolean;
  disableSeed?: boolean;
  env?: SeedAccessEnv;
}): boolean {
  return shouldInjectSeedConnectionsForRequest({
    realMutualCount: options.realMutualCount,
    forceSeed: options.forceSeed ?? options.forceDemoQuery,
    disableSeed: options.disableSeed,
    env: options.env,
  });
}
