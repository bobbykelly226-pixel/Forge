export const INVITATION_REQUIRED_MESSAGE =
  'Use a current Founding Beta invitation link or the email address that received a direct invitation.';

export const BETA_ENROLLMENT_FULL_MESSAGE =
  'The current Founding Beta group is full. Join the waitlist and we will let you know when another place opens.';

export const BETA_ENROLLMENT_PAUSED_MESSAGE =
  'Founding Beta enrollment is temporarily paused. Join the waitlist and we will keep you updated.';

export type BetaAccessFailureReason =
  | 'full'
  | 'paused'
  | 'link_full'
  | 'reserved'
  | 'retry'
  | 'unavailable'
  | 'invalid';

export function betaAccessMessage(reason: BetaAccessFailureReason): string {
  if (reason === 'unavailable') return 'Invitation verification is temporarily unavailable. Please try again later.';
  if (reason === 'retry') return 'Please wait a few minutes before trying your invitation again.';
  if (reason === 'full' || reason === 'link_full') return BETA_ENROLLMENT_FULL_MESSAGE;
  if (reason === 'paused') return BETA_ENROLLMENT_PAUSED_MESSAGE;
  if (reason === 'reserved') {
    return 'That email is already using another active Founding Beta invitation. Try again shortly or use the original link.';
  }
  return INVITATION_REQUIRED_MESSAGE;
}

export function betaWaitlistPath(reason: BetaAccessFailureReason): string | undefined {
  if (reason === 'retry' || reason === 'reserved' || reason === 'unavailable') return undefined;
  return `/waitlist?reason=${reason}`;
}

export function betaAccessReasonFromAuthError(message: string): BetaAccessFailureReason | undefined {
  if (message.includes('Founding Beta enrollment is currently full')) return 'full';
  if (message.includes('Founding Beta enrollment is currently paused')) return 'paused';
  if (message.includes('Founding Beta invitation is no longer available')) return 'link_full';
  if (message.includes('Founding Beta invitation is required')) return 'invalid';
  return undefined;
}

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
