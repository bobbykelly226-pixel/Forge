import {
  MAX_THING_I_ENJOY_LENGTH,
  MAX_THINGS_I_ENJOY,
} from '@/lib/types/profile-answers';

export function normalizeThingsIEnjoy(raw: string | string[]): string[] {
  const chunks = Array.isArray(raw) ? raw : [raw];
  const normalized = chunks
    .flatMap((chunk) => chunk.split(/\r?\n|,/))
    .map((item) => item.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .map((item) => item.slice(0, MAX_THING_I_ENJOY_LENGTH));

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of normalized) {
    const key = item.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= MAX_THINGS_I_ENJOY) break;
  }
  return unique;
}
