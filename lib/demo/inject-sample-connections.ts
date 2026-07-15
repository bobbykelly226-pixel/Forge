/**
 * Preview-only adapter: append controlled sample mutual connections
 * into the real ConnectionsHubData shape consumed by ConnectionsHubProvider.
 *
 * Never writes to Supabase. Real connections remain separate.
 */

import type { ConnectionsHubData, MutualConnectionItem } from '@/lib/data/connections-hub';
import { canInjectSampleConnections, isDemoProfileId } from '@/lib/demo/demo-access';
import {
  getSampleConnections,
  toSampleMutualConnectionItem,
} from '@/lib/demo/sample-connections';

export const SAMPLE_CONNECTIONS_BANNER =
  'Sample connections are shown for product preview. No live member data is affected.';

export function countRealMutualConnections(mutual: MutualConnectionItem[]): number {
  return mutual.filter((item) => !isDemoProfileId(item.id)).length;
}

export function hubContainsSampleConnections(data: ConnectionsHubData): boolean {
  return data.mutual.some((item) => isDemoProfileId(item.id));
}

/**
 * Build mutual items from fixtures. Pure — no I/O.
 */
export function buildSampleMutualConnections(): MutualConnectionItem[] {
  return getSampleConnections().map(toSampleMutualConnectionItem);
}

/**
 * Merge sample mutuals into hub data. Preserves all real rows.
 * Sample rows are placed first for easy demonstration.
 */
export function injectSampleConnections(
  data: ConnectionsHubData
): ConnectionsHubData {
  const samples = buildSampleMutualConnections();
  const realMutual = data.mutual.filter((item) => !isDemoProfileId(item.id));
  const mutual = [...samples, ...realMutual];

  return {
    ...data,
    mutual,
    tabCounts: {
      ...data.tabCounts,
      mutual: mutual.length,
    },
  };
}

/**
 * Decide whether to inject samples for this request.
 * - Preview/local/flag required
 * - Auto when zero real mutual connections
 * - Or when forceDemoQuery is true (?demo=1)
 */
export function shouldInjectSampleConnectionsForRequest(options: {
  realMutualCount: number;
  forceDemoQuery?: boolean;
  env?: NodeJS.ProcessEnv;
}): boolean {
  if (!canInjectSampleConnections(options.env)) {
    return false;
  }
  if (options.forceDemoQuery) {
    return true;
  }
  return options.realMutualCount === 0;
}

export function stripSampleConnections(data: ConnectionsHubData): ConnectionsHubData {
  const mutual = data.mutual.filter((item) => !isDemoProfileId(item.id));
  return {
    ...data,
    mutual,
    tabCounts: {
      ...data.tabCounts,
      mutual: mutual.length,
    },
  };
}
