import { createClient } from '@/lib/supabase/server';
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/lib/supabase/database.types';
import { OWNER_EDITABLE_PROFILE_COLUMNS } from '@/lib/data-model-rules';
import { logSupabaseError } from '@/lib/supabase/log-error';

export type DataAccessError = {
  success: false;
  message: string;
  /** Authoritative database/business code when present (e.g. stale_revision). */
  code?: string;
  /**
   * True when the failure may be a lost/transport response after a write.
   * False when the database returned an authoritative {ok:false} payload.
   */
  transportError?: boolean;
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

type PrivateDetailsUpsertFields = Partial<
  Pick<
    TablesUpdate<'profile_private_details'>,
    | 'date_of_birth'
    | 'postal_code'
    | 'latitude'
    | 'longitude'
    | 'location_city'
    | 'location_region'
    | 'location_country'
    | 'location_place_id'
    | 'location_provider'
  >
>;

/** Upsert owner-only private details for the authenticated user. */
export async function upsertCurrentUserPrivateDetails(
  fields: PrivateDetailsUpsertFields
): Promise<DataAccessResult<Tables<'profile_private_details'>>> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const payload: TablesInsert<'profile_private_details'> = {
    user_id: ctx.user.id,
    ...fields,
  };

  const { data, error } = await ctx.supabase
    .from('profile_private_details')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('upsertCurrentUserPrivateDetails:', error.message);
    return { success: false, message: 'Could not save private profile details.' };
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

type PreferencesUpsertFields = Pick<
  TablesUpdate<'profile_preferences'>,
  | 'gender_identity'
  | 'interested_in'
  | 'preferred_age_min'
  | 'preferred_age_max'
  | 'max_distance_miles'
>;

/** Upsert the authenticated member's private matching preferences. */
export async function upsertCurrentUserPreferences(
  fields: PreferencesUpsertFields
): Promise<DataAccessResult<Tables<'profile_preferences'>>> {
  const ctx = await requireUserWithFoundation();
  if (ctx.authError || !ctx.user) {
    return { success: false, message: 'You must be signed in.' };
  }
  if (ctx.foundationError) {
    return { success: false, message: ctx.foundationMessage };
  }

  const { data, error } = await ctx.supabase
    .from('profile_preferences')
    .update(fields)
    .eq('user_id', ctx.user.id)
    .select('*')
    .single();

  if (error) {
    console.error('upsertCurrentUserPreferences:', error.message);
    return { success: false, message: 'Could not save matching preferences.' };
  }

  return { success: true, data };
}

/** Current user's pro…19638 tokens truncated…  Returns: number
      }
      end_connection: { Args: { p_connection_id: string }; Returns: Json }
      ensure_conversation_for_connection: {
        Args: { p_connection_id: string }
        Returns: Json
      }
      ensure_foundational_user_records: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      forge_active_questionnaire_version_id: { Args: never; Returns: string }
      forge_can_access_conversation_attachments: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      forge_can_access_conversation_history: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      forge_create_notification: {
        Args: {
          p_actor_user_id: string
          p_body: string
          p_destination_path: string
          p_entity_id: string
          p_entity_type: Database["public"]["Enums"]["notification_entity_type"]
          p_notification_type: Database["public"]["Enums"]["notification_type"]
          p_recipient_user_id: string
        }
        Returns: string
      }
      forge_ensure_connection: {
        Args: {
          p_source: Database["public"]["Enums"]["connection_source"]
          p_user_1: string
          p_user_2: string
        }
        Returns: string
      }
      forge_ensure_questionnaire_progress: {
        Args: { p_user_id: string; p_version_id: string }
        Returns: undefined
      }
      forge_is_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      has_current_legal_acceptance: { Args: never; Returns: boolean }
      forge_map_legacy_profile_row: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: {
          age: number | null
          career: string | null
          children: string | null
          children_count: string | null
          created_at: string
          drinking: string | null
          drinking_partner_preferences: string[]
          education: string | null
          education_other: string | null
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[]
          favorite_music_genres: string[]
          favorite_music_meaningful_song: string | null
          favorite_music_other: string | null
          favorite_music_songs: string[]
          full_name: string | null
          has_children: string | null
          id: string
          is_discoverable: boolean
          last_active_at: string | null
          location: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          more_about: string | null
          onboarding_completed_at: string | null
          open_to_partner_with_children: string | null
          pets: string | null
          pets_allergy_constraint: boolean | null
          pets_allergy_types: string[]
          pets_partner_preferences: string[]
          pets_types: string[]
          profile_completed_at: string | null
          profile_photo_url: string | null
          relationship_goal: string | null
          relationship_goals: string[]
          relationship_pace: string | null
          relocation: string | null
          service_background: string | null
          service_background_other: string | null
          service_backgrounds: string[]
          short_bio: string | null
          smoking: string | null
          smoking_partner_preferences: string[]
          smoking_product_other: string | null
          smoking_product_types: string[]
          status: Database["public"]["Enums"]["profile_status"]
          things_i_enjoy: string[]
          unmapped_legacy_fields: Json
          updated_at: string
        }
        SetofOptions: {
          from: "profiles"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      forge_normalize_token: { Args: { raw: string }; Returns: string }
      forge_notification_actor_first_name: {
        Args: { p_user_id: string }
        Returns: string
      }
      forge_order_pair: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: {
          user_a_id: string
          user_b_id: string
        }[]
      }
      forge_question_currently_eligible: {
        Args: { p_question_id: string; p_user_id: string }
        Returns: boolean
      }
      forge_questionnaire_alignment_pair: {
        Args: {
          p_partner_id: string
          p_version_key?: string
          p_viewer_id: string
        }
        Returns: Json
      }
      forge_questionnaire_resolve_operation: {
        Args: {
          p_fingerprint: string
          p_operation_id: string
          p_operation_kind: string
          p_question_id: string
          p_target_key: string
          p_user_id: string
          p_version_id: string
        }
        Returns: Json
      }
      forge_questionnaire_response_is_complete: {
        Args: { p_response_id: string }
        Returns: boolean
      }
      forge_recalculate_questionnaire_progress: {
        Args: { p_user_id: string; p_version_id: string }
        Returns: undefined
      }
      forge_user_open_to_parenting_or_stepparenting_role: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      forge_users_blocked: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      give_character_signal: {
        Args: {
          p_interaction_type: Database["public"]["Enums"]["character_signal_interaction"]
          p_receiver_id: string
          p_signal_key: string
        }
        Returns: Json
      }
      get_conversation_attachment_access: {
        Args: { p_attachment_id: string }
        Returns: Json
      }
      get_conversation_thread_meta: {
        Args: { p_conversation_id: string }
        Returns: Json
      }
      get_eligible_discovery_profile: {
        Args: { p_profile_id: string }
        Returns: {
          age: number | null
          career: string | null
          children: string | null
          children_count: string | null
          drinking: string | null
          education: string | null
          education_other: string | null
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[] | null
          favorite_music_genres: string[] | null
          favorite_music_meaningful_song: string | null
          favorite_music_other: string | null
          favorite_music_songs: string[] | null
          full_name: string | null
          has_children: string | null
          id: string | null
          location: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          more_about: string | null
          open_to_partner_with_children: string | null
          pets: string | null
          pets_types: string[] | null
          profile_photo_url: string | null
          relationship_goal: string | null
          relationship_goals: string[] | null
          relationship_pace: string | null
          relocation: string | null
          service_background: string | null
          service_background_other: string | null
          service_backgrounds: string[] | null
          short_bio: string | null
          smoking: string | null
          things_i_enjoy: string[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "discoverable_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_conversation_messages: {
        Args: {
          p_before?: string
          p_before_id?: string
          p_conversation_id: string
          p_limit?: number
        }
        Returns: Json
      }
      list_my_character_signals: { Args: never; Returns: Json }
      list_public_character_signals: {
        Args: { p_receiver_ids: string[] }
        Returns: {
          confirmation_count: number
          receiver_id: string
          signal_key: string
        }[]
      }
      list_eligible_discovery_profiles: {
        Args: { p_limit?: number }
        Returns: {
          age: number | null
          career: string | null
          children: string | null
          children_count: string | null
          drinking: string | null
          education: string | null
          education_other: string | null
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[] | null
          favorite_music_genres: string[] | null
          favorite_music_meaningful_song: string | null
          favorite_music_other: string | null
          favorite_music_songs: string[] | null
          full_name: string | null
          has_children: string | null
          id: string | null
          location: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          more_about: string | null
          open_to_partner_with_children: string | null
          pets: string | null
          pets_types: string[] | null
          profile_photo_url: string | null
          relationship_goal: string | null
          relationship_goals: string[] | null
          relationship_pace: string | null
          relocation: string | null
          service_background: string | null
          service_background_other: string | null
          service_backgrounds: string[] | null
          short_bio: string | null
          smoking: string | null
          things_i_enjoy: string[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "discoverable_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_eligible_discovery_profile_photos: {
        Args: { p_profile_ids: string[] }
        Returns: {
          display_order: number
          id: string
          is_primary: boolean
          storage_path: string
          user_id: string
        }[]
      }
      list_my_conversations: { Args: never; Returns: Json }
      list_my_notifications: { Args: { p_limit?: number }; Returns: Json }
      load_connection_hub_profiles: {
        Args: { p_profile_ids: string[] }
        Returns: {
          age: number | null
          career: string | null
          children: string | null
          children_count: string | null
          drinking: string | null
          education: string | null
          service_background_other: string | null
          education_other: string | null
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[] | null
          favorite_music_genres: string[] | null
          favorite_music_meaningful_song: string | null
          favorite_music_other: string | null
          favorite_music_songs: string[] | null
          full_name: string | null
          has_children: string | null
          id: string | null
          location: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          more_about: string | null
          open_to_partner_with_children: string | null
          pets: string | null
          pets_types: string[] | null
          profile_photo_url: string | null
          relationship_goal: string | null
          relationship_goals: string[] | null
          relationship_pace: string | null
          relocation: string | null
          service_background: string | null
          service_backgrounds: string[] | null
          short_bio: string | null
          smoking: string | null
          things_i_enjoy: string[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "discoverable_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      load_my_questionnaire_state: {
        Args: { p_version_key?: string }
        Returns: Json
      }
      load_questionnaire_alignment_comparison: {
        Args: { p_partner_id: string; p_version_key?: string }
        Returns: Json
      }
      load_questionnaire_alignment_comparisons: {
        Args: { p_partner_ids: string[]; p_version_key?: string }
        Returns: Json
      }
      mark_all_notifications_read: { Args: never; Returns: Json }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: Json
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      mark_open_to_chat_education_seen: { Args: never; Returns: Json }
      pass_on_profile: { Args: { p_profile_id: string }; Returns: Json }
      profile_meets_discovery_requirements: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      remove_saved_profile: { Args: { p_profile_id: string }; Returns: Json }
      report_user: {
        Args: {
          p_conversation_id?: string
          p_details?: string
          p_evidence?: Json
          p_reason: Database["public"]["Enums"]["report_reason"]
          p_reported_user_id: string
        }
        Returns: Json
      }
      review_profile_photo: {
        Args: {
          p_decision: Database["public"]["Enums"]["photo_moderation_status"]
          p_operator_id: string
          p_photo_id: string
          p_rejection_reason?: string | null
        }
        Returns: boolean
      }
      respond_open_to_chat: {
        Args: { p_action: string; p_request_id: string }
        Returns: Json
      }
      unblock_user: {
        Args: { p_blocked_user_id: string }
        Returns: Json
      }
      save_my_questionnaire_progress_position: {
        Args: {
          p_category_key?: string
          p_expected_write_generation?: number
          p_phase?: string
          p_question_key?: string
          p_version_key: string
        }
        Returns: Json
      }
      save_my_questionnaire_response: {
        Args: {
          p_choice_contexts?: Json
          p_choice_keys: string[]
          p_expected_revision?: number
          p_expected_write_generation?: number
          p_identity?: Json
          p_operation_id: string
          p_priority_choice_keys?: string[]
          p_question_key: string
          p_version_key: string
        }
        Returns: Json
      }
      save_profile_for_later: { Args: { p_profile_id: string }; Returns: Json }
      send_conversation_message: {
        Args: {
          p_body: string
          p_client_message_id?: string
          p_conversation_id: string
        }
        Returns: Json
      }
      send_conversation_message_with_attachments: {
        Args: {
          p_attachments?: Json
          p_body: string
          p_client_message_id?: string
          p_conversation_id: string
        }
        Returns: Json
      }
      send_interest: { Args: { p_recipient_id: string }; Returns: Json }
      send_open_to_chat: {
        Args: { p_note?: string; p_recipient_id: string }
        Returns: Json
      }
      respond_my_character_signal: {
        Args: { p_signal_id: string; p_visibility: string }
        Returns: Json
      }
      set_my_character_signal_visibility: {
        Args: { p_is_public: boolean; p_signal_key: string }
        Returns: Json
      }
      set_my_discovery_visibility: {
        Args: { p_enabled: boolean }
        Returns: Json
      }
      record_safety_member_notification: {
        Args: {
          p_operator_id: string
          p_outcome: string
          p_report_id: string
          p_success: boolean
        }
        Returns: string
      }
      review_safety_report: {
        Args: {
          p_action: string
          p_notify_member?: boolean
          p_operator_id: string
          p_reason: string
          p_report_id: string
        }
        Returns: string
      }
      submit_safety_report_appeal: {
        Args: { p_details: string; p_report_id: string }
        Returns: string
      }
      withdraw_interest: { Args: { p_recipient_id: string }; Returns: Json }
    }
    Enums: {
      answer_visibility: "private" | "shared_with_matches" | "public_summary"
      beta_feedback_area:
        | "discovery"
        | "profile"
        | "compatibility_profile"
        | "connections_messaging"
        | "account_access"
        | "other"
      beta_feedback_category: "broken" | "confusing" | "support" | "idea"
      character_signal_interaction: "in_app" | "in_person"
      character_signal_status: "pending" | "approved" | "declined"
      connection_source: "mutual_interest" | "open_to_chat"
      connection_status: "active" | "ended"
      conversation_status: "active" | "ended"
      interest_status: "pending" | "mutual" | "withdrawn"
      notification_entity_type:
        | "message"
        | "conversation"
        | "connection"
        | "open_to_chat_request"
        | "interest"
      notification_type:
        | "new_message"
        | "mutual_connection"
        | "open_to_chat_received"
        | "open_to_chat_accepted"
        | "interest_received"
      open_to_chat_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "deferred"
      photo_moderation_status: "pending" | "approved" | "rejected"
      operator_report_case_status: "pending" | "reviewing" | "resolved" | "dismissed"
      profile_status: "draft" | "active" | "paused" | "hidden" | "deactivated"
      questionnaire_category_status: "locked" | "draft" | "preview"
      questionnaire_progress_status: "not_started" | "in_progress" | "completed"
      questionnaire_response_behavior:
        | "single_choice"
        | "multi_select"
        | "scale_range"
        | "scenario_choice"
        | "structured_identity"
      questionnaire_response_qualifier:
        | "no_specific_requirement"
        | "limited_openness"
        | "evaluation_preference"
        | "limited_capacity_contribution"
      questionnaire_response_state:
        | "answered"
        | "unanswered"
        | "skipped"
        | "withheld"
        | "inapplicable"
        | "no_preference"
        | "context_dependent"
        | "limited_capacity"
        | "not_currently_relevant"
        | "current_priority"
        | "no_specific_requirement"
      report_reason:
        | "unwanted_behavior"
        | "harassment"
        | "fake_profile"
        | "inappropriate_content"
        | "safety_concern"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      answer_visibility: ["private", "shared_with_matches", "public_summary"],
      beta_feedback_area: [
        "discovery",
        "profile",
        "compatibility_profile",
        "connections_messaging",
        "account_access",
        "other",
      ],
      beta_feedback_category: ["broken", "confusing", "support", "idea"],
      character_signal_interaction: ["in_app", "in_person"],
      character_signal_status: ["pending", "approved", "declined"],
      connection_source: ["mutual_interest", "open_to_chat"],
      connection_status: ["active", "ended"],
      conversation_status: ["active", "ended"],
      interest_status: ["pending", "mutual", "withdrawn"],
      notification_entity_type: [
        "message",
        "conversation",
        "connection",
        "open_to_chat_request",
        "interest",
      ],
      notification_type: [
        "new_message",
        "mutual_connection",
        "open_to_chat_received",
        "open_to_chat_accepted",
        "interest_received",
      ],
      open_to_chat_status: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "deferred",
      ],
      photo_moderation_status: ["pending", "approved", "rejected"],
      operator_report_case_status: ["pending", "reviewing", "resolved", "dismissed"],
      profile_status: ["draft", "active", "paused", "hidden", "deactivated"],
      questionnaire_category_status: ["locked", "draft", "preview"],
      questionnaire_progress_status: [
        "not_started",
        "in_progress",
        "completed",
      ],
      questionnaire_response_behavior: [
        "single_choice",
        "multi_select",
        "scale_range",
        "scenario_choice",
        "structured_identity",
      ],
      questionnaire_response_qualifier: [
        "no_specific_requirement",
        "limited_openness",
        "evaluation_preference",
        "limited_capacity_contribution",
      ],
      questionnaire_response_state: [
        "answered",
        "unanswered",
        "skipped",
        "withheld",
        "inapplicable",
        "no_preference",
        "context_dependent",
        "limited_capacity",
        "not_currently_relevant",
        "current_priority",
        "no_specific_requirement",
      ],
      report_reason: [
        "unwanted_behavior",
        "harassment",
        "fake_profile",
        "inappropriate_content",
        "safety_concern",
        "other",
      ],
    },
  },
} as const
