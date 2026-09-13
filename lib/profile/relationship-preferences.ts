import { RELATIONSHIP_GOAL_OPTIONS } from './structured-options';

export const RELATIONSHIP_DESTINATIONS = RELATIONSHIP_GOAL_OPTIONS.slice(0, 3);
export const RELATIONSHIP_PACE_OPTIONS = [
  { value: 'naturally', label: 'Let it develop naturally' },
  { value: 'slowly', label: 'Move slowly and build trust' },
  { value: 'ready', label: 'Ready to pursue commitment' },
] as const;

export function parseRelationshipPreferences(form: FormData) {
  const primary = String(form.get('relationship_goal') ?? '');
  const also = form.getAll('relationship_also_open_to').map(String);
  const pace = String(form.get('relationship_pace') ?? '');
  if (!RELATIONSHIP_GOAL_OPTIONS.some(x => x.value === primary) ||
      also.some(x => !RELATIONSHIP_DESTINATIONS.some(o => o.value === x)) ||
      (pace && !RELATIONSHIP_PACE_OPTIONS.some(x => x.value === pace))) return null;
  return { primary, also: [...new Set(also)].filter(x => x !== primary), pace: pace || null };
}
