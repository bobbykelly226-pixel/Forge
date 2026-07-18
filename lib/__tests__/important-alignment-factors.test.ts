import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  evaluateCompatibility,
  humanizeFactorAnswer,
  partnerSaidLabel,
  personFromSeedCompatibilityFields,
  toAlignmentPresentation,
  viewerSaidLabel,
} from '@/lib/compatibility';
import { SEED_DEMO_VIEWER } from '@/lib/compatibility/seed-viewer';
import { getSeedProfileById } from '@/lib/seed/catalog';
import { toSeedAlignmentPresentation } from '@/lib/seed/adapters';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Important Alignment Factors answer attribution', () => {
  it('labels the signed-in answer as “You said”', () => {
    assert.equal(viewerSaidLabel(), 'You said');
  });

  it('uses the viewed profile’s first name for partner attribution', () => {
    assert.equal(partnerSaidLabel('Amanda'), 'Amanda said');
    assert.equal(partnerSaidLabel('Sarah Bennett'), 'Sarah said');
    assert.equal(partnerSaidLabel('Natalie'), 'Natalie said');
    assert.equal(partnerSaidLabel('Kristin'), 'Kristin said');
  });

  it('falls back gracefully without exposing internal ids', () => {
    assert.equal(partnerSaidLabel(undefined), 'This profile said');
    assert.equal(partnerSaidLabel(''), 'This profile said');
    assert.equal(partnerSaidLabel('   '), 'This profile said');
    assert.equal(partnerSaidLabel('seed-amanda-cole'), 'This profile said');
    assert.equal(partnerSaidLabel('demo-discovery-1'), 'This profile said');
    assert.equal(
      partnerSaidLabel('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
      'This profile said'
    );
  });

  it('drawer source uses personalized said labels and required sections', () => {
    const source = read('components/ImportantAlignmentFactorsDrawer.tsx');
    assert.match(source, /viewerSaidLabel/);
    assert.match(source, /partnerSaidLabel/);
    assert.match(source, /const youSaid = viewerSaidLabel\(\)/);
    assert.match(source, /const theySaid = partnerSaidLabel\(profileName\)/);
    assert.match(source, /\{youSaid\}/);
    assert.match(source, /\{theySaid\}/);
    assert.match(source, /Answer context/);
    assert.match(source, /Why this matters/);
    assert.match(source, /What this does not mean/);
    assert.match(source, /A conversation worth having/);
    assert.match(source, /Review my answer/);
    assert.match(source, /Return to Profile/);
    assert.doesNotMatch(source, /One person/);
    assert.doesNotMatch(source, /The other person/);
    assert.doesNotMatch(source, /Person A/);
    assert.doesNotMatch(source, /Person B/);
    // Answer rows must not use bare "You" / bare name without "said"
    assert.doesNotMatch(
      source,
      /tracking-\[0\.12em\] text-\[#8A93A0\]">\s*\{profileName\}\s*</
    );
    assert.doesNotMatch(
      source,
      /tracking-\[0\.12em\] text-\[#8A93A0\]">\s*You\s*</
    );
  });

  it('ProfileAlignmentSections keeps Review my answer available', () => {
    const source = read('components/discovery/ProfileAlignmentSections.tsx');
    assert.match(source, /reviewAnswerHref="\/onboarding"/);
    assert.doesNotMatch(source, /hideReviewAnswerLink/);
  });
});

describe('human-readable factor answers', () => {
  it('converts enum keys instead of showing raw database values', () => {
    assert.equal(humanizeFactorAnswer('never', 'smoking'), 'I do not smoke');
    assert.equal(humanizeFactorAnswer('regularly', 'smoking'), 'I smoke regularly');
    assert.equal(humanizeFactorAnswer('never', 'drinking'), 'I do not drink');
    assert.equal(humanizeFactorAnswer('socially', 'drinking'), 'I drink socially');
    assert.equal(humanizeFactorAnswer('yes', 'pets'), 'I have pets');
    assert.equal(humanizeFactorAnswer('no', 'pets'), 'I do not have pets');
    assert.equal(
      humanizeFactorAnswer('very_important', 'faith'),
      'Faith is very important'
    );
    assert.equal(
      humanizeFactorAnswer('serious_relationship', 'relationship_intention'),
      'Looking for a serious relationship'
    );
    assert.doesNotMatch(humanizeFactorAnswer('never', 'smoking') ?? '', /_/);
  });

  it('preserves already human-readable seed answers', () => {
    assert.equal(
      humanizeFactorAnswer('Faith is an important relationship value'),
      'Faith is an important relationship value'
    );
    assert.equal(
      humanizeFactorAnswer('Does not want additional biological children'),
      'Does not want additional biological children'
    );
  });

  it('assigns viewer and partner answers to the correct people without swapping', () => {
    const viewer = personFromSeedCompatibilityFields({
      ...SEED_DEMO_VIEWER,
      children: 'yes',
    });
    const partner = personFromSeedCompatibilityFields({
      id: 'seed-test-partner',
      firstName: 'Amanda',
      relationshipGoal: 'serious_relationship',
      faithImportance: 'important',
      faithIdentity: 'christian',
      children: 'no',
      hasChildren: 'no',
      openToPartnerWithChildren: 'yes',
      pets: 'no',
      smoking: 'never',
      smokingPartnerPreferences: ['does_not_use'],
      drinking: 'rarely',
      drinkingPartnerPreferences: ['does_not_drink', 'drinks_rarely', 'drinks_socially'],
    });
    const result = evaluateCompatibility(viewer, partner);
    const children = result.importantDifferences.find(
      (item) => item.categoryKey === 'children_family'
    );
    assert.ok(children, 'expected a children important difference');
    // Viewer wants children; partner does not — must not be swapped.
    assert.equal(children!.viewerAnswer, 'Wants children');
    assert.equal(children!.partnerAnswer, 'Does not want children');

    const presentation = toAlignmentPresentation(result);
    const factor = presentation.importantFactors.find((item) =>
      item.title.toLowerCase().includes('children')
    );
    assert.ok(factor);
    assert.equal(factor!.viewerAnswer, 'I want children');
    assert.equal(factor!.partnerAnswer, 'I do not want children');
  });

  it('renders seeded profile names and human answers for Natalie smoking', () => {
    const natalie = getSeedProfileById('seed-natalie-kim');
    assert.ok(natalie);
    assert.equal(partnerSaidLabel(natalie!.firstName), 'Natalie said');
    const presentation = toSeedAlignmentPresentation(natalie!);
    const smoking = presentation.importantFactors.find((factor) =>
      factor.title.toLowerCase().includes('smoking')
    );
    assert.ok(smoking, 'expected a smoking important factor for Natalie');
    assert.ok(smoking!.viewerAnswer);
    assert.ok(smoking!.partnerAnswer);
    assert.doesNotMatch(smoking!.viewerAnswer!, /_/);
    assert.doesNotMatch(smoking!.partnerAnswer!, /_/);
    // Demo viewer never smokes; Natalie smokes regularly — answers must not swap.
    assert.match(smoking!.viewerAnswer!.toLowerCase(), /do not smoke/);
    assert.match(smoking!.partnerAnswer!.toLowerCase(), /regularly/);
  });

  it('renders seeded Amanda first-name attribution correctly', () => {
    const amanda = getSeedProfileById('seed-amanda-cole');
    assert.ok(amanda);
    assert.equal(partnerSaidLabel(amanda!.firstName), 'Amanda said');
  });

  it('live-style profile names use first name only', () => {
    assert.equal(partnerSaidLabel('Sarah Bennett'), 'Sarah said');
    assert.equal(partnerSaidLabel('Member'), 'Member said');
  });
});
