import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { getRecognitionFlowInitialState } from '@/lib/character-signals/recognition-flow-state';
import type { RecognitionRecipient } from '@/lib/character-signals-mock';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const inAppRecipient: RecognitionRecipient = {
  id: 'recipient-a',
  firstName: 'Alex',
  defaultInteractionType: 'in_app',
  contextLabel: 'Recent conversation',
};

const inPersonRecipient: RecognitionRecipient = {
  id: 'recipient-b',
  firstName: 'Blake',
  defaultInteractionType: 'in_person',
  contextLabel: 'Met in person',
};

describe('RecognitionFlowDrawer reset behavior', () => {
  it('initial state resets to context with recipient default interaction and no signal', () => {
    assert.deepEqual(getRecognitionFlowInitialState(inAppRecipient), {
      step: 'context',
      interactionType: 'in_app',
      selectedSignalId: null,
    });
    assert.deepEqual(getRecognitionFlowInitialState(inPersonRecipient), {
      step: 'context',
      interactionType: 'in_person',
      selectedSignalId: null,
    });
  });

  it('remounts inner drawer on open and when recipient identity changes', () => {
    const source = readSource('components/character-signals/RecognitionFlowDrawer.tsx');

    assert.match(
      source,
      /if\s*\(\s*!open\s*\|\|\s*!recipient\s*\)\s*return\s*null/,
      'closed drawer must unmount so reopen remounts fresh state'
    );
    assert.match(
      source,
      /key=\{recipient\.id\}/,
      'recipient identity changes must remount via key'
    );
    assert.match(
      source,
      /getRecognitionFlowInitialState\(recipient\)/,
      'mounted drawer must seed state from the shared initial-state helper'
    );
  });

  it('does not reset drawer fields with setState inside an effect', () => {
    const source = readSource('components/character-signals/RecognitionFlowDrawer.tsx');
    const effectBodies = [...source.matchAll(/useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\n  \},/g)].map(
      (match) => match[1]
    );

    assert.ok(effectBodies.length >= 1, 'expected at least one useEffect for focus/escape');
    for (const body of effectBodies) {
      assert.equal(body.includes('setStep('), false);
      assert.equal(body.includes('setInteractionType('), false);
      assert.equal(body.includes('setSelectedSignalId('), false);
    }
  });
});
