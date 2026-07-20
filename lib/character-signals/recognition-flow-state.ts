import type {
  CharacterSignalId,
  InteractionType,
  RecognitionRecipient,
} from '@/lib/character-signals-mock';

export type RecognitionFlowStep = 'context' | 'select' | 'confirm' | 'success';

export type RecognitionFlowInitialState = {
  step: RecognitionFlowStep;
  interactionType: InteractionType;
  selectedSignalId: CharacterSignalId | null;
};

/**
 * Canonical initial drawer state when the recognition flow mounts
 * (drawer opens or recipient identity changes via remount key).
 */
export function getRecognitionFlowInitialState(
  recipient: RecognitionRecipient
): RecognitionFlowInitialState {
  return {
    step: 'context',
    interactionType: recipient.defaultInteractionType,
    selectedSignalId: null,
  };
}
