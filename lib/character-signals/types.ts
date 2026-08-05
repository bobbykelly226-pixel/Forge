import type { CharacterSignalId, InteractionType } from './catalog';

export type SignalDisplayStatus = 'public' | 'hidden' | 'pending' | 'private' | 'growing';

export type UserSignalInstance = {
  id: string;
  signalId: CharacterSignalId;
  confirmationCount: number;
  status: SignalDisplayStatus;
  recognizedBy?: string;
  canPublishAfterApproval?: boolean;
};

export type RecognitionHistoryEntry = {
  id: string;
  kind: 'received' | 'given';
  signalId: CharacterSignalId;
  contextLabel: string;
  relativeTime: string;
  recipientFirstName?: string;
};

export type RecognitionRecipient = {
  id: string;
  firstName: string;
  defaultInteractionType: InteractionType;
  contextLabel: string;
};

export type CharacterSignalsDashboard = {
  signals: UserSignalInstance[];
  history: RecognitionHistoryEntry[];
  recipients: RecognitionRecipient[];
};

export type PublicCharacterSignal = {
  signalId: CharacterSignalId;
  confirmationCount: number;
};

export type CharacterSignalActionResult = {
  success: boolean;
  message: string;
};
