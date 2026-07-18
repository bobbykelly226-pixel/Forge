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
  it('keeps alignment reasons inside See Why You Align, not a permanent profile card', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/discovery/ProfileAlignmentSections.tsx'),
      'utf8'
    );
    assert.match(source, /See Why You Align/);
    assert.match(source, /Relationship Alignment/);
    assert.match(source, /Important Alignment Factors/);
    assert.doesNotMatch(source, /id="alignments-heading"/);
    assert.doesNotMatch(source, /whySurfacedExpanded/);
    assert.doesNotMatch(source, /More About/);
    assert.doesNotMatch(source, /Why Forge Introduced You/);
  });

  it('simplifies See Why You Align into a compact Alignments list', () => {
    const drawer = readFileSync(
      join(process.cwd(), 'components/AlignmentDetailsDrawer.tsx'),
      'utf8'
    );
    assert.match(drawer, /ALIGNMENTS_PREVIEW_COUNT = 3/);
    assert.match(drawer, /strongAlignment\.slice\(0, ALIGNMENTS_PREVIEW_COUNT\)/);
    assert.match(drawer, />\s*Alignments\s*</);
    assert.match(drawer, /\{alignmentsExpanded \? 'Show Less' : 'More'\}/);
    assert.doesNotMatch(drawer, /Why you align/);
    assert.doesNotMatch(drawer, /font-semibold text-\[#0B2D5C\]\}>\{item\.title\}/);
  });

  it('adds an accessible Character Signals information control on profiles', () => {
    const signals = readFileSync(
      join(process.cwd(), 'components/character-signals/PublicCharacterSignalsSection.tsx'),
      'utf8'
    );
    const infoDrawer = readFileSync(
      join(process.cwd(), 'components/character-signals/WhatAreCharacterSignalsDrawer.tsx'),
      'utf8'
    );
    assert.match(signals, /Learn about Character Signals/);
    assert.match(signals, /WhatAreCharacterSignalsDrawer/);
    assert.match(signals, /aria-haspopup="dialog"/);
    assert.match(infoDrawer, /What Are Character Signals\?/);
    assert.match(infoDrawer, /How They Work/);
    assert.match(infoDrawer, /additional independent confirmations/);
    assert.match(infoDrawer, /Return to Profile/);
  });

  it('keeps individual signal drawers signal-specific without system education', () => {
    const detail = readFileSync(
      join(process.cwd(), 'components/character-signals/CharacterSignalDetailDrawer.tsx'),
      'utf8'
    );
    assert.match(detail, /Confirmed by \{confirmationCount\} people/);
    assert.match(detail, /signal\.detailDescription/);
    assert.match(detail, /not a guarantee or rating/);
    assert.match(detail, /Return to Profile/);
    assert.doesNotMatch(detail, /How Character Signals work/);
    assert.doesNotMatch(detail, /recipient&apos;s approval/);
    assert.doesNotMatch(detail, /What this means/);
    assert.doesNotMatch(detail, /multiple meaningful interactions/);
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
