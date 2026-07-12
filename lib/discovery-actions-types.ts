/**
 * Local-only Discovery action types for UI/UX prototype.
 * No persistence, matching, messaging, or backend.
 */

export type DiscoveryProfileActionState = {
  interested: boolean;
  openToChatSent: boolean;
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

export type OpenToChatPrompt = {
  profileId: string;
  profileName: string;
  /** educate = full drawer; success = lightweight confirmation */
  mode: 'educate' | 'confirm' | 'success';
  /** When true, show the first-time banner inside educate mode */
  showFirstTimeBanner: boolean;
};

export function createEmptyActionState(): DiscoveryProfileActionState {
  return {
    interested: false,
    openToChatSent: false,
    saved: false,
    passed: false,
  };
}
