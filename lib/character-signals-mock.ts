/** Seed-only fixtures. Production Character Signals load from Supabase. */
import {
  type CharacterSignalId,
} from '@/lib/character-signals/catalog';
import type {
  RecognitionHistoryEntry,
  RecognitionRecipient,
  UserSignalInstance,
} from '@/lib/character-signals/types';

export {
  CHARACTER_SIGNAL_DEFINITIONS,
  PUBLIC_DISPLAY_THRESHOLD,
  getSignalDefinition,
  getSignalsForInteractionType,
} from '@/lib/character-signals/catalog';
export type {
  CharacterSignalDefinition,
  CharacterSignalId,
  InteractionType,
} from '@/lib/character-signals/catalog';
export type {
  RecognitionHistoryEntry,
  RecognitionRecipient,
  SignalDisplayStatus,
  UserSignalInstance,
} from '@/lib/character-signals/types';

export const DISCOVERY_PROFILE_PUBLIC_SIGNALS: {
  signalId: CharacterSignalId;
  confirmationCount: number;
}[] = [
  { signalId: 'respectful_communicator', confirmationCount: 4 },
  { signalId: 'great_listener', confirmationCount: 3 },
  { signalId: 'clear_intentions', confirmationCount: 3 },
  { signalId: 'kind_conversation', confirmationCount: 2 },
];

export const INITIAL_USER_SIGNALS: UserSignalInstance[] = [
  { id: 'user-respectful', signalId: 'respectful_communicator', confirmationCount: 4, status: 'public' },
  { id: 'user-listener', signalId: 'great_listener', confirmationCount: 3, status: 'public' },
  {
    id: 'user-intentions',
    signalId: 'clear_intentions',
    confirmationCount: 3,
    status: 'pending',
    recognizedBy: 'Jessica',
    canPublishAfterApproval: true,
  },
  { id: 'user-follow-through', signalId: 'consistent_follow_through', confirmationCount: 2, status: 'growing' },
  { id: 'user-in-person', signalId: 'respectful_in_person', confirmationCount: 1, status: 'growing' },
];

export const INITIAL_RECOGNITION_HISTORY: RecognitionHistoryEntry[] = [
  {
    id: 'hist-1',
    kind: 'received',
    signalId: 'respectful_communicator',
    contextLabel: 'After an in-app conversation',
    relativeTime: 'Recently',
  },
  {
    id: 'hist-2',
    kind: 'given',
    signalId: 'kind_conversation',
    contextLabel: 'After an in-app conversation',
    relativeTime: 'This week',
    recipientFirstName: 'Jessica',
  },
];

export const RECOGNITION_RECIPIENTS: RecognitionRecipient[] = [
  {
    id: 'jessica',
    firstName: 'Jessica',
    defaultInteractionType: 'in_app',
    contextLabel: 'Two-way Forge conversation',
  },
];
