import type { CompatibilityEngineResult } from '@/lib/compatibility/types';

export type RankedCandidate<T> = { id: string; value: T; alignment: CompatibilityEngineResult | null };

function rotationKey(id: string, day: string): number {
  let hash = 2166136261;
  for (const char of `${day}:${id}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Rank the complete eligible pool before limiting; leave room to discover new members. */
export function rankDiscoveryCandidates<T>(candidates: RankedCandidate<T>[], limit = 50, day = new Date().toISOString().slice(0, 10)): RankedCandidate<T>[] {
  const known = candidates.filter(c => c.alignment && c.alignment.alignment.key !== 'not_enough_information');
  const unknown = candidates.filter(c => !c.alignment || c.alignment.alignment.key === 'not_enough_information');
  const tie = (a: RankedCandidate<T>, b: RankedCandidate<T>) => rotationKey(a.id, day) - rotationKey(b.id, day) || a.id.localeCompare(b.id);
  known.sort((a,b) => (b.alignment?.calculation.weightedScore ?? 0) - (a.alignment?.calculation.weightedScore ?? 0) || tie(a,b));
  unknown.sort(tie);
  const result: RankedCandidate<T>[] = [];
  let k=0; let u=0;
  while (result.length < limit && (k < known.length || u < unknown.length)) {
    const includeUnknown = u < unknown.length && (k >= known.length || result.length % 5 === 4);
    result.push(includeUnknown ? unknown[u++]! : known[k++]!);
  }
  return result;
}
