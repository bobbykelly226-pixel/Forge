'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseRelationshipPreferences } from '@/lib/profile/relationship-preferences';

export async function saveRelationshipPreferences(form: FormData) {
  const value = parseRelationshipPreferences(form);
  if (!value) return { success: false, message: 'Choose a valid relationship goal and preferences.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Please sign in to save your preferences.' };
  const { error } = await supabase.rpc('save_my_relationship_preferences', {
    p_primary: value.primary, p_also: value.also, p_pace: value.pace,
  });
  if (error) return { success: false, message: 'Your preferences could not be saved. Please try again.' };
  for (const path of ['/profile', '/profile/preview', '/discovery', '/connections', '/onboarding']) revalidatePath(path);
  return { success: true, message: 'Relationship preferences saved.', profile: {
    relationship_goal: value.primary, relationship_goals: [value.primary, ...value.also], relationship_pace: value.pace,
  } };
}
