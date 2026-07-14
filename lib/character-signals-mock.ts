/**
 * Design-only Character Signals mock data.
 * No Supabase, matching, messaging, moderation, or persistent storage.
 */

export type InteractionType = 'in_app' | 'in_person';

export type CharacterSignalId =
  | 'respectful_communicator'
  | 'great_listener'
  | 'clear_intentions'
  | 'kind_conversation'
  | 'genuine_and_present'
  | 'consistent_follow_through'
  | 'respectful_in_person'
  | 'handled_mismatch_respectfully';

export type CharacterSignalDefinition = {
  id: CharacterSignalId;
  title: string;
  shortDescription: string;
  detailDescription: string;
  /** Interaction types where this signal is offered during recognition */
  interactionTypes: InteractionType[];
};

/** Placeholder policy only — not real counting logic. */
export const PUBLIC_DISPLAY_THRESHOLD = 3;

export const CHARACTER_SIGNAL_DEFINITIONS: CharacterSignalDefinition[] = [
  {
    id: 'respectful_communicator',
    title: 'Respectful Communicator',
    shortDescription: 'Communicated thoughtfully, kindly, and respectfully.',
    detailDescription:
      'This signal recognizes people who communicate with kindness, patience, and respect, even when the connection does not move forward.',
    interactionTypes: ['in_app'],
  },
  {
    id: 'great_listener',
    title: 'Great Listener',
    shortDescription: 'Made space to understand before responding.',
    detailDescription:
      'This signal recognizes people who listen carefully, make room for others, and respond with understanding.',
    interactionTypes: ['in_app', 'in_person'],
  },
  {
    id: 'clear_intentions',
    title: 'Clear Intentions',
    shortDescription: 'Was honest and direct about what they were looking for.',
    detailDescription:
      'This signal recognizes people who are honest and direct about what they are looking for, helping conversations stay grounded.',
    interactionTypes: ['in_app', 'in_person'],
  },
  {
    id: 'kind_conversation',
    title: 'Kind Conversation',
    shortDescription: 'Helped the interaction feel welcoming and considerate.',
    detailDescription:
      'This signal recognizes people who help interactions feel welcoming, considerate, and emotionally safe.',
    interactionTypes: ['in_app'],
  },
  {
    id: 'genuine_and_present',
    title: 'Genuine and Present',
    shortDescription: 'Showed authenticity and stayed engaged in the interaction.',
    detailDescription:
      'This signal recognizes people who show up authentically and stay engaged in meaningful interaction.',
    interactionTypes: ['in_app', 'in_person'],
  },
  {
    id: 'consistent_follow_through',
    title: 'Consistent Follow-through',
    shortDescription: 'Did what they said they would do.',
    detailDescription:
      'This signal recognizes people who follow through on what they say they will do, building quiet trust over time.',
    interactionTypes: ['in_person'],
  },
  {
    id: 'respectful_in_person',
    title: 'Respectful in Person',
    shortDescription: 'Was thoughtful, courteous, and respectful during an in-person meeting.',
    detailDescription:
      'This signal recognizes people who are thoughtful, courteous, and respectful during in-person meetings.',
    interactionTypes: ['in_person'],
  },
  {
    id: 'handled_mismatch_respectfully',
    title: 'Handled Mismatch Respectfully',
    shortDescription: 'Responded with maturity and kindness when the connection was not a fit.',
    detailDescription:
      'This signal recognizes people who respond with maturity and kindness when a connection is not the right fit.',
    interactionTypes: ['in_app', 'in_person'],
  },
];

export type SignalDisplayStatus = 'public' | 'hidden' | 'pending' | 'private' | 'growing';

export type UserSignalInstance = {
  id: string;
  signalId: CharacterSignalId;
  confirmationCount: number;
  status: SignalDisplayStatus;
  /** Optional attribution for a new recognition awaiting a decision */
  recognizedBy?: string;
};

export type RecognitionHistoryEntry = {
  id: string;
  kind: 'received' | 'given';
  signalId: CharacterSignalId;
  contextLabel: string;
  relativeTime: string;
  /** Only for given recognitions in this prototype */
  recipientFirstName?: string;
};

export type RecognitionRecipient = {
  id: string;
  firstName: string;
  defaultInteractionType: InteractionType;
  contextLabel: string;
};

export function getSignalDefinition(id: CharacterSignalId): CharacterSignalDefinition {
  const found = CHARACTER_SIGNAL_DEFINITIONS.find((signal) => signal.id === id);
  if (!found) {
    throw new Error(`Unknown Character Signal: ${id}`);
  }
  return found;
}

export function getSignalsForInteractionType(
  interactionType: InteractionType
): CharacterSignalDefinition[] {
  return CHARACTER_SIGNAL_DEFINITIONS.filter((signal) =>
    signal.interactionTypes.includes(interactionType)
  );
}

/** Public signals shown on /discovery/profile (Jessica). Max four. */
export const DISCOVERY_PROFILE_PUBLIC_SIGNALS: {
  signalId: CharacterSignalId;
  confirmationCount: number;
}[] = [
  { signalId: 'respectful_communicator', confirmationCount: 4 },
  { signalId: 'great_listener', confirmationCount: 3 },
  { signalId: 'clear_intentions', confirmationCount: 3 },
  { signalId: 'kind_conversation', confirmationCount: 2 },
];

/** Current user's managed Character Signals on /character-signals */
export const INITIAL_USER_SIGNALS: UserSignalInstance[] = [
  {
    id: 'user-respectful',
    signalId: 'respectful_communicator',
    confirmationCount: 4,
    status: 'public',
  },
  {
    id: 'user-listener',
    signalId: 'great_listener',
    confirmationCount: 3,
    status: 'public',
  },
  {
    id: 'user-intentions',
    signalId: 'clear_intentions',
    confirmationCount: 3,
    status: 'pending',
    recognizedBy: 'Jessica',
  },
  {
    id: 'user-follow-through',
    signalId: 'consistent_follow_through',
    confirmationCount: 2,
    status: 'growing',
  },
  {
    id: 'user-in-person',
    signalId: 'respectful_in_person',
    confirmationCount: 1,
    status: 'growing',
  },
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
    kind: 'received',
    signalId: 'great_listener',
    contextLabel: 'After meeting in person',
    relativeTime: 'Recently',
  },
  {
    id: 'hist-3',
    kind: 'given',
    signalId: 'kind_conversation',
    contextLabel: 'After an in-app conversation',
    relativeTime: 'This week',
    recipientFirstName: 'Jessica',
  },
  {
    id: 'hist-4',
    kind: 'received',
    signalId: 'clear_intentions',
    contextLabel: 'After an in-app conversation',
    relativeTime: 'Last month',
  },
];

export const RECOGNITION_RECIPIENTS: RecognitionRecipient[] = [
  {
    id: 'jessica',
    firstName: 'Jessica',
    defaultInteractionType: 'in_app',
    contextLabel: 'In-app conversation',
  },
];
