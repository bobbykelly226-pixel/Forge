'use server';

export type FoundingBetaReviewState = { success: boolean; message: string };

/** Retired invitation actions must not send obsolete, expiring invitations. */
export async function reviewFoundingBetaRequestAction(): Promise<FoundingBetaReviewState> {
  return { success: false, message: 'Forge now offers direct beta signup. Share https://forge.forgedinlife.com/signup instead. Existing accounts should sign in.' };
}
