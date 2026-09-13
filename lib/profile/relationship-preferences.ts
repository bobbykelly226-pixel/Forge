import { RELATIONSHIP_GOAL_OPTIONS } from './structured-options';
import { mapLegacyRelationshipGoal } from './legacy-mapping';

/** Merge older scalar/alternative answers without losing a member's selections. */
export function relationshipGoals(primary: unknown, goals: unknown = []) {
  const values = [...(Array.isArray(primary) ? primary : [primary]), ...(Array.isArray(goals) ? goals : [])];
  const mapped = values.flatMap(value => {
    const goal = typeof value === 'string' ? mapLegacyRelationshipGoal(value).mapped : null;
    return goal ? [goal] : [];
  });
  return RELATIONSHIP_GOAL_OPTIONS.filter(option => mapped.includes(option.value)).map(option => option.value);
}

export function validRelationshipAnswer(value: unknown): boolean {
  const values = Array.isArray(value) ? value : [value];
  return values.length > 0 && values.every(item => typeof item === 'string' && Boolean(mapLegacyRelationshipGoal(item).mapped));
}

export function parseRelationshipPreferences(form: FormData) {
  const values = form.getAll('relationship_goals');
  if (!values.length || values.some(value => !RELATIONSHIP_GOAL_OPTIONS.some(option => option.value === value))) return null;
  return relationshipGoals(values);
}
