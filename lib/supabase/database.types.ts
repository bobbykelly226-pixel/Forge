export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      character_signals: {
        Row: {
          created_at: string
          giver_id: string
          id: string
          interaction_context: string | null
          interaction_type:
            | Database["public"]["Enums"]["character_signal_interaction"]
            | null
          receiver_id: string
          responded_at: string | null
          signal_key: string
          status: Database["public"]["Enums"]["character_signal_status"]
        }
        Insert: {
          created_at?: string
          giver_id: string
          id?: string
          interaction_context?: string | null
          interaction_type?:
            | Database["public"]["Enums"]["character_signal_interaction"]
            | null
          receiver_id: string
          responded_at?: string | null
          signal_key: string
          status?: Database["public"]["Enums"]["character_signal_status"]
        }
        Update: {
          created_at?: string
          giver_id?: string
          id?: string
          interaction_context?: string | null
          interaction_type?:
            | Database["public"]["Enums"]["character_signal_interaction"]
            | null
          receiver_id?: string
          responded_at?: string | null
          signal_key?: string
          status?: Database["public"]["Enums"]["character_signal_status"]
        }
        Relationships: []
      }
      compatibility_answers: {
        Row: {
          answer_value: Json
          created_at: string
          id: string
          question_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_value: Json
          created_at?: string
          id?: string
          question_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_value?: Json
          created_at?: string
          id?: string
          question_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string
          id: string
          source: Database["public"]["Enums"]["connection_source"]
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source: Database["public"]["Enums"]["connection_source"]
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source?: Database["public"]["Enums"]["connection_source"]
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          recipient_user_id: string
          actor_user_id: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          body: string
          entity_type: Database["public"]["Enums"]["notification_entity_type"]
          entity_id: string
          destination_path: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_user_id: string
          actor_user_id?: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          body: string
          entity_type: Database["public"]["Enums"]["notification_entity_type"]
          entity_id: string
          destination_path: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_user_id?: string
          actor_user_id?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          body?: string
          entity_type?: Database["public"]["Enums"]["notification_entity_type"]
          entity_id?: string
          destination_path?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          last_message_at: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: true
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          client_message_id: string | null
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          client_message_id?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          client_message_id?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          conversation_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          choice: string
          comment: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          choice: string
          comment?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          choice?: string
          comment?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          status: Database["public"]["Enums"]["interest_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["interest_status"]
          updated_at?: string
        }
        Relationships: []
      }
      open_to_chat_requests: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          note: string | null
          recipient_id: string
          responded_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["open_to_chat_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          note?: string | null
          recipient_id: string
          responded_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["open_to_chat_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          note?: string | null
          recipient_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["open_to_chat_status"]
          updated_at?: string
        }
        Relationships: []
      }
      passed_profiles: {
        Row: {
          created_at: string
          id: string
          passed_id: string
          passer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          passed_id: string
          passer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          passed_id?: string
          passer_id?: string
        }
        Relationships: []
      }
      profile_answers: {
        Row: {
          answer: Json
          created_at: string
          id: string
          importance_level: number | null
          is_non_negotiable: boolean
          question_key: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["answer_visibility"]
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: string
          importance_level?: number | null
          is_non_negotiable?: boolean
          question_key: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["answer_visibility"]
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: string
          importance_level?: number | null
          is_non_negotiable?: boolean
          question_key?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["answer_visibility"]
        }
        Relationships: []
      }
      profile_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          moderation_status: Database["public"]["Enums"]["photo_moderation_status"]
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          is_primary?: boolean
          moderation_status?: Database["public"]["Enums"]["photo_moderation_status"]
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          moderation_status?: Database["public"]["Enums"]["photo_moderation_status"]
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_preferences: {
        Row: {
          created_at: string
          discovery_enabled: boolean
          gender_identity: string | null
          interested_in: string[]
          max_distance_miles: number | null
          open_to_chat_available: boolean
          preferred_age_max: number | null
          preferred_age_min: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discovery_enabled?: boolean
          gender_identity?: string | null
          interested_in?: string[]
          max_distance_miles?: number | null
          open_to_chat_available?: boolean
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discovery_enabled?: boolean
          gender_identity?: string | null
          interested_in?: string[]
          max_distance_miles?: number | null
          open_to_chat_available?: boolean
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_private_details: {
        Row: {
          created_at: string
          date_of_birth: string | null
          latitude: number | null
          location_city: string | null
          location_country: string | null
          location_place_id: string | null
          location_provider: string | null
          location_region: string | null
          longitude: number | null
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_place_id?: string | null
          location_provider?: string | null
          location_region?: string | null
          longitude?: number | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_place_id?: string | null
          location_provider?: string | null
          location_region?: string | null
          longitude?: number | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          career: string | null
          children: string | null
          children_count: string | null
          created_at: string
          drinking: string | null
          education: string | null
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[]
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
          smoking_partner_preferences: string[]
          smoking_product_other: string | null
          smoking_product_types: string[]
          drinking_partner_preferences: string[]
          profile_completed_at: string | null
          profile_photo_url: string | null
          relationship_goal: string | null
          relocation: string | null
          service_background: string | null
          service_backgrounds: string[]
          short_bio: string | null
          smoking: string | null
          status: Database["public"]["Enums"]["profile_status"]
          things_i_enjoy: string[]
          unmapped_legacy_fields: Json
          updated_at: string
        }
        Insert: {
          age?: number | null
          career?: string | null
          children?: string | null
          children_count?: string | null
          created_at?: string
          drinking?: string | null
          education?: string | null
          faith_identity?: string | null
          faith_importance?: string | null
          faith_other?: string | null
          faith_tradition?: string | null
          favorite_music_artists?: string[]
          favorite_music_songs?: string[]
          full_name?: string | null
          has_children?: string | null
          id: string
          is_discoverable?: boolean
          last_active_at?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          more_about?: string | null
          onboarding_completed_at?: string | null
          open_to_partner_with_children?: string | null
          pets?: string | null
          pets_allergy_constraint?: boolean | null
          pets_allergy_types?: string[]
          pets_partner_preferences?: string[]
          pets_types?: string[]
          smoking_partner_preferences?: string[]
          smoking_product_other?: string | null
          smoking_product_types?: string[]
          drinking_partner_preferences?: string[]
          profile_completed_at?: string | null
          profile_photo_url?: string | null
          relationship_goal?: string | null
          relocation?: string | null
          service_background?: string | null
          service_backgrounds?: string[]
          short_bio?: string | null
          smoking?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          things_i_enjoy?: string[]
          unmapped_legacy_fields?: Json
          updated_at?: string
        }
        Update: {
          age?: number | null
          career?: string | null
          children?: string | null
          children_count?: string | null
          created_at?: string
          drinking?: string | null
          education?: string | null
          faith_identity?: string | null
          faith_importance?: string | null
          faith_other?: string | null
          faith_tradition?: string | null
          favorite_music_artists?: string[]
          favorite_music_songs?: string[]
          full_name?: string | null
          has_children?: string | null
          id?: string
          is_discoverable?: boolean
          last_active_at?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          more_about?: string | null
          onboarding_completed_at?: string | null
          open_to_partner_with_children?: string | null
          pets?: string | null
          pets_allergy_constraint?: boolean | null
          pets_allergy_types?: string[]
          pets_partner_preferences?: string[]
          pets_types?: string[]
          smoking_partner_preferences?: string[]
          smoking_product_other?: string | null
          smoking_product_types?: string[]
          drinking_partner_preferences?: string[]
          profile_completed_at?: string | null
          profile_photo_url?: string | null
          relationship_goal?: string | null
          relocation?: string | null
          service_background?: string | null
          service_backgrounds?: string[]
          short_bio?: string | null
          smoking?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          things_i_enjoy?: string[]
          unmapped_legacy_fields?: Json
          updated_at?: string
        }
        Relationships: []
      }
      saved_profiles: {
        Row: {
          created_at: string
          id: string
          saved_id: string
          saver_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          saved_id: string
          saver_id: string
        }
        Update: {
          created_at?: string
          id?: string
          saved_id?: string
          saver_id?: string
        }
        Relationships: []
      }
      user_app_state: {
        Row: {
          created_at: string
          onboarding_completed: boolean
          onboarding_step: string | null
          open_to_chat_education_seen: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          onboarding_completed?: boolean
          onboarding_step?: string | null
          open_to_chat_education_seen?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          onboarding_completed?: boolean
          onboarding_step?: string | null
          open_to_chat_education_seen?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      discoverable_profile_photos: {
        Row: {
          display_order: number | null
          id: string | null
          is_primary: boolean | null
          storage_path: string | null
          user_id: string | null
        }
        Relationships: []
      }
      discoverable_profiles: {
        Row: {
          age: number | null
          career: string | null
          children: string | null
          children_count: string | null
          drinking: string | null
          education: string | null
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[] | null
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
          relocation: string | null
          service_background: string | null
          service_backgrounds: string[] | null
          short_bio: string | null
          smoking: string | null
          things_i_enjoy: string[] | null
        }
        Insert: {
          age?: number | null
          career?: string | null
          children?: string | null
          children_count?: string | null
          drinking?: string | null
          education?: string | null
          faith_identity?: string | null
          faith_importance?: string | null
          faith_other?: string | null
          faith_tradition?: string | null
          favorite_music_artists?: string[] | null
          favorite_music_songs?: string[] | null
          full_name?: string | null
          has_children?: string | null
          id?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          more_about?: string | null
          open_to_partner_with_children?: string | null
          pets?: string | null
          pets_types?: string[] | null
          profile_photo_url?: string | null
          relationship_goal?: string | null
          relocation?: string | null
          service_background?: string | null
          service_backgrounds?: string[] | null
          short_bio?: string | null
          smoking?: string | null
          things_i_enjoy?: string[] | null
        }
        Update: {
          age?: number | null
          career?: string | null
          children?: string | null
          children_count?: string | null
          drinking?: string | null
          education?: string | null
          faith_identity?: string | null
          faith_importance?: string | null
          faith_other?: string | null
          faith_tradition?: string | null
          favorite_music_artists?: string[] | null
          favorite_music_songs?: string[] | null
          full_name?: string | null
          has_children?: string | null
          id?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          more_about?: string | null
          open_to_partner_with_children?: string | null
          pets?: string | null
          pets_types?: string[] | null
          profile_photo_url?: string | null
          relationship_goal?: string | null
          relocation?: string | null
          service_background?: string | null
          service_backgrounds?: string[] | null
          short_bio?: string | null
          smoking?: string | null
          things_i_enjoy?: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_activate_discovery_visibility: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      count_open_to_chat_sent_today: {
        Args: { p_user_id?: string }
        Returns: number
      }
      ensure_foundational_user_records: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      forge_ensure_connection: {
        Args: {
          p_source: Database["public"]["Enums"]["connection_source"]
          p_user_1: string
          p_user_2: string
        }
        Returns: string
      }
      forge_map_legacy_profile_row: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: {
          age: number | null
          career: string | null
          children: string | null
          children_count: string | null
          created_at: string
          drinking: string | null
          education: string | null
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[]
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
          smoking_partner_preferences: string[]
          smoking_product_other: string | null
          smoking_product_types: string[]
          drinking_partner_preferences: string[]
          profile_completed_at: string | null
          profile_photo_url: string | null
          relationship_goal: string | null
          relocation: string | null
          service_background: string | null
          service_backgrounds: string[]
          short_bio: string | null
          smoking: string | null
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
      forge_order_pair: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: {
          user_a_id: string
          user_b_id: string
        }[]
      }
      forge_users_blocked: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
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
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[] | null
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
          profile_photo_url: string | null
          relationship_goal: string | null
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
      list_eligible_discovery_profiles: {
        Args: { p_limit?: number }
        Returns: {
          age: number | null
          career: string | null
          children: string | null
          children_count: string | null
          drinking: string | null
          education: string | null
          faith_identity: string | null
          faith_importance: string | null
          faith_other: string | null
          faith_tradition: string | null
          favorite_music_artists: string[] | null
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
          profile_photo_url: string | null
          relationship_goal: string | null
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
      mark_open_to_chat_education_seen: { Args: never; Returns: Json }
      pass_on_profile: { Args: { p_profile_id: string }; Returns: Json }
      profile_meets_discovery_requirements: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      block_user: { Args: { p_blocked_user_id: string }; Returns: Json }
      end_connection: { Args: { p_connection_id: string }; Returns: Json }
      ensure_conversation_for_connection: {
        Args: { p_connection_id: string }
        Returns: Json
      }
      forge_is_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      get_conversation_thread_meta: {
        Args: { p_conversation_id: string }
        Returns: Json
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
      list_my_conversations: { Args: Record<PropertyKey, never>; Returns: Json }
      list_my_notifications: { Args: { p_limit?: number }; Returns: Json }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: Json
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      remove_saved_profile: { Args: { p_profile_id: string }; Returns: Json }
      report_user: {
        Args: {
          p_conversation_id?: string
          p_details?: string
          p_reason: Database["public"]["Enums"]["report_reason"]
          p_reported_user_id: string
        }
        Returns: Json
      }
      respond_open_to_chat: {
        Args: { p_action: string; p_request_id: string }
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
      send_interest: { Args: { p_recipient_id: string }; Returns: Json }
      send_open_to_chat: {
        Args: { p_note?: string; p_recipient_id: string }
        Returns: Json
      }
      set_my_discovery_visibility: {
        Args: { p_enabled: boolean }
        Returns: Json
      }
      withdraw_interest: { Args: { p_recipient_id: string }; Returns: Json }
    }
    Enums: {
      answer_visibility: "private" | "shared_with_matches" | "public_summary"
      character_signal_interaction: "in_app" | "in_person"
      character_signal_status: "pending" | "approved" | "declined"
      connection_source: "mutual_interest" | "open_to_chat"
      connection_status: "active" | "ended"
      conversation_status: "active" | "ended"
      notification_entity_type:
        | "message"
        | "conversation"
        | "connection"
        | "open_to_chat_request"
        | "interest"
      notification_type:
        | "new_message"
        | "mutual_connection"
        | "open_to_chat_accepted"
        | "interest_received"
      interest_status: "pending" | "mutual" | "withdrawn"
      open_to_chat_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "deferred"
      photo_moderation_status: "pending" | "approved" | "rejected"
      profile_status: "draft" | "active" | "paused" | "hidden" | "deactivated"
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
      character_signal_interaction: ["in_app", "in_person"],
      character_signal_status: ["pending", "approved", "declined"],
      connection_source: ["mutual_interest", "open_to_chat"],
      connection_status: ["active", "ended"],
      conversation_status: ["active", "ended"],
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
        "open_to_chat_accepted",
        "interest_received",
      ],
      interest_status: ["pending", "mutual", "withdrawn"],
      open_to_chat_status: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "deferred",
      ],
      photo_moderation_status: ["pending", "approved", "rejected"],
      profile_status: ["draft", "active", "paused", "hidden", "deactivated"],
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
