'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseRelationshipPreferences } from '@/lib/profile/relationship-preferences';

export async function saveRelationshipPreferences(form: FormData) {
  const value = parseRelationshipPreferences(form);
  if (!value) return { success: false, message: 'Select at least one relationship goal.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Please sign in to save your preferences.' };
  const { error } = await supabase.rpc('save_my_relationship_goals', {
    p_goals: value,
  });
  if (error) return { success: false, message: 'Your preferences could not be saved. Please try again.' };
  for (const path of ['/profile', '/profile/preview', '/discovery', '/connections', '/onboarding']) revalidatePath(path);
  return { success: true, message: 'Relationship preferences saved.', profile: {
    relationship_goal: value[0], relationship_goals: value,
  } };
}
