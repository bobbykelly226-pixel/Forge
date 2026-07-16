import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  resolveAboutPreview,
  resolveUnifiedAbout,
} from '../profile/unified-about';

describe('unified About biography', () => {
  it('uses About when only About exists', () => {
    assert.equal(resolveUnifiedAbout('Short intro', null), 'Short intro');
    assert.equal(resolveUnifiedAbout('Short intro', '  '), 'Short intro');
  });

  it('uses More About when only More About exists', () => {
    assert.equal(resolveUnifiedAbout(null, 'Longer story'), 'Longer story');
    assert.equal(resolveUnifiedAbout('', 'Longer story'), 'Longer story');
  });

  it('dedupes identical or substantially identical content', () => {
    assert.equal(resolveUnifiedAbout('Same text', 'Same text'), 'Same text');
    assert.equal(resolveUnifiedAbout('Hello world', 'Hello   world'), 'Hello world');
    assert.equal(
      resolveUnifiedAbout('Full paragraph with more detail', 'with more detail'),
      'Full paragraph with more detail'
    );
  });

  it('combines distinct About and More About without dropping either', () => {
    assert.equal(
      resolveUnifiedAbout('Intro sentence.', 'Longer biography continues here.'),
      'Intro sentence.\n\nLonger biography continues here.'
    );
  });

  it('returns null when both are empty', () => {
    assert.equal(resolveUnifiedAbout(null, null), null);
    assert.equal(resolveUnifiedAbout('  ', ''), null);
  });

  it('prefers short About for feed previews', () => {
    assert.equal(resolveAboutPreview('Short', 'Longer'), 'Short');
    assert.equal(resolveAboutPreview(null, 'Only more'), 'Only more');
  });
});

describe('public profile information density', () => {
  it('collapses Why Forge Introduced You reasons after three with More / Show Less', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/discovery/ProfileAlignmentSections.tsx'),
      'utf8'
    );
    assert.match(source, /WHY_SURFACED_PREVIEW_COUNT = 3/);
    assert.match(source, /sharedStrengths\.slice\(0, WHY_SURFACED_PREVIEW_COUNT\)/);
    assert.match(source, /Why Forge Introduced You/);
    assert.match(source, /\{whySurfacedExpanded \? 'Show Less' : 'More'\}/);
    assert.match(source, /aria-expanded=\{whySurfacedExpanded\}/);
    assert.doesNotMatch(source, /More About/);
  });

  it('presents one About section and omits More About on the public profile', () => {
    const presentation = readFileSync(
      join(process.cwd(), 'components/discovery/PublicProfilePresentation.tsx'),
      'utf8'
    );
    assert.match(presentation, /resolveUnifiedAbout/);
    assert.doesNotMatch(presentation, /More About/);
    assert.doesNotMatch(presentation, /hasMoreAbout/);
  });

  it('compacts Character Signals without changing signal ids or confirmation logic', () => {
    const signals = readFileSync(
      join(process.cwd(), 'components/character-signals/PublicCharacterSignalsSection.tsx'),
      'utf8'
    );
    assert.match(signals, /Confirmed by \{entry\.confirmationCount\} people/);
    assert.match(signals, /getSignalDefinition\(entry\.signalId\)/);
    assert.match(signals, /space-y-2/);
    assert.match(signals, /h-7 w-7/);
  });
});
