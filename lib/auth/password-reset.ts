import type { SupabaseClient } from '@supabase/supabase-js';

type ResetAuth = Pick<SupabaseClient['auth'], 'updateUser' | 'signOut'>;

/** Revoke refresh sessions after updating. Already-issued JWTs can live until expiry. */
export async function finishPasswordReset(auth: ResetAuth, password: string, passwordUpdated = false) {
  if (!passwordUpdated) {
    const { error } = await auth.updateUser({ password });
    if (error) return { passwordUpdated: false, signedOut: false, error: error.message };
  }
  try {
    const { error } = await auth.signOut({ scope: 'global' });
    if (error) return { passwordUpdated: true, signedOut: false, error: 'Your password was updated, but signing out could not finish. Select Finish signing out to retry.' };
  } catch {
    return { passwordUpdated: true, signedOut: false, error: 'Your password was updated, but signing out could not finish. Select Finish signing out to retry.' };
  }
  return { passwordUpdated: true, signedOut: true, error: null };
}
