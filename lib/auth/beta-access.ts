import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { BetaAccessFailureReason } from '@/lib/auth/invitations';
import { createServiceClient } from '@/lib/supabase/admin';

type ReservationResponse = {
  ok?: boolean;
  access?: 'email_invitation' | 'link';
  reason?: BetaAccessFailureReason;
};

export type BetaSignupAccess =
  | { ok: true; reservationProof?: string }
  | { ok: false; reason: BetaAccessFailureReason };

export function hashBetaAccessSecret(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export async function reserveBetaSignupAccess(input: {
  email: string;
  invitationToken?: string;
}): Promise<BetaSignupAccess | null> {
  const admin = createServiceClient();
  if (!admin) return { ok: false, reason: 'unavailable' };

  const invitationToken = input.invitationToken?.trim();
  if (!invitationToken) {
    const [invitationResult, settingsResult] = await Promise.all([
      admin
        .from('beta_signup_invitations')
        .select('accepted_at, expires_at, revoked_at')
        .eq('email', input.email)
        .maybeSingle(),
      admin
        .from('beta_enrollment_settings')
        .select('accepted_count, member_limit')
        .eq('singleton', true)
        .single(),
    ]);

    if (invitationResult.error || settingsResult.error) {
      console.error('Founding Beta email invitation preflight failed.');
      return { ok: false, reason: 'unavailable' };
    }
    if (settingsResult.data.accepted_count >= settingsResult.data.member_limit) {
      return { ok: false, reason: 'full' };
    }
    const data = invitationResult.data;
    if (!data) return { ok: false, reason: 'invalid' };

    const active =
      !data.accepted_at &&
      !data.revoked_at &&
      (!data.expires_at || new Date(data.expires_at).getTime() > Date.now());
    return active ? { ok: true } : { ok: false, reason: 'invalid' };
  }

  if (!/^[A-Za-z0-9_-]{32,256}$/.test(invitationToken)) {
    return { ok: false, reason: 'invalid' };
  }

  const reservationProof = randomBytes(32).toString('hex');
  const db = admin as unknown as SupabaseClient;
  const { data, error } = await db.rpc('reserve_beta_signup_access', {
    p_email: input.email,
    p_link_token_hash: hashBetaAccessSecret(invitationToken),
    p_reservation_proof_hash: hashBetaAccessSecret(reservationProof),
  });

  if (error) {
    console.error('Founding Beta link reservation failed.');
    return { ok: false, reason: 'unavailable' };
  }

  const result = data as ReservationResponse | null;
  if (!result?.ok) {
    return { ok: false, reason: result?.reason ?? 'invalid' };
  }

  return result.access === 'link'
    ? { ok: true, reservationProof }
    : { ok: true };
}

/** Read-only landing-page check; the Auth hook remains authoritative at signup. */
export async function betaSignupLandingReason(token?: string): Promise<BetaAccessFailureReason | undefined> {
  const admin = createServiceClient();
  if (!admin) return 'unavailable';
  const { data: settings, error } = await admin.from('beta_enrollment_settings')
    .select('enrollment_open, accepted_count, member_limit').eq('singleton', true).single();
  if (error || !settings) return 'unavailable';
  if (settings.accepted_count >= settings.member_limit) return 'full';
  if (!token) return undefined; // Direct-email testing remains available when public links pause.
  if (!settings.enrollment_open) return 'paused';
  const { data: link, error: linkError } = await admin.from('beta_signup_links')
    .select('expires_at, paused_at, revoked_at, use_count, max_uses')
    .eq('token_hash', hashBetaAccessSecret(token)).maybeSingle();
  if (linkError) return 'unavailable';
  if (!link || link.revoked_at || link.paused_at || (link.expires_at && Date.parse(link.expires_at) <= Date.now())) return 'invalid';
  return link.use_count >= link.max_uses ? 'link_full' : undefined;
}
