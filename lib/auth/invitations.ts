export const INVITATION_REQUIRED_MESSAGE =
  'Forge is currently invitation-only. Use the email address that received your Founding Beta invitation.';

export type BetaSignupInvitationState = {
  accepted_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

export function isActiveBetaSignupInvitation(
  invitation: BetaSignupInvitationState | null,
  nowMs = Date.now()
): boolean {
  if (!invitation || invitation.accepted_at || invitation.revoked_at) return false;
  if (invitation.expires_at) {
    const expiresAtMs = new Date(invitation.expires_at).getTime();
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) return false;
  }
  return true;
}
