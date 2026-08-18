import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';

export type OperatorMfaState =
  | { status: 'verified' }
  | { status: 'challenge-required' }
  | { status: 'not-enrolled' }
  | { status: 'unavailable'; message: string };

/**
 * Require step-up authentication after an operator opts into MFA while
 * allowing a controlled transition for allowlisted accounts that have not
 * enrolled a factor yet.
 */
export async function getOperatorMfaState(
  supabase: SupabaseClient<Database>
): Promise<OperatorMfaState> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) {
    console.error('Operator MFA assurance level could not be read.', {
      message: error.message,
      code: error.code,
    });
    return {
      status: 'unavailable',
      message: 'Your security status could not be verified. Try again before continuing.',
    };
  }

  if (data.currentLevel === 'aal2') {
    return { status: 'verified' };
  }

  if (data.nextLevel === 'aal2') {
    return { status: 'challenge-required' };
  }

  return { status: 'not-enrolled' };
}
