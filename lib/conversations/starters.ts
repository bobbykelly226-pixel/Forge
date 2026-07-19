/**
 * Deterministic conversation starters grounded in stored profile / compatibility data.
 * Never fabricates interests. Never turns hard boundaries into playful prompts.
 */

import type { ConversationStarter } from './types';

export type StarterInput = {
  peerFirstName: string;
  thingsIEnjoy?: string[] | null;
  career?: string | null;
  relocation?: string | null;
  sharedStrengthCopies?: string[];
  viewerThingsIEnjoy?: string[] | null;
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function sharedInterests(
  viewer: string[] | null | undefined,
  peer: string[] | null | undefined
): string[] {
  const viewerSet = new Set((viewer ?? []).map(normalizeToken).filter(Boolean));
  const shared: string[] = [];
  for (const item of peer ?? []) {
    const token = normalizeToken(item);
    if (!token || !viewerSet.has(token)) continue;
    if (!shared.some((existing) => normalizeToken(existing) === token)) {
      shared.push(item.trim());
    }
  }
  return shared;
}

/**
 * Build up to 3 optional starters. Empty when data is insufficient.
 * Order is deterministic for the same inputs.
 */
export function buildConversationStarters(input: StarterInput): ConversationStarter[] {
  const name = input.peerFirstName?.trim() || 'them';
  const starters: ConversationStarter[] = [];
  const shared = sharedInterests(input.viewerThingsIEnjoy, input.thingsIEnjoy);

  for (const interest of shared.slice(0, 2)) {
    starters.push({
      id: `shared-interest-${normalizeToken(interest).replace(/\s+/g, '-')}`,
      text: `I noticed we both enjoy ${interest}. What drew you to that?`,
    });
  }

  const peerInterests = (input.thingsIEnjoy ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !shared.some((s) => normalizeToken(s) === normalizeToken(item)));

  if (starters.length < 3 && peerInterests[0]) {
    starters.push({
      id: `peer-interest-${normalizeToken(peerInterests[0]).replace(/\s+/g, '-')}`,
      text: `${name}, I’d like to hear more about ${peerInterests[0]} in your life.`,
    });
  }

  const career = input.career?.trim();
  if (starters.length < 3 && career) {
    starters.push({
      id: 'career',
      text: `What do you enjoy most about your work as ${career.toLowerCase().startsWith('a ') || career.toLowerCase().startsWith('an ') ? career : `a ${career}`}?`,
    });
  }

  const strength = (input.sharedStrengthCopies ?? []).find((copy) => {
    const lower = copy.toLowerCase();
    return (
      !lower.includes('dealbreaker') &&
      !lower.includes('important difference') &&
      !lower.includes('boundary') &&
      copy.trim().length > 0
    );
  });
  if (starters.length < 3 && strength) {
    starters.push({
      id: 'shared-strength',
      text: `It looks like we may share some common ground around how we approach relationships. What feels most important to you early on?`,
    });
  }

  const relocation = input.relocation?.trim();
  if (
    starters.length < 3 &&
    relocation &&
    !['prefer_not_to_say', 'no', 'not_open'].includes(normalizeToken(relocation).replace(/\s+/g, '_'))
  ) {
    if (['open', 'possibly', 'yes', 'willing'].some((token) => normalizeToken(relocation).includes(token))) {
      starters.push({
        id: 'relocation',
        text: `If a relationship became serious, how do you think about location and building a life together?`,
      });
    }
  }

  // Deduplicate by text; keep stable id order.
  const seen = new Set<string>();
  return starters
    .filter((starter) => {
      const key = starter.text;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}
