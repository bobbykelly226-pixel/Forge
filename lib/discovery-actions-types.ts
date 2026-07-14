/**
 * Local-only Discovery action types for UI/UX prototype.
 * No persistence, matching, messaging, or backend.
 */

export const OPEN_TO_CHAT_NOTE_MAX_LENGTH = 200;

export type DiscoveryProfileActionState = {
  interested: boolean;
  openToChatSent: boolean;
  /** Trimmed note stored after send; null when sent without a note */
  openToChatNote: string | null;
  saved: boolean;
  passed: boolean;
};

export type DiscoveryActionConflict =
  | {
      type: 'interested-to-chat';
      profileId: string;
      profileName: string;
    }
  | {
      type: 'chat-to-interested';
      profileId: string;
      profileName: string;
    };

export type NotForMePrompt = {
  profileId: string;
  profileName: string;
};

/** Open to Chat V2 drawer launch payload */
export type OpenToChatPrompt = {
  profileId: string;
  profileName: string;
  /** educate = first-use or info review; note = skip education */
  initialStep: 'educate' | 'note';
  showFirstTimeBanner: boolean;
  /**
   * Info icon: education only for review.
   * Continue returns to note when not yet sent; otherwise closes without sending.
   */
  educateOnly: boolean;
};

export function createEmptyActionState(): DiscoveryProfileActionState {
  return {
    interested: false,
    openToChatSent: false,
    openToChatNote: null,
    saved: false,
    passed: false,
  };
}
