'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { validateNonNegotiables } from '@/lib/discovery/non-negotiables';

export async function saveNonNegotiables(input: unknown) {
  const value = validateNonNegotiables(input);
  if (!value) return { success: false, message: 'Choose valid non-negotiable options.' };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, message: 'Please sign in again.' };
  const { data, error } = await supabase.from('profile_preferences')
    .update({ non_negotiables: value }).eq('user_id', user.id)
    .select('non_negotiables').single();
  if (error || !data) return { success: false, message: 'Could not save your non-negotiables. Please try again.' };
  revalidatePath('/discovery');
  return { success: true, message: 'Non-negotiables saved.', value: validateNonNegotiables(data.non_negotiables)! };
}
