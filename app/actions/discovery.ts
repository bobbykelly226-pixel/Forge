'use server';

import {
  getDiscoveryProfile,
  getDiscoveryVisibilityState,
  listDiscoveryFeedProfiles,
  loadActionStateForProfiles,
  setDiscoveryVisibility,
} from '@/lib/data/discovery';
import {
  canInjectSeedData,
  isSeedProfileId,
} from '@/lib/seed/access';
import { toSeedPublicDiscoveryProfile } from '@/lib/seed/adapters';
import { getSeedProfileById } from '@/lib/seed/catalog';
import { toDiscoveryFeedCard } from '@/lib/discovery/presentation';
import { createEmptyActionState } from '@/lib/discovery-actions-types';

export async function fetchDiscoveryFeedAction() {
  const result = await listDiscoveryFeedProfiles();
  if (!result.success) {
    return { success: false as const, message: result.message, profiles: [], actionState: {} };
  }

  // Keep this action free of seed injection so Supabase results stay untouched.
  // Preview injection happens in app/discovery/page.tsx.
  const cards = result.data.map(toDiscoveryFeedCard);
  const realIds = cards.map((c) => c.id).filter((id) => !isSeedProfileId(id));
  const actionState = await loadActionStateForProfiles(realIds);

  return {
    success: true as const,
    profiles: cards,
    actionState: actionState.success ? actionState.data : {},
  };
}

export async function fetchDiscoveryProfileAction(profileId: string) {
  // Runtime-only seed fixtures — never query Supabase for seed-* ids.
  if (isSeedProfileId(profileId)) {
    if (!canInjectSeedData()) {
      return {
        success: true as const,
        unavailable: true as const,
        profile: null,
        actionState: null,
      };
    }
    const seed = getSeedProfileById(profileId);
    if (!seed) {
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
      profile: toSeedPublicDiscoveryProfile(seed),
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
