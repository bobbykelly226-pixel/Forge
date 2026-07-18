/**
 * Human-readable answer attribution for Important Alignment Factors.
 * Presentation only — does not affect Compatibility Engine scoring.
 */

import { labelForStructuredValue } from '@/lib/profile/structured-options';

import type { CompatibilityCategoryKey } from './types';

/** Ambiguous single-token enums must be resolved with categoryKey, not here. */
const KNOWN_PHRASE_LABELS: Record<string, string> = {
  trying_to_quit: 'I am trying to quit smoking',
  rarely: 'I drink rarely',
  socially: 'I drink socially',
  sober: 'I am sober',
  in_recovery: 'I am in recovery',
  prefer_not_to_say: 'Prefer not to say',
  no_pets: 'I do not have pets',
  marriage: 'Looking for marriage',
  serious_relationship: 'Looking for a serious relationship',
  intentional_dating: 'Looking for intentional dating',
  getting_to_know_someone: 'Looking to get to know someone',
  'a serious relationship': 'Looking for a serious relationship',
  'intentional dating': 'Looking for intentional dating',
  'getting to know someone': 'Looking to get to know someone',
  very_important: 'Faith is very important',
  important: 'Faith is important',
  somewhat_important: 'Faith is somewhat important',
  not_important: 'Faith is not important',
  // Evaluator-authored summaries → conversational first person
  'Wants children': 'I want children',
  'Does not want children': 'I do not want children',
  'Not open to partner with children': 'I am not open to a partner with children',
  'Has children': 'I have children',
  'Has pets': 'I have pets',
};

function looksLikeInternalId(value: string): boolean {
  if (value.startsWith('seed-') || value.startsWith('demo-')) return true;
  // UUID-shaped or opaque ids should never appear as a person label.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return true;
  }
  if (/^[0-9a-f]{16,}$/i.test(value)) return true;
  return false;
}

/**
 * Resolve the viewed profile's first-name attribution label.
 * Falls back gracefully without exposing internal ids.
 */
export function partnerSaidLabel(profileName?: string | null): string {
  const trimmed = profileName?.trim() ?? '';
  if (!trimmed || looksLikeInternalId(trimmed)) {
    return 'This profile said';
  }
  const firstName = trimmed.split(/\s+/)[0] ?? trimmed;
  if (!firstName || looksLikeInternalId(firstName)) {
    return 'This profile said';
  }
  return `${firstName} said`;
}

/** Signed-in user attribution — always "You". */
export function viewerSaidLabel(): string {
  return 'You said';
}

function humanizeByCategory(
  categoryKey: CompatibilityCategoryKey | undefined,
  raw: string
): string | null {
  switch (categoryKey) {
    case 'smoking': {
      const label = labelForStructuredValue('smoking', raw);
      if (label) {
        switch (raw) {
          case 'never':
            return 'I do not smoke';
          case 'occasionally':
            return 'I smoke occasionally';
          case 'regularly':
            return 'I smoke regularly';
          case 'trying_to_quit':
            return 'I am trying to quit smoking';
          default:
            return label;
        }
      }
      return null;
    }
    case 'drinking': {
      const normalized = raw === 'occasionally' ? 'rarely' : raw;
      const label = labelForStructuredValue('drinking', normalized);
      if (label) {
        switch (normalized) {
          case 'never':
            return 'I do not drink';
          case 'rarely':
            return 'I drink rarely';
          case 'socially':
            return 'I drink socially';
          case 'regularly':
            return 'I drink regularly';
          case 'in_recovery':
            return 'I am in recovery';
          default:
            return label;
        }
      }
      return null;
    }
    case 'pets': {
      if (raw === 'yes') return 'I have pets';
      if (raw === 'no' || raw === 'no_pets') return 'I do not have pets';
      if (raw === 'prefer_not_to_say') return 'Prefer not to say';
      return labelForStructuredValue('pets', raw);
    }
    case 'faith': {
      const importance = labelForStructuredValue('faith_importance', raw);
      if (importance) return `Faith is ${importance.toLowerCase()}`;
      const identity = labelForStructuredValue('faith_identity', raw);
      if (identity) return identity;
      return null;
    }
    case 'relationship_intention': {
      const goal = labelForStructuredValue('relationship_goal', raw);
      if (goal) return `Looking for ${goal.toLowerCase()}`;
      if (raw.startsWith('Looking for') || raw.startsWith('looking for')) {
        return raw.charAt(0).toUpperCase() + raw.slice(1);
      }
      if (raw.startsWith('a ') || raw.startsWith('getting ')) {
        return `Looking for ${raw}`;
      }
      return null;
    }
    case 'children_family': {
      const wants = labelForStructuredValue('children', raw);
      if (wants) {
        switch (raw) {
          case 'yes':
            return 'I want children';
          case 'no':
            return 'I do not want children';
          case 'open':
            return 'I am open to children';
          case 'unsure':
            return 'I am unsure about children';
          default:
            return wants;
        }
      }
      return null;
    }
    default:
      return null;
  }
}

/**
 * Convert an evaluator summary or seed answer into a human-readable label.
 * Never returns raw underscore enum keys when a better label exists.
 */
export function humanizeFactorAnswer(
  raw: string | undefined | null,
  categoryKey?: CompatibilityCategoryKey
): string | undefined {
  if (raw == null) return undefined;
  const value = raw.trim();
  if (!value) return undefined;

  // Prefer exact known conversational phrases before category heuristics.
  const known = KNOWN_PHRASE_LABELS[value] ?? KNOWN_PHRASE_LABELS[value.toLowerCase()];
  if (known) return known;

  const byCategory = humanizeByCategory(categoryKey, value);
  if (byCategory) return byCategory;

  // Already conversational seed/engine copy — keep as authored.
  if (value.includes(' ') && !value.includes('_')) {
    return value;
  }

  // Last resort: prettify snake_case without exposing the raw key style.
  if (value.includes('_')) {
    return value
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
