import type {
  CharacterSignalId,
  InteractionType,
} from '@/lib/character-signals/catalog';
import type { RecognitionRecipient } from '@/lib/character-signals/types';

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
