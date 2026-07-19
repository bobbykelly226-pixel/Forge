import { createClient } from '@/lib/supabase/server';
import { orderConnectionParticipants } from '@/lib/data-model-rules';
import type { DataAccessResult } from '@/lib/data/profile';

/**
 * Returns the active mutual connection id between the signed-in user and a peer,
 * when one exists. Used for Discovery profile conversation CTAs.
 */
export async function getActiveConnectionIdWithPeer(
  peerUserId: string
): Promise<DataAccessResult<string | null>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: 'You must be signed in.' };
  }

  if (!peerUserId || peerUserId === user.id) {
    return { success: true, data: null };
  }

  const ordered = orderConnectionParticipants(user.id, peerUserId);
  if (!ordered) {
    return { success: true, data: null };
  }

  const { data, error } = await supabase
    .from('connections')
    .select('id')
    .eq('status', 'active')
    .eq('user_a_id', ordered.user_a_id)
    .eq('user_b_id', ordered.user_b_id)
    .maybeSingle();

  if (error) {
    console.error('getActiveConnectionIdWithPeer:', error.message);
    return { success: false, message: 'Could not load connection status.' };
  }

  return { success: true, data: data?.id ?? null };
}
