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
  interactionTypes: InteractionType[];
};

export const PUBLIC_DISPLAY_THRESHOLD = 3;

export const CHARACTER_SIGNAL_DEFINITIONS: CharacterSignalDefinition[] = [
  {
    id: 'respectful_communicator',
    title: 'Respectful Communicator',
    shortDescription: 'Communicated thoughtfully, kindly, and respectfully.',
    detailDescription:
      'Recognizes thoughtful, kind communication, including when a connection does not move forward.',
    interactionTypes: ['in_app'],
  },
  {
    id: 'great_listener',
    title: 'Good Listener',
    shortDescription: 'Made space to understand before responding.',
    detailDescription:
      'Recognizes someone who listened carefully, made room for others, and responded with understanding.',
    interactionTypes: ['in_app', 'in_person'],
  },
  {
    id: 'clear_intentions',
    title: 'Clear Intentions',
    shortDescription: 'Was honest and direct about what they were looking for.',
    detailDescription:
      'Recognizes honest, direct communication about what someone is looking for.',
    interactionTypes: ['in_app', 'in_person'],
  },
  {
    id: 'kind_conversation',
    title: 'Kind Conversation',
    shortDescription: 'Helped the interaction feel welcoming and considerate.',
    detailDescription:
      'Recognizes someone who helped an interaction feel welcoming, considerate, and emotionally safe.',
    interactionTypes: ['in_app'],
  },
  {
    id: 'genuine_and_present',
    title: 'Genuine and Present',
    shortDescription: 'Showed authenticity and stayed engaged in the interaction.',
    detailDescription:
      'Recognizes someone who showed up authentically and stayed engaged in a meaningful interaction.',
    interactionTypes: ['in_app', 'in_person'],
  },
  {
    id: 'consistent_follow_through',
    title: 'Consistent Follow-through',
    shortDescription: 'Did what they said they would do.',
    detailDescription:
      'Recognizes someone who followed through on what they said they would do.',
    interactionTypes: ['in_person'],
  },
  {
    id: 'respectful_in_person',
    title: 'Respectful in Person',
    shortDescription: 'Was thoughtful and courteous during an in-person meeting.',
    detailDescription:
      'Recognizes someone who was thoughtful, courteous, and respectful during an in-person meeting.',
    interactionTypes: ['in_person'],
  },
  {
    id: 'handled_mismatch_respectfully',
    title: 'Handled Mismatch Respectfully',
    shortDescription: 'Responded with maturity when the connection was not a fit.',
    detailDescription:
      'Recognizes someone who responded with maturity and kindness when the connection was not the right fit.',
    interactionTypes: ['in_app', 'in_person'],
  },
];

export const CHARACTER_SIGNAL_IDS = CHARACTER_SIGNAL_DEFINITIONS.map(
  (signal) => signal.id
) as CharacterSignalId[];

export function isCharacterSignalId(value: unknown): value is CharacterSignalId {
  return typeof value === 'string' && CHARACTER_SIGNAL_IDS.includes(value as CharacterSignalId);
}

export function isInteractionType(value: unknown): value is InteractionType {
  return value === 'in_app' || value === 'in_person';
}

export function getSignalDefinition(id: CharacterSignalId): CharacterSignalDefinition {
  const found = CHARACTER_SIGNAL_DEFINITIONS.find((signal) => signal.id === id);
  if (!found) throw new Error(`Unknown Character Signal: ${id}`);
  return found;
}

export function getSignalsForInteractionType(
  interactionType: InteractionType
): CharacterSignalDefinition[] {
  return CHARACTER_SIGNAL_DEFINITIONS.filter((signal) =>
    signal.interactionTypes.includes(interactionType)
  );
}
