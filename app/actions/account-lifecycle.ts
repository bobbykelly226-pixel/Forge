'use server';

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { getSessionId } from '@/lib/account/lifecycle';
import { PROFILE_PHOTO_BUCKET } from '@/lib/profile-photo';
import { createServiceClient } from '@/lib/supabase/admin';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export type AccountActionState = {
  success: boolean;
  message: string;
  downloadUrl?: string;
  deleted?: boolean;
};

type CurrentIdentity = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  sessionId: string;
};

type ConfirmedIdentity = CurrentIdentity & {
  admin: NonNullable<ReturnType<typeof createServiceClient>>;
  db: SupabaseClient;
};

async function currentIdentity(): Promise<CurrentIdentity | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Your session has expired. Sign in again.' } as const;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const sessionId = getSessionId(session?.access_token);
  if (!sessionId) return { error: 'Your secure session could not be verified. Sign in again.' } as const;
  return { supabase, userId: user.id, email: user.email, sessionId };
}

async function confirmPasswordAndRecord(
  password: string
): Promise<ConfirmedIdentity | { error: string }> {
  const identity = await currentIdentity();
  if ('error' in identity) return identity;
  if (password.length < 8 || password.length > 200) {
    return { error: 'Enter your current password.' } as const;
  }

  const { url, anonKey } = getSupabaseEnv();
  const verifier = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await verifier.auth.signInWithPassword({
    email: identity.email,
    password,
  });
  if (error || data.user?.id !== identity.userId) {
    return { error: 'That password was not accepted.' } as const;
  }
  await verifier.auth.signOut({ scope: 'local' });

  const admin = createServiceClient();
  if (!admin) return { error: 'The account security service is not configured.' } as const;
  const db = admin as unknown as SupabaseClient;
  const { error: recordError } = await db.from('account_recent_auth_verifications').insert({
    user_id: identity.userId,
    session_id: identity.sessionId,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (recordError) {
    console.error('Recent account authentication could not be recorded.', recordError);
    return { error: 'Password confirmation could not be completed.' } as const;
  }
  return { ...identity, admin, db } as const;
}

export async function changeAccountLifecycleAction(
  _previous: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const action = String(formData.get('lifecycle_action') ?? '');
  if (!['pause', 'resume', 'deactivate', 'reactivate'].includes(action)) {
    return { success: false, message: 'Choose a valid account action.' };
  }
  const identity = await currentIdentity();
  if ('error' in identity) return { success: false, message: identity.error };

  if (action === 'deactivate' || action === 'reactivate') {
    const confirmation = await confirmPasswordAndRecord(String(formData.get('password') ?? ''));
    if ('error' in confirmation) return { success: false, message: confirmation.error };
  }

  const client = identity.supabase as unknown as SupabaseClient;
  const { data, error } = await client.rpc('set_my_account_lifecycle', { p_action: action });
  const result = data as { ok?: boolean; message?: string } | null;
  if (error || !result?.ok) {
    return { success: false, message: result?.message ?? 'The account change could not be saved.' };
  }
  revalidatePath('/profile');
  revalidatePath('/profile/account');
  revalidatePath('/discovery');
  return { success: true, message: result.message ?? 'Your account was updated.' };
}

export async function requestAccountExportAction(
  _previous: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const confirmation = await confirmPasswordAndRecord(String(formData.get('password') ?? ''));
  if ('error' in confirmation) return { success: false, message: confirmation.error };

  const token = crypto.randomUUID();
  const { error } = await confirmation.db.from('account_export_tokens').insert({
    token,
    user_id: confirmation.userId,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  if (error) return { success: false, message: 'The export could not be prepared.' };
  await confirmation.db.from('account_lifecycle_events').insert({
    user_id: confirmation.userId,
    actor_user_id: confirmation.userId,
    action: 'export_requested',
  });
  return {
    success: true,
    message: 'Your one-time download is ready for five minutes.',
    downloadUrl: `/api/account/export?token=${encodeURIComponent(token)}`,
  };
}

export async function deleteAccountAction(
  _previous: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  if (String(formData.get('confirmation') ?? '').trim() !== 'DELETE') {
    return { success: false, message: 'Type DELETE exactly to confirm permanent account deletion.' };
  }
  const confirmation = await confirmPasswordAndRecord(String(formData.get('password') ?? ''));
  if ('error' in confirmation) return { success: false, message: confirmation.error };

  const { data: photos } = await confirmation.db
    .from('profile_photos')
    .select('storage_path')
    .eq('user_id', confirmation.userId);
  const { data: attachments } = await confirmation.db
    .from('message_attachments')
    .select('storage_path')
    .eq('sender_id', confirmation.userId);

  const { data, error } = await confirmation.db.rpc('prepare_account_deletion', {
    p_user_id: confirmation.userId,
    p_session_id: confirmation.sessionId,
  });
  const result = data as { ok?: boolean; message?: string } | null;
  if (error || !result?.ok) {
    return { success: false, message: result?.message ?? 'The account could not be deleted.' };
  }

  const photoPaths = (photos ?? []).map((item: { storage_path?: unknown }) => String(item.storage_path ?? '')).filter(Boolean);
  const attachmentPaths = (attachments ?? []).map((item: { storage_path?: unknown }) => String(item.storage_path ?? '')).filter(Boolean);
  if (photoPaths.length) await confirmation.admin.storage.from(PROFILE_PHOTO_BUCKET).remove(photoPaths);
  if (attachmentPaths.length) {
    await confirmation.admin.storage.from('conversation-attachments').remove(attachmentPaths);
  }

  const { error: authError } = await confirmation.admin.auth.admin.deleteUser(
    confirmation.userId,
    true
  );
  await confirmation.db.rpc('complete_account_deletion', {
    p_user_id: confirmation.userId,
    p_success: !authError,
    p_reason: authError?.message ?? null,
  });
  if (authError) {
    console.error('Supabase Auth soft deletion failed.', authError);
    return { success: false, message: 'Profile data was prepared, but sign-in deletion needs administrator review.' };
  }

  await confirmation.supabase.auth.signOut({ scope: 'global' });
  return {
    success: true,
    deleted: true,
    message: 'Your Forge account has been deleted and you have been signed out.',
  };
}
