import { createClient } from '@/lib/supabase/server';
import { ensureFoundationalRecords, type DataAccessResult } from '@/lib/data/profile';
import {
  firstNameFromFullName,
  relativeTimeLabel,
  stablePortraitGradient,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';
import { DISCOVERY_NEUTRAL_ALIGNMENT_LABEL, DISCOVERY_NEUTRAL_CONFIDENCE } from '@/lib/discovery/config';

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

export type HubProfileCard = {
  id: string;
  firstName: string;
  age: number | null;
  location: string;
  alignmentLabel: string;
  confidence: string;
  hasImportantFactors: boolean;
  aboutPreview: string;
  characterSignals: string[];
  portraitGradient: string;
  photoUrl: string | null;
};

export type IncomingOpenToChatItem = HubProfileCard & {
  requestId: string;
  note: string | null;
  status: 'pending' | 'deferred';
  relativeTime: string;
};

export type IncomingInterestItem = HubProfileCard & {
  interestId: string;
  relativeTime: string;
};

export type MutualConnectionItem = HubProfileCard & {
  connectionId: string;
  source: 'mutual_interest' | 'open_to_chat';
  relativeTime: string;
};

export type SavedHubItem = HubProfileCard & {
  relativeTime: string;
  unavailable?: boolean;
};

export type SentHubItem = {
  id: string;
  profileId: string;
  type: 'interested' | 'open_to_chat';
  statusLabel: string;
  relativeTime: string;
  canWithdraw: boolean;
  note: string | null;
  profile: HubProfileCard | null;
  unavailable?: boolean;
};

export type ConnectionsHubData = {
  viewerFirstName: string;
  openToChat: IncomingOpenToChatItem[];
  interestReceived: IncomingInterestItem[];
  mutual: MutualConnectionItem[];
  saved: SavedHubItem[];
  sent: SentHubItem[];
  educationSeen: boolean;
  tabCounts: {
    forYou: number;
    openToChat: number;
    mutual: number;
    saved: number;
    sent: number;
  };
};

function toHubCard(profile: PublicDiscoveryProfile | null, id: string): HubProfileCard {
  if (!profile) {
    return {
      id,
      firstName: 'Member',
      age: null,
      location: 'Unavailable',
      alignmentLabel: DISCOVERY_NEUTRAL_ALIGNMENT_LABEL,
      confidence: DISCOVERY_NEUTRAL_CONFIDENCE,
      hasImportantFactors: false,
      aboutPreview: 'This profile is no longer available in Discovery.',
      characterSignals: [],
      portraitGradient: stablePortraitGradient(id),
      photoUrl: null,
    };
  }
  return {
    id: profile.id,
    firstName: firstNameFromFullName(profile.full_name),
    age: profile.age,
    location: profile.location?.trim() || 'Location shared privately',
    alignmentLabel: DISCOVERY_NEUTRAL_ALIGNMENT_LABEL,
    confidence: DISCOVERY_NEUTRAL_CONFIDENCE,
    hasImportantFactors: false,
    aboutPreview:
      profile.short_bio?.trim() ||
      'This Forge member is part of your Connections activity.',
    characterSignals: [],
    portraitGradient: stablePortraitGradient(profile.id),
    photoUrl: profile.profile_photo_url,
  };
}

async function loadPublicProfilesByIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Map<string, PublicDiscoveryProfile>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, PublicDiscoveryProfile>();
  if (unique.length === 0) return map;

  // Prefer public view; fall back silently when unavailable.
  const { data } = await supabase
    .from('discoverable_profiles')
    .select('*')
    .in('id', unique);

  for (const row of data ?? []) {
    if (row.id) {
      map.set(row.id, row as PublicDiscoveryProfile);
    }
  }
  return map;
}

export async function loadConnectionsHub(): Promise<DataAccessResult<ConnectionsHubData>> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const [
    profileRes,
    appStateRes,
    incomingOtcRes,
    incomingInterestRes,
    connectionsRes,
    savedRes,
    sentInterestRes,
    sentOtcRes,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('user_app_state')
      .select('open_to_chat_education_seen')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('open_to_chat_requests')
      .select('id, sender_id, note, status, created_at')
      .eq('recipient_id', user.id)
      .in('status', ['pending', 'deferred'])
      .order('created_at', { ascending: false }),
    supabase
      .from('interests')
      .select('id, sender_id, created_at, status')
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('connections')
      .select('id, user_a_id, user_b_id, source, created_at, status')
      .eq('status', 'active')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('saved_profiles')
      .select('saved_id, created_at')
      .eq('saver_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('interests')
      .select('id, recipient_id, status, created_at')
      .eq('sender_id', user.id)
      .in('status', ['pending', 'mutual'])
      .order('created_at', { ascending: false }),
    supabase
      .from('open_to_chat_requests')
      .select('id, recipient_id, note, status, created_at')
      .eq('sender_id', user.id)
      .in('status', ['pending', 'deferred', 'accepted'])
      .order('created_at', { ascending: false }),
  ]);

  const relatedIds = [
    ...(incomingOtcRes.data ?? []).map((r) => r.sender_id),
    ...(incomingInterestRes.data ?? []).map((r) => r.sender_id),
    ...(connectionsRes.data ?? []).map((c) =>
      c.user_a_id === user.id ? c.user_b_id : c.user_a_id
    ),
    ...(savedRes.data ?? []).map((s) => s.saved_id),
    ...(sentInterestRes.data ?? []).map((i) => i.recipient_id),
    ...(sentOtcRes.data ?? []).map((o) => o.recipient_id),
  ];

  const profiles = await loadPublicProfilesByIds(supabase, relatedIds);

  const openToChat: IncomingOpenToChatItem[] = (incomingOtcRes.data ?? []).map((row) => {
    const card = toHubCard(profiles.get(row.sender_id) ?? null, row.sender_id);
    return {
      ...card,
      requestId: row.id,
      note: row.note,
      status: row.status === 'deferred' ? 'deferred' : 'pending',
      relativeTime: relativeTimeLabel(row.created_at),
    };
  });

  const interestReceived: IncomingInterestItem[] = (incomingInterestRes.data ?? []).map(
    (row) => {
      const card = toHubCard(profiles.get(row.sender_id) ?? null, row.sender_id);
      return {
        ...card,
        interestId: row.id,
        relativeTime: relativeTimeLabel(row.created_at),
      };
    }
  );

  const mutual: MutualConnectionItem[] = (connectionsRes.data ?? []).map((row) => {
    const otherId = row.user_a_id === user.id ? row.user_b_id : row.user_a_id;
    const card = toHubCard(profiles.get(otherId) ?? null, otherId);
    return {
      ...card,
      connectionId: row.id,
      source: row.source,
      relativeTime: relativeTimeLabel(row.created_at),
    };
  });

  const saved: SavedHubItem[] = (savedRes.data ?? []).map((row) => {
    const profile = profiles.get(row.saved_id) ?? null;
    return {
      ...toHubCard(profile, row.saved_id),
      relativeTime: relativeTimeLabel(row.created_at),
      unavailable: !profile,
    };
  });

  const sentInterests: SentHubItem[] = (sentInterestRes.data ?? []).map((row) => {
    const profile = profiles.get(row.recipient_id) ?? null;
    return {
      id: row.id,
      profileId: row.recipient_id,
      type: 'interested',
      statusLabel: row.status === 'mutual' ? 'Mutual interest' : 'Awaiting mutual interest',
      relativeTime: relativeTimeLabel(row.created_at),
      canWithdraw: row.status === 'pending',
      note: null,
      profile: profile ? toHubCard(profile, row.recipient_id) : null,
      unavailable: !profile,
    };
  });

  const sentOtc: SentHubItem[] = (sentOtcRes.data ?? []).map((row) => {
    const profile = profiles.get(row.recipient_id) ?? null;
    const note = row.note;
    return {
      id: row.id,
      profileId: row.recipient_id,
      type: 'open_to_chat',
      statusLabel:
        row.status === 'accepted'
          ? 'Connected'
          : row.status === 'deferred'
            ? 'Request sent'
            : 'Request sent',
      relativeTime: relativeTimeLabel(row.created_at),
      canWithdraw: false,
      note,
      profile: profile ? toHubCard(profile, row.recipient_id) : null,
      unavailable: !profile,
    };
  });

  const sent = [...sentOtc, ...sentInterests].sort((a, b) =>
    a.relativeTime === b.relativeTime ? 0 : a.relativeTime < b.relativeTime ? 1 : -1
  );

  // For You: actionable incoming OTC (pending only) + pending interest received + new mutuals
  const forYouCount =
    openToChat.filter((item) => item.status === 'pending').slice(0, 2).length +
    interestReceived.length +
    mutual.length;

  return {
    success: true,
    data: {
      viewerFirstName: firstNameFromFullName(profileRes.data?.full_name),
      openToChat,
      interestReceived,
      mutual,
      saved,
      sent,
      educationSeen: Boolean(appStateRes.data?.open_to_chat_education_seen),
      tabCounts: {
        forYou: forYouCount,
        openToChat: openToChat.length,
        mutual: mutual.length,
        saved: saved.length,
        sent: sent.length,
      },
    },
  };
}
