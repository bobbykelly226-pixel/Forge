/**
 * Schema-aligned Supabase Database types for the Forge Backend Foundation.
 *
 * Source of truth: supabase/migrations/20260714000000_forge_backend_foundation.sql
 * (plus prior V1 migrations for profiles / compatibility_answers).
 *
 * STATUS: These types were authored from the migration SQL because this
 * environment is not linked to a remote Supabase project. After applying the
 * migration remotely, regenerate with `npm run supabase:types` and replace
 * this file with the CLI output.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'hidden'
  | 'deactivated';

export type AnswerVisibility = 'private' | 'shared_with_matches' | 'public_summary';

export type PhotoModerationStatus = 'pending' | 'approved' | 'rejected';

export type InterestStatus = 'pending' | 'mutual' | 'withdrawn';

export type OpenToChatStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export type ConnectionSource = 'mutual_interest' | 'open_to_chat';

export type ConnectionStatus = 'active' | 'ended';

export type CharacterSignalStatus = 'pending' | 'approved' | 'declined';

export type CharacterSignalInteraction = 'in_app' | 'in_person';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          age: number | null;
          location: string | null;
          relationship_goal: string | null;
          faith_importance: string | null;
          service_background: string | null;
          short_bio: string | null;
          profile_photo_url: string | null;
          more_about: string | null;
          children: string | null;
          has_children: string | null;
          education: string | null;
          pets: string | null;
          smoking: string | null;
          drinking: string | null;
          career: string | null;
          relocation: string | null;
          things_i_enjoy: string[];
          favorite_music_artists: string[];
          favorite_music_songs: string[];
          status: ProfileStatus;
          is_discoverable: boolean;
          onboarding_completed_at: string | null;
          profile_completed_at: string | null;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          age?: number | null;
          location?: string | null;
          relationship_goal?: string | null;
          faith_importance?: string | null;
          service_background?: string | null;
          short_bio?: string | null;
          profile_photo_url?: string | null;
          more_about?: string | null;
          children?: string | null;
          has_children?: string | null;
          education?: string | null;
          pets?: string | null;
          smoking?: string | null;
          drinking?: string | null;
          career?: string | null;
          relocation?: string | null;
          things_i_enjoy?: string[];
          favorite_music_artists?: string[];
          favorite_music_songs?: string[];
          status?: ProfileStatus;
          is_discoverable?: boolean;
          onboarding_completed_at?: string | null;
          profile_completed_at?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          age?: number | null;
          location?: string | null;
          relationship_goal?: string | null;
          faith_importance?: string | null;
          service_background?: string | null;
          short_bio?: string | null;
          profile_photo_url?: string | null;
          more_about?: string | null;
          children?: string | null;
          has_children?: string | null;
          education?: string | null;
          pets?: string | null;
          smoking?: string | null;
          drinking?: string | null;
          career?: string | null;
          relocation?: string | null;
          things_i_enjoy?: string[];
          favorite_music_artists?: string[];
          favorite_music_songs?: string[];
          status?: ProfileStatus;
          is_discoverable?: boolean;
          onboarding_completed_at?: string | null;
          profile_completed_at?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_private_details: {
        Row: {
          user_id: string;
          date_of_birth: string | null;
          postal_code: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date_of_birth?: string | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          date_of_birth?: string | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_private_details_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_preferences: {
        Row: {
          user_id: string;
          gender_identity: string | null;
          interested_in: string[];
          preferred_age_min: number | null;
          preferred_age_max: number | null;
          max_distance_miles: number | null;
          discovery_enabled: boolean;
          open_to_chat_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          gender_identity?: string | null;
          interested_in?: string[];
          preferred_age_min?: number | null;
          preferred_age_max?: number | null;
          max_distance_miles?: number | null;
          discovery_enabled?: boolean;
          open_to_chat_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          gender_identity?: string | null;
          interested_in?: string[];
          preferred_age_min?: number | null;
          preferred_age_max?: number | null;
          max_distance_miles?: number | null;
          discovery_enabled?: boolean;
          open_to_chat_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_answers: {
        Row: {
          id: string;
          user_id: string;
          question_key: string;
          answer: Json;
          importance_level: number | null;
          is_non_negotiable: boolean;
          visibility: AnswerVisibility;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_key: string;
          answer: Json;
          importance_level?: number | null;
          is_non_negotiable?: boolean;
          visibility?: AnswerVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_key?: string;
          answer?: Json;
          importance_level?: number | null;
          is_non_negotiable?: boolean;
          visibility?: AnswerVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_answers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_photos: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          display_order: number;
          is_primary: boolean;
          moderation_status: PhotoModerationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          display_order: number;
          is_primary?: boolean;
          moderation_status?: PhotoModerationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          storage_path?: string;
          display_order?: number;
          is_primary?: boolean;
          moderation_status?: PhotoModerationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_photos_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_app_state: {
        Row: {
          user_id: string;
          onboarding_step: string | null;
          onboarding_completed: boolean;
          open_to_chat_education_seen: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          onboarding_step?: string | null;
          onboarding_completed?: boolean;
          open_to_chat_education_seen?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          onboarding_step?: string | null;
          onboarding_completed?: boolean;
          open_to_chat_education_seen?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_app_state_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_profiles: {
        Row: {
          id: string;
          saver_id: string;
          saved_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          saver_id: string;
          saved_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          saver_id?: string;
          saved_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_profiles_saver_id_fkey';
            columns: ['saver_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_profiles_saved_id_fkey';
            columns: ['saved_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      passed_profiles: {
        Row: {
          id: string;
          passer_id: string;
          passed_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          passer_id: string;
          passed_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          passer_id?: string;
          passed_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'passed_profiles_passer_id_fkey';
            columns: ['passer_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passed_profiles_passed_id_fkey';
            columns: ['passed_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      interests: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          status: InterestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          status?: InterestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          status?: InterestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interests_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interests_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      open_to_chat_requests: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          note: string | null;
          status: OpenToChatStatus;
          expires_at: string | null;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          note?: string | null;
          status?: OpenToChatStatus;
          expires_at?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          note?: string | null;
          status?: OpenToChatStatus;
          expires_at?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'open_to_chat_requests_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'open_to_chat_requests_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      connections: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          source: ConnectionSource;
          status: ConnectionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          source: ConnectionSource;
          status?: ConnectionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_a_id?: string;
          user_b_id?: string;
          source?: ConnectionSource;
          status?: ConnectionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connections_user_a_id_fkey';
            columns: ['user_a_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'connections_user_b_id_fkey';
            columns: ['user_b_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      character_signals: {
        Row: {
          id: string;
          giver_id: string;
          receiver_id: string;
          signal_key: string;
          interaction_type: CharacterSignalInteraction | null;
          interaction_context: string | null;
          status: CharacterSignalStatus;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          giver_id: string;
          receiver_id: string;
          signal_key: string;
          interaction_type?: CharacterSignalInteraction | null;
          interaction_context?: string | null;
          status?: CharacterSignalStatus;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          giver_id?: string;
          receiver_id?: string;
          signal_key?: string;
          interaction_type?: CharacterSignalInteraction | null;
          interaction_context?: string | null;
          status?: CharacterSignalStatus;
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'character_signals_giver_id_fkey';
            columns: ['giver_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'character_signals_receiver_id_fkey';
            columns: ['receiver_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      compatibility_answers: {
        Row: {
          id: string;
          user_id: string;
          question_key: string;
          answer_value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_key: string;
          answer_value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_key?: string;
          answer_value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'compatibility_answers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: {
      profile_status: ProfileStatus;
      answer_visibility: AnswerVisibility;
      photo_moderation_status: PhotoModerationStatus;
      interest_status: InterestStatus;
      open_to_chat_status: OpenToChatStatus;
      connection_source: ConnectionSource;
      connection_status: ConnectionStatus;
      character_signal_status: CharacterSignalStatus;
      character_signal_interaction: CharacterSignalInteraction;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
