'use server';

import {
  getDiscoveryProfile,
  getDiscoveryVisibilityState,
  listDiscoveryFeedProfiles,
  loadActionStateForProfiles,
  setDiscoveryVisibility,
} from '@/lib/data/discovery';
import { canInjectSampleConnections, isDemoProfileId } from '@/lib/demo/demo-access';
import {
  getSampleConnectionById,
  toSamplePublicDiscoveryProfile,
} from '@/lib/demo/sample-connections';
import { toDiscoveryFeedCard } from '@/lib/discovery/presentation';
import { createEmptyActionState } from '@/lib/discovery-actions-types';

export async function fetchDiscoveryFeedAction() {
  const result = await listDiscoveryFeedProfiles();
  if (!result.success) {
    return { success: false as const, message: result.message, profiles: [], actionState: {} };
  }

  const cards = result.data.map(toDiscoveryFeedCard);
  const actionState = await loadActionStateForProfiles(cards.map((c) => c.id));

  return {
    success: true as const,
    profiles: cards,
    actionState: actionState.success ? actionState.data : {},
  };
}

export async function fetchDiscoveryProfileAction(profileId: string) {
  // Preview-only sample profiles resolve from local fixtures — never query Supabase.
  if (isDemoProfileId(profileId)) {
    if (!canInjectSampleConnections()) {
      return {
        success: true as const,
        unavailable: true as const,
        profile: null,
        actionState: null,
      };
    }
    const sample = getSampleConnectionById(profileId);
    if (!sample) {
      return {
        success: true as const,
        unavailable: true as const,
        profile: null,
        actionState: null,
      };
    }
    return {
      success: true as const,
      unavailable: false as const,
      profile: toSamplePublicDiscoveryProfile(sample),
      actionState: createEmptyActionState(),
    };
  }

  const result = await getDiscoveryProfile(profileId);
  if (!result.success) {
    return { success: false as const, message: result.message, profile: null, actionState: null };
  }
  if (!result.data) {
    return {
      success: true as const,
      unavailable: true as const,
      profile: null,
      actionState: null,
    };
  }

  const actionState = await loadActionStateForProfiles([profileId]);
  return {
    success: true as const,
    unavailable: false as const,
    profile: result.data,
    actionState: actionState.success ? actionState.data[profileId] ?? null : null,
  };
}

export async function fetchDiscoveryVisibilityAction() {
  return getDiscoveryVisibilityState();
}

export async function setDiscoveryVisibilityAction(enabled: boolean) {
  return setDiscoveryVisibility(enabled);
}
