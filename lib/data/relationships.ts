import { createClient } from '@/lib/supabase/server';
import { ensureFoundationalRecords, type DataAccessResult } from '@/lib/data/profile';
import { isOpenToChatNoteValid, OPEN_TO_CHAT_NOTE_MAX_LENGTH } from '@/lib/data-model-rules';
import { OPEN_TO_CHAT_DAILY_LIMIT } from '@/lib/discovery/config';

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

type RpcOk = { ok?: boolean; message?: string; [key: string]: unknown };

function rpcResult(
  data: unknown,
  error: { message: string } | null,
  fallback: string
): DataAccessResult<RpcOk> {
  if (error) {
    console.error(fallback, error.message);
    return { success: false, message: fallback };
  }
  const payload = (data ?? {}) as RpcOk;
  if (!payload.ok) {
    return {
      success: false,
      message: payload.message || fallback,
    };
  }
  return { success: true, data: payload };
}

export async function saveProfileForLater(
  profileId: string
): Promise<DataAccessResult<RpcOk>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };
  const { data, error } = await supabase.rpc('save_profile_for_later', {
    p_profile_id: profileId,
  });
  return rpcResult(data, error, 'Could not save this profile. Please try again.');
}

export async function removeSavedProfile(
  profileId: string
): Promise<DataAccessResult<RpcOk>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };
  const { data, error } = await supabase.rpc('remove_saved_profile', {
    p_profile_id: profileId,
  });
  return rpcResult(data, error, 'Could not update Saved. Please try again.');
}

export async function passOnProfile(
  profileId: string
): Promise<DataAccessResult<RpcOk>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };
  const { data, error } = await supabase.rpc('pass_on_profile', {
    p_profile_id: profileId,
  });
  return rpcResult(data, error, 'Could not pass on this profile. Please try again.');
}

export async function sendInterest(
  profileId: string
): Promise<DataAccessResult<RpcOk>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };
  const { data, error } = await supabase.rpc('send_interest', {
    p_recipient_id: profileId,
  });
  return rpcResult(data, error, 'Could not express interest. Please try again.');
}

export async function withdrawInterest(
  profileId: string
): Promise<DataAccessResult<RpcOk>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };
  const { data, error } = await supabase.rpc('withdraw_interest', {
    p_recipient_id: profileId,
  });
  return rpcResult(data, error, 'Could not undo interest. Please try again.');
}

export async function sendOpenToChat(
  profileId: string,
  note: string | null
): Promise<DataAccessResult<RpcOk>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };

  if (!isOpenToChatNoteValid(note)) {
    return {
      success: false,
      message: `Your note must be ${OPEN_TO_CHAT_NOTE_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (OPEN_TO_CHAT_DAILY_LIMIT != null) {
    const { data: count, error: countError } = await supabase.rpc(
      'count_open_to_chat_sent_today',
      { p_user_id: user.id }
    );
    if (countError) {
      console.error('count_open_to_chat_sent_today:', countError.message);
      return {
        success: false,
        message: 'Could not send Open to Chat right now. Please try again.',
      };
    }
    if (typeof count === 'number' && count >= OPEN_TO_CHAT_DAILY_LIMIT) {
      return {
        success: false,
        message: 'You have reached today’s Open to Chat limit. Please try again tomorrow.',
      };
    }
  }

  const { data, error } = await supabase.rpc('send_open_to_chat', {
    p_recipient_id: profileId,
    p_note: note ?? undefined,
  });
  return rpcResult(data, error, 'Could not send Open to Chat. Please try again.');
}

export async function respondOpenToChat(
  requestId: string,
  action: 'accept' | 'defer' | 'decline'
): Promise<DataAccessResult<RpcOk>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };
  const { data, error } = await supabase.rpc('respond_open_to_chat', {
    p_request_id: requestId,
    p_action: action,
  });
  return rpcResult(data, error, 'Could not update this request. Please try again.');
}

export async function markOpenToChatEducationSeen(): Promise<DataAccessResult<RpcOk>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };
  const { data, error } = await supabase.rpc('mark_open_to_chat_education_seen');
  return rpcResult(data, error, 'Could not save that preference.');
}

export async function getOpenToChatEducationSeen(): Promise<DataAccessResult<boolean>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: 'You must be signed in.' };
  const { data, error } = await supabase
    .from('user_app_state')
    .select('open_to_chat_education_seen')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) {
    console.error('getOpenToChatEducationSeen:', error.message);
    return { success: false, message: 'Could not load your preferences.' };
  }
  return { success: true, data: Boolean(data?.open_to_chat_education_seen) };
}
