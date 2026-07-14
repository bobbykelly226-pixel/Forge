import { createClient } from '@/lib/supabase/server';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/lib/supabase/database.types';
import { OWNER_EDITABLE_PROFILE_COLUMNS } from '@/lib/data-model-rules';

export type DataAccessError = {
  success: false;
  message: string;
};

export type DataAccessSuccess<T> = {
  success: true;
  data: T;
};

export type DataAccessResult<T> = DataAccessSuccess<T> | DataAccessError;

type OwnerEditableProfileColumn =
  (typeof OWNER_EDITABLE_PROFILE_COLUMNS)[number];

type ProfileUpsertFields = Partial<
  Pick<TablesUpdate<'profiles'>, OwnerEditableProfileColumn>
>;

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null, authError: true as const };
  }

  return { supabase, user, authError: false as const };
}

/**
 * Idempotent repair for the four required one-to-one rows.
 * Safe to call on every authenticated data access.
 */
export async function ensureFoundationalRecords(): Promise<
  DataAccessResult<{
    user_id: string;
    missing_before: string[];
    created: string[];
    ok: boolean;
  }>
> {
  const { supabase, user, authError } = await requireAuthenticatedUser();
  if (authError || !user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data, error } = await supabase.rpc(
    'ensure_foundational_user_records',
    { p_user_id: user.id }
  );

  if (error) {
    console.error('ensureFoundationalRecords:', error.message);
    return {
      success: false,
      message: 'Could not verify your account records. Please try again.',
    };
  }

  const result = data as {
    user_id: string;
    missing_before: string[];
    created: string[];
    ok: boolean;
  };

  if (result.missing_before?.length) {
    console.warn(
      'ensureFoundationalRecords repaired missing rows',
      result.missing_before,
      'created',
      result.created
    );
  }

  return { success: true, data: result };
}

async function requireUserWithFoundation() {
  const auth = await requireAuthenticatedUser();
  if (auth.authError || !auth.user) {
    return {
      ...auth,
      foundationError: true as const,
      foundationMessage: 'You must be signed in.',
    };
  }

  const ensured = await ensureFoundationalRecords();
  if (!ensured.success) {
    return {
      supabase: auth.supabase,
      user: auth.user,
      authError: false as const,
      foundationError: true as const,
      foundationMessage: ensured.message,
    };
  }

  return {
    supabase: auth.supabase,
    user: auth.user,
    authError: false as const,
    foundationError: false as const,
    foundationMessage: null as null,
  };
}

/** Current user's public profile row. */
export async function getCurrentUserProfile(): Promise<
  DataAccessResult<Tables<'profiles'> | null>
> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const { data, error } = await ctx.supabase
    .from('profiles')
    .select('*')
    .eq('id', ctx.user.id)
    .maybeSingle();

  if (error) {
    console.error('getCurrentUserProfile:', error.message);
    return { success: false, message: 'Could not load your profile.' };
  }

  return { success: true, data };
}

/** Current user's private details (owner-only). */
export async function getCurrentUserPrivateDetails(): Promise<
  DataAccessResult<Tables<'profile_private_details'> | null>
> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const { data, error } = await ctx.supabase
    .from('profile_private_details')
    .select('*')
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  if (error) {
    console.error('getCurrentUserPrivateDetails:', error.message);
    return { success: false, message: 'Could not load private profile details.' };
  }

  return { success: true, data };
}

/** Current user's discovery preferences. */
export async function getCurrentUserPreferences(): Promise<
  DataAccessResult<Tables<'profile_preferences'> | null>
> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const { data, error } = await ctx.supabase
    .from('profile_preferences')
    .select('*')
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  if (error) {
    console.error('getCurrentUserPreferences:', error.message);
    return { success: false, message: 'Could not load profile preferences.' };
  }

  return { success: true, data };
}

/** Current user's profile questionnaire answers (profile_answers). */
export async function getCurrentUserProfileAnswers(): Promise<
  DataAccessResult<Tables<'profile_answers'>[]>
> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const { data, error } = await ctx.supabase
    .from('profile_answers')
    .select('*')
    .eq('user_id', ctx.user.id)
    .order('question_key', { ascending: true });

  if (error) {
    console.error('getCurrentUserProfileAnswers:', error.message);
    return { success: false, message: 'Could not load profile answers.' };
  }

  return { success: true, data: data ?? [] };
}

/** Current user's photos in display order. */
export async function getCurrentUserProfilePhotos(): Promise<
  DataAccessResult<Tables<'profile_photos'>[]>
> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const { data, error } = await ctx.supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', ctx.user.id)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('getCurrentUserProfilePhotos:', error.message);
    return { success: false, message: 'Could not load profile photos.' };
  }

  return { success: true, data: data ?? [] };
}

/**
 * Upsert the authenticated user's own editable profile fields.
 * System columns (status, ownership, completion stamps) are stripped.
 */
export async function upsertCurrentUserProfile(
  fields: ProfileUpsertFields
): Promise<DataAccessResult<Tables<'profiles'>>> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const safeFields: TablesUpdate<'profiles'> = {};
  for (const key of OWNER_EDITABLE_PROFILE_COLUMNS) {
    const value = fields[key];
    if (value !== undefined) {
      Object.assign(safeFields, { [key]: value });
    }
  }

  const payload: TablesInsert<'profiles'> = {
    id: ctx.user.id,
    ...safeFields,
  };

  const { data, error } = await ctx.supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.error('upsertCurrentUserProfile:', error.message);
    return { success: false, message: 'Could not save your profile.' };
  }

  return { success: true, data };
}

/**
 * Update onboarding progress for the authenticated user.
 */
export async function updateOnboardingProgress(input: {
  onboardingStep?: string | null;
  onboardingCompleted?: boolean;
}): Promise<DataAccessResult<Tables<'user_app_state'>>> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const updates: TablesInsert<'user_app_state'> = {
    user_id: ctx.user.id,
  };

  if (input.onboardingStep !== undefined) {
    updates.onboarding_step = input.onboardingStep;
  }
  if (input.onboardingCompleted !== undefined) {
    updates.onboarding_completed = input.onboardingCompleted;
  }

  const { data, error } = await ctx.supabase
    .from('user_app_state')
    .upsert(updates, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('updateOnboardingProgress:', error.message);
    return { success: false, message: 'Could not update onboarding progress.' };
  }

  if (input.onboardingCompleted === true) {
    const { error: profileError } = await ctx.supabase
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', ctx.user.id)
      .is('onboarding_completed_at', null);

    if (profileError) {
      console.error(
        'updateOnboardingProgress profile stamp:',
        profileError.message
      );
    }
  }

  return { success: true, data };
}

/** Whether the authenticated user has completed onboarding. */
export async function hasCompletedOnboarding(): Promise<
  DataAccessResult<boolean>
> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const { data, error } = await ctx.supabase
    .from('user_app_state')
    .select('onboarding_completed')
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  if (error) {
    console.error('hasCompletedOnboarding:', error.message);
    return { success: false, message: 'Could not check onboarding status.' };
  }

  return { success: true, data: Boolean(data?.onboarding_completed) };
}

/** Current user's app state row. */
export async function getCurrentUserAppState(): Promise<
  DataAccessResult<Tables<'user_app_state'> | null>
> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const { data, error } = await ctx.supabase
    .from('user_app_state')
    .select('*')
    .eq('user_id', ctx.user.id)
    .maybeSingle();

  if (error) {
    console.error('getCurrentUserAppState:', error.message);
    return { success: false, message: 'Could not load app state.' };
  }

  return { success: true, data };
}
