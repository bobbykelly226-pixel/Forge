import { createClient } from '@/lib/supabase/server';
import type { DataAccessResult } from '@/lib/data/profile';
import { ensureFoundationalRecords } from '@/lib/data/profile';
import type { PublicDiscoveryProfile } from '@/lib/discovery/presentation';
import { loadCurrentUserProfileBundle } from '@/lib/data/bundle';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null as null };
  }
  const ensured = await ensureFoundationalRecords();
  if (!ensured.success) {
    return { supabase, user: null as null };
  }
  return { supabase, user };
}

export type DiscoveryVisibilityState = {
  enabled: boolean;
  /** Safety only — completion never gates this. */
  canEnable: boolean;
  completionPercent: number;
  message: string | null;
};

function isAdministrativelyRestricted(status: string | null | undefined): boolean {
  return status === 'deactivated' || status === 'hidden';
}

export async function getDiscoveryVisibilityState(): Promise<
  DataAccessResult<DiscoveryVisibilityState>
> {
  const { user } = await requireUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const bundle = await loadCurrentUserProfileBundle();
  if (!bundle.success) {
    return { success: false, message: bundle.message };
  }

  const { profile, completionPercent } = bundle.data;
  const enabled = Boolean(profile?.is_discoverable);
  const canEnable = !isAdministrativelyRestricted(profile?.status);

  return {
    success: true,
    data: {
      enabled,
      canEnable,
      completionPercent,
      message: canEnable
        ? null
        : 'Discovery visibility is unavailable for this account.',
    },
  };
}

export async function setDiscoveryVisibility(
  enabled: boolean
): Promise<DataAccessResult<DiscoveryVisibilityState>> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data, error } = await supabase.rpc('set_my_discovery_visibility', {
    p_enabled: enabled,
  });

  if (error) {
    console.error('setDiscoveryVisibility:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return {
      success: false,
      message: 'Couldn’t update. Try again.',
    };
  }

  const payload = data as {
    ok?: boolean;
    enabled?: boolean;
    can_enable?: boolean;
    message?: string;
  };

  if (!payload?.ok) {
    console.error('setDiscoveryVisibility rejected:', payload);
    return {
      success: false,
      message: 'Couldn’t update. Try again.',
    };
  }

  const refreshed = await getDiscoveryVisibilityState();
  if (!refreshed.success) {
    return {
      success: true,
      data: {
        enabled: Boolean(payload.enabled),
        canEnable: payload.can_enable !== false,
        completionPercent: 0,
        message: payload.message ?? null,
      },
    };
  }

  return {
    success: true,
    data: {
      ...refreshed.data,
      enabled: Boolean(payload.enabled),
      message: payload.message ?? refreshed.data.message,
    },
  };
}

export async function listDiscoveryFeedProfiles(): Promise<
  DataAccessResult<PublicDiscoveryProfile[]>
> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data, error } = await supabase.rpc('list_eligible_discovery_profiles', {
    p_limit: 50,
  });

  if (error) {
    console.error('listDiscoveryFeedProfiles:', error.message);
    return {
      success: false,
      message: 'Could not load Discovery right now. Please try again.',
    };
  }

  return {
    success: true,
    data: (data ?? []) as PublicDiscoveryProfile[],
  };
}

export async function getDiscoveryProfile(
  profileId: string
): Promise<DataAccessResult<PublicDiscoveryProfile | null>> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data, error } = await supabase.rpc('get_eligible_discovery_profile', {
    p_profile_id: profileId,
  });

  if (error) {
    console.error('getDiscoveryProfile:', error.message);
    return {
      success: false,
      message: 'Could not load this profile right now.',
    };
  }

  const rows = (data ?? []) as PublicDiscoveryProfile[];
  return { success: true, data: rows[0] ?? null };
}

export type ProfileActionState = {
  interested: boolean;
  openToChatSent: boolean;
  openToChatNote: string | null;
  openToChatRequestId: string | null;
  saved: boolean;
  passed: boolean;
  connected: boolean;
};

export async function loadActionStateForProfiles(
  profileIds: string[]
): Promise<DataAccessResult<Record<string, ProfileActionState>>> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const uniqueIds = [...new Set(profileIds.filter(Boolean))];
  const empty = (): ProfileActionState => ({
    interested: false,
    openToChatSent: false,
    openToChatNote: null,
    openToChatRequestId: null,
    saved: false,
    passed: false,
    connected: false,
  });

  const result: Record<string, ProfileActionState> = {};
  for (const id of uniqueIds) {
    result[id] = empty();
  }

  if (uniqueIds.length === 0) {
    return { success: true, data: result };
  }

  const [saved, passed, interests, otc, connections] = await Promise.all([
    supabase
      .from('saved_profiles')
      .select('saved_id')
      .eq('saver_id', user.id)
      .in('saved_id', uniqueIds),
    supabase
      .from('passed_profiles')
      .select('passed_id')
      .eq('passer_id', user.id)
      .in('passed_id', uniqueIds),
    supabase
      .from('interests')
      .select('recipient_id, status')
      .eq('sender_id', user.id)
      .in('recipient_id', uniqueIds)
      .in('status', ['pending', 'mutual']),
    supabase
      .from('open_to_chat_requests')
      .select('id, recipient_id, note, status')
      .eq('sender_id', user.id)
      .in('recipient_id', uniqueIds)
      .in('status', ['pending', 'deferred', 'accepted']),
    supabase
      .from('connections')
      .select('user_a_id, user_b_id, status')
      .eq('status', 'active')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
  ]);

  for (const row of saved.data ?? []) {
    if (result[row.saved_id]) result[row.saved_id]!.saved = true;
  }
  for (const row of passed.data ?? []) {
    if (result[row.passed_id]) result[row.passed_id]!.passed = true;
  }
  for (const row of interests.data ?? []) {
    if (result[row.recipient_id]) result[row.recipient_id]!.interested = true;
  }
  for (const row of otc.data ?? []) {
    const state = result[row.recipient_id];
    if (!state) continue;
    state.openToChatSent = true;
    state.openToChatNote = row.note;
    state.openToChatRequestId = row.id;
  }
  const idSet = new Set(uniqueIds);
  for (const row of connections.data ?? []) {
    const other = row.user_a_id === user.id ? row.user_b_id : row.user_a_id;
    if (idSet.has(other) && result[other]) result[other]!.connected = true;
  }

  return { success: true, data: result };
}
