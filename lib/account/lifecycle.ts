import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';

export type AccountLifecycle = {
  profile_status: 'draft' | 'active' | 'paused' | 'hidden' | 'deactivated';
  is_discoverable: boolean;
  deletion_status: 'none' | 'requested' | 'processing' | 'completed' | 'blocked_by_hold';
  deletion_requested_at: string | null;
  legal_hold_active: boolean;
  retention_class: 'standard' | 'safety_extended' | 'legal_required';
  retain_until: string | null;
  recent_auth: boolean;
};

export type LifecycleResult =
  | { success: true; data: AccountLifecycle }
  | { success: false; message: string };

export async function loadMyAccountLifecycle(): Promise<LifecycleResult> {
  const supabase = await createClient();
  const client = supabase as unknown as SupabaseClient;
  const { data, error } = await client.rpc('get_my_account_lifecycle');

  if (error || !data || typeof data !== 'object') {
    console.error('Account lifecycle state could not be loaded.', {
      code: error?.code,
      message: error?.message,
    });
    return { success: false, message: 'Account controls could not be loaded right now.' };
  }

  return { success: true, data: data as AccountLifecycle };
}

export function getSessionId(accessToken: string | undefined | null) {
  if (!accessToken) return null;
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as {
      session_id?: unknown;
    };
    const sessionId = typeof claims.session_id === 'string' ? claims.session_id : '';
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId
    )
      ? sessionId
      : null;
  } catch {
    return null;
  }
}
