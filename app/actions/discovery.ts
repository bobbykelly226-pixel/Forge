'use server';

import {
  getDiscoveryProfile,
  getDiscoveryVisibilityState,
  listDiscoveryFeedProfiles,
  loadActionStateForProfiles,
  setDiscoveryVisibility,
} from '@/lib/data/discovery';
import {
  canInjectSampleConnections,
  canInjectSampleDiscovery,
  isDemoConnectionProfileId,
  isDemoDiscoveryProfileId,
  isDemoProfileId,
} from '@/lib/demo/demo-access';
import {
  getSampleConnectionById,
  toSamplePublicDiscoveryProfile,
} from '@/lib/demo/sample-connections';
import {
  getSampleDiscoveryProfileById,
  toSampleDiscoveryPublicProfile,
} from '@/lib/demo/sample-discovery-profiles';
import { toDiscoveryFeedCard } from '@/lib/discovery/presentation';
import { createEmptyActionState } from '@/lib/discovery-actions-types';

export async function fetchDiscoveryFeedAction() {
  const result = await listDiscoveryFeedProfiles();
  if (!result.success) {
    return { success: false as const, message: result.message, profiles: [], actionState: {} };
  }

  // Keep this action free of sample injection so Supabase results stay untouched.
  // Preview injection happens in app/discovery/page.tsx.
  const cards = result.data.map(toDiscoveryFeedCard);
  const realIds = cards.map((c) => c.id).filter((id) => !isDemoProfileId(id));
  const actionState = await loadActionStateForProfiles(realIds);

  return {
    success: true as const,
    profiles: cards,
    actionState: actionState.success ? actionState.data : {},
  };
}

export async function fetchDiscoveryProfileAction(profileId: string) {
  // Preview-only Discovery fixtures — never query Supabase for demo-discovery-* ids.
  if (isDemoDiscoveryProfileId(profileId)) {
    if (!canInjectSampleDiscovery()) {
      return {
        success: true as const,
        unavailable: true as const,
        profile: null,
        actionState: null,
      };
    }
    const sample = getSampleDiscoveryProfileById(profileId);
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
      profile: toSampleDiscoveryPublicProfile(sample),
      actionState: createEmptyActionState(),
    };
  }

  // Preview-only Connections mutual fixtures opened via View Profile.
  if (isDemoConnectionProfileId(profileId)) {
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
