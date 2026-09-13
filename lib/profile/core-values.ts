/** One catalog for onboarding, editing and summaries. Legacy casing normalizes on read. */
export const CORE_VALUES_OPTIONS = [
  'Faith', 'Family', 'Integrity', 'Commitment', 'Communication', 'Emotional Maturity',
  'Loyalty', 'Respect', 'Personal Responsibility', 'Shared Goals', 'Service', 'Growth',
] as const;
export type CoreValueLabel = (typeof CORE_VALUES_OPTIONS)[number];
export const CORE_VALUES_GUIDANCE = 'Choose 3–5 values that matter most to you in a relationship.';

export function normalizeCoreValues(value: unknown): CoreValueLabel[] {
  if (!Array.isArray(value)) return [];
  const selected = new Set(value.filter((item): item is string => typeof item === 'string').map(item => item.trim().toLowerCase()));
  return CORE_VALUES_OPTIONS.filter(label => selected.has(label.toLowerCase()));
}

export function validCoreValues(value: unknown): boolean {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string' && CORE_VALUES_OPTIONS.some(label => label.toLowerCase() === item.trim().toLowerCase()))) return false;
  const count = normalizeCoreValues(value).length;
  return count >= 3 && count <= 5;
}

export function toggleCoreValue(values: string[], value: string): string[] {
  if (values.includes(value)) return values.filter(item => item !== value);
  if (values.length >= 5) return values;
  return normalizeCoreValues([...values, value]);
}
