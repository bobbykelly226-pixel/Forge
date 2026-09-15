import { FAITH_IDENTITY_VALUES } from '@/lib/profile/structured-options';

export type NonNegotiables = { smokeFree: boolean; faith: string[]; children: string[] };
export const EMPTY_NON_NEGOTIABLES: NonNegotiables = { smokeFree: false, faith: [], children: [] };
export function validateNonNegotiables(input: unknown): NonNegotiables | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const v = input as Record<string, unknown>;
  if (Object.keys(v).some(k => !['smokeFree', 'faith', 'children'].includes(k))) return null;
  if (typeof v.smokeFree !== 'boolean') return null;
  const valid = (items: unknown, allowed: readonly string[]): items is string[] =>
    Array.isArray(items) && items.length <= allowed.length && items.every(x => typeof x === 'string' && allowed.includes(x));
  if (!valid(v.faith, FAITH_IDENTITY_VALUES.filter(x => x !== 'prefer_not_to_say')) || !valid(v.children, ['yes', 'no', 'open', 'unsure'])) return null;
  return { smokeFree: v.smokeFree, faith: [...new Set(v.faith)], children: [...new Set(v.children)] };
}
export function countNonNegotiables(value: NonNegotiables): number {
  return Number(value.smokeFree) + Number(value.faith.length > 0) + Number(value.children.length > 0);
}
