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
      beta_feedback_submissions: {
        Row: {
          area: Database["public"]["Enums"]["beta_feedback_area"]
          category: Database["public"]["Enums"]["beta_feedback_category"]
          contact_requested: boolean
          created_at: string
          id: string
          message: string
          notification_attempted_at: string | null
          notification_error: string | null
          notification_status: string
          provider_message_id: string | null
          submitter_id: string
          triage_status: string
          updated_at: string
        }
        Insert: {
          area: Database["public"]["Enums"]["beta_feedback_area"]
          category: Database["public"]["Enums"]["beta_feedback_category"]
          contact_requested?: boolean
          created_at?: string
          id: string
          message: string
          notification_attempted_at?: string | null
          notification_error?: string | null
          notification_status?: string
          provider_message_id?: string | null
          submitter_id: string
          triage_status?: string
          updated_at?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["beta_feedback_area"]
          category?: Database["public"]["Enums"]["beta_feedback_category"]
          contact_requested?: boolean
          created_at?: string
          id?: string
          message?: string
          notification_attempted_at?: string | null
          notification_error?: string | null
          notification_status?: string
          provider_message_id?: string | null
          submitter_id?: string
          triage_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      beta_signup_invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          email: string
          expires_at: string | null
          id: string
          invited_at: string
          note: string | null
          revoked_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_at?: string
          note?: string | null
          revoked_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_at?: string
          note?: string | null
          revoked_at?: string | null
        }
        Relationships: []
      }
      character_signal_display_preferences: {
        Row: {
          is_public: boolean
          receiver_id: string
          signal_key: string
          updated_at: string
        }
        Insert: {
          is_public?: boolean
          receiver_id: string
          signal_key: string
          updated_at?: string
        }
        Update: {
          is_public?: boolean
          receiver_id?: string
          signal_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      character_signals: {
        Row: {
          connection_id: string | null
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
          connection_id?: string | null
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
          connection_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "character_signals_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
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
          ended_at: string | null
          ended_by_user_id: string | null
          id: string
          last_message_at: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          ended_at?: string | null
          ended_by_user_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          ended_at?: string | null
          ended_by_user_id?: string | null
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
      message_attachments: {
        Row: {
          attachment_kind: string
          conversation_id: string
          created_at: string
          file_name: string
          file_size: number
          height: number | null
          id: string
          message_id: string
          mime_type: string
          position: number
          sender_id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          attachment_kind: string
          conversation_id: string
          created_at?: string
          file_name: string
          file_size: number
          height?: number | null
          id?: string
          message_id: string
          mime_type: string
          position?: number
          sender_id: string
          storage_path: string
          width?: number | null
        }
        Update: {
          attachment_kind?: string
          conversation_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          height?: number | null
          id?: string
          message_id?: string
          mime_type?: string
          position?: number
          sender_id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
      notifications: {
        Row: {
          actor_user_id: string | null
          body: string
          created_at: string
          destination_path: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["notification_entity_type"]
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          recipient_user_id: string
        }
        Insert: {
          actor_user_id?: string | null
          body: string
          created_at?: string
          destination_path: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["notification_entity_type"]
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          recipient_user_id: string
        }
        Update: {
          actor_user_id?: string | null
          body?: string
          created_at?: string
          destination_path?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["notification_entity_type"]
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          recipient_user_id?: string
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
          drinking_partner_preferences: string[]
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
          profile_completed_at: string | null
          profile_photo_url: string | null
          relationship_goal: string | null
          relationship_goals: string[]
          relocation: string | null
          service_background: string | null
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
        Insert: {
          age?: number | null
          career?: string | null
          children?: string | null
          children_count?: string | null
          created_at?: string
          drinking?: string | null
          drinking_partner_preferences?: string[]
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
          profile_completed_at?: string | null
          profile_photo_url?: string | null
          relationship_goal?: string | null
          relationship_goals?: string[]
          relocation?: string | null
          service_background?: string | null
          service_backgrounds?: string[]
          short_bio?: string | null
          smoking?: string | null
          smoking_partner_preferences?: string[]
          smoking_product_other?: string | null
          smoking_product_types?: string[]
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
          drinking_partner_preferences?: string[]
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
          profile_completed_at?: string | null
          profile_photo_url?: string | null
          relationship_goal?: string | null
          relationship_goals?: string[]
          relocation?: string | null
          service_background?: string | null
          service_backgrounds?: string[]
          short_bio?: string | null
          smoking?: string | null
          smoking_partner_preferences?: string[]
          smoking_product_other?: string | null
          smoking_product_types?: string[]
          status?: Database["public"]["Enums"]["profile_status"]
          things_i_enjoy?: string[]
          unmapped_legacy_fields?: Json
          updated_at?: string
        }
        Relationships: []
      }
      questionnaire_answer_choices: {
        Row: {
          choice_key: string
          created_at: string
          display_order: number
          id: string
          label: string
          mutually_exclusive: boolean
          opens_optional_context: boolean
          optional_context_config: Json | null
          qualifier:
            | Database["public"]["Enums"]["questionnaire_response_qualifier"]
            | null
          qualifier_coexists_with_selections: boolean
          question_id: string
          special_response_state:
            | Database["public"]["Enums"]["questionnaire_response_state"]
            | null
        }
        Insert: {
          choice_key: string
          created_at?: string
          display_order: number
          id?: string
          label: string
          mutually_exclusive?: boolean
          opens_optional_context?: boolean
          optional_context_config?: Json | null
          qualifier?:
            | Database["public"]["Enums"]["questionnaire_response_qualifier"]
            | null
          qualifier_coexists_with_selections?: boolean
          question_id: string
          special_response_state?:
            | Database["public"]["Enums"]["questionnaire_response_state"]
            | null
        }
        Update: {
          choice_key?: string
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          mutually_exclusive?: boolean
          opens_optional_context?: boolean
          optional_context_config?: Json | null
          qualifier?:
            | Database["public"]["Enums"]["questionnaire_response_qualifier"]
            | null
          qualifier_coexists_with_selections?: boolean
          question_id?: string
          special_response_state?:
            | Database["public"]["Enums"]["questionnaire_response_state"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_answer_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_categories: {
        Row: {
          category_key: string
          category_number: number
          created_at: string
          display_order: number
          id: string
          locked_product_decisions: Json
          status: Database["public"]["Enums"]["questionnaire_category_status"]
          title: string
          version_id: string
        }
        Insert: {
          category_key: string
          category_number: number
          created_at?: string
          display_order: number
          id?: string
          locked_product_decisions?: Json
          status?: Database["public"]["Enums"]["questionnaire_category_status"]
          title: string
          version_id: string
        }
        Update: {
          category_key?: string
          category_number?: number
          created_at?: string
          display_order?: number
          id?: string
          locked_product_decisions?: Json
          status?: Database["public"]["Enums"]["questionnaire_category_status"]
          title?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_categories_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_eligibility_rules: {
        Row: {
          condition: Json
          created_at: string
          description: string
          id: string
          rule_key: string
          version_id: string
        }
        Insert: {
          condition?: Json
          created_at?: string
          description: string
          id?: string
          rule_key: string
          version_id: string
        }
        Update: {
          condition?: Json
          created_at?: string
          description?: string
          id?: string
          rule_key?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_eligibility_rules_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_questions: {
        Row: {
          alignment_purpose: string
          allowed_qualifiers:
            | Database["public"]["Enums"]["questionnaire_response_qualifier"][]
            | null
          allowed_special_response_states:
            | Database["public"]["Enums"]["questionnaire_response_state"][]
            | null
          category_id: string
          context_note: string | null
          created_at: string
          display_order: number
          eligibility_rule_id: string | null
          format_label: string
          id: string
          implementation_note: string | null
          is_conditional: boolean
          max_selections: number | null
          min_selections: number
          priority_eligible_choice_keys: Json | null
          priority_excluded_choice_keys: Json | null
          priority_follow_up_prompt: string | null
          priority_min_eligible_selections: number | null
          priority_selection_count: number | null
          priority_unordered: boolean
          prompt: string
          question_key: string
          question_number: number
          response_behavior: Database["public"]["Enums"]["questionnaire_response_behavior"]
          select_all_that_apply: boolean
          statement: string | null
          structured_identity_config: Json | null
        }
        Insert: {
          alignment_purpose: string
          allowed_qualifiers?:
            | Database["public"]["Enums"]["questionnaire_response_qualifier"][]
            | null
          allowed_special_response_states?:
            | Database["public"]["Enums"]["questionnaire_response_state"][]
            | null
          category_id: string
          context_note?: string | null
          created_at?: string
          display_order: number
          eligibility_rule_id?: string | null
          format_label: string
          id?: string
          implementation_note?: string | null
          is_conditional?: boolean
          max_selections?: number | null
          min_selections?: number
          priority_eligible_choice_keys?: Json | null
          priority_excluded_choice_keys?: Json | null
          priority_follow_up_prompt?: string | null
          priority_min_eligible_selections?: number | null
          priority_selection_count?: number | null
          priority_unordered?: boolean
          prompt: string
          question_key: string
          question_number: number
          response_behavior: Database["public"]["Enums"]["questionnaire_response_behavior"]
          select_all_that_apply?: boolean
          statement?: string | null
          structured_identity_config?: Json | null
        }
        Update: {
          alignment_purpose?: string
          allowed_qualifiers?:
            | Database["public"]["Enums"]["questionnaire_response_qualifier"][]
            | null
          allowed_special_response_states?:
            | Database["public"]["Enums"]["questionnaire_response_state"][]
            | null
          category_id?: string
          context_note?: string | null
          created_at?: string
          display_order?: number
          eligibility_rule_id?: string | null
          format_label?: string
          id?: string
          implementation_note?: string | null
          is_conditional?: boolean
          max_selections?: number | null
          min_selections?: number
          priority_eligible_choice_keys?: Json | null
          priority_excluded_choice_keys?: Json | null
          priority_follow_up_prompt?: string | null
          priority_min_eligible_selections?: number | null
          priority_selection_count?: number | null
          priority_unordered?: boolean
          prompt?: string
          question_key?: string
          question_number?: number
          response_behavior?: Database["public"]["Enums"]["questionnaire_response_behavior"]
          select_all_that_apply?: boolean
          statement?: string | null
          structured_identity_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_questions_eligibility_rule_id_fkey"
            columns: ["eligibility_rule_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_eligibility_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_versions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          specification_version: string
          title: string
          version_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          specification_version: string
          title: string
          version_key: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          specification_version?: string
          title?: string
          version_key?: string
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
      user_questionnaire_priority_selections: {
        Row: {
          choice_id: string
          created_at: string
          response_id: string
        }
        Insert: {
          choice_id: string
          created_at?: string
          response_id: string
        }
        Update: {
          choice_id?: string
          created_at?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_questionnaire_priority_selected_fk"
            columns: ["response_id", "choice_id"]
            isOneToOne: true
            referencedRelation: "user_questionnaire_selected_choices"
            referencedColumns: ["response_id", "choice_id"]
          },
          {
            foreignKeyName: "user_questionnaire_priority_selections_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_answer_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_questionnaire_priority_selections_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "user_questionnaire_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_questionnaire_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_category_id: string | null
          current_phase: string | null
          current_question_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["questionnaire_progress_status"]
          updated_at: string
          user_id: string
          version_id: string
          write_generation: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_category_id?: string | null
          current_phase?: string | null
          current_question_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["questionnaire_progress_status"]
          updated_at?: string
          user_id: string
          version_id: string
          write_generation?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_category_id?: string | null
          current_phase?: string | null
          current_question_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["questionnaire_progress_status"]
          updated_at?: string
          user_id?: string
          version_id?: string
          write_generation?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_questionnaire_progress_current_category_id_fkey"
            columns: ["current_category_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_questionnaire_progress_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_questionnaire_progress_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_questionnaire_responses: {
        Row: {
          active_qualifiers: Database["public"]["Enums"]["questionnaire_response_qualifier"][]
          client_mutation: number
          created_at: string
          id: string
          identity_private_matching_allowed: boolean | null
          identity_public_display_allowed: boolean | null
          identity_refinement: string | null
          identity_user_supplied: string | null
          question_id: string
          response_state: Database["public"]["Enums"]["questionnaire_response_state"]
          revision: number
          updated_at: string
          user_id: string
          version_id: string
        }
        Insert: {
          active_qualifiers?: Database["public"]["Enums"]["questionnaire_response_qualifier"][]
          client_mutation?: number
          created_at?: string
          id?: string
          identity_private_matching_allowed?: boolean | null
          identity_public_display_allowed?: boolean | null
          identity_refinement?: string | null
          identity_user_supplied?: string | null
          question_id: string
          response_state?: Database["public"]["Enums"]["questionnaire_response_state"]
          revision?: number
          updated_at?: string
          user_id: string
          version_id: string
        }
        Update: {
          active_qualifiers?: Database["public"]["Enums"]["questionnaire_response_qualifier"][]
          client_mutation?: number
          created_at?: string
          id?: string
          identity_private_matching_allowed?: boolean | null
          identity_public_display_allowed?: boolean | null
          identity_refinement?: string | null
          identity_user_supplied?: string | null
          question_id?: string
          response_state?: Database["public"]["Enums"]["questionnaire_response_state"]
          revision?: number
          updated_at?: string
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_questionnaire_responses_progress_fk"
            columns: ["user_id", "version_id"]
            isOneToOne: false
            referencedRelation: "user_questionnaire_progress"
            referencedColumns: ["user_id", "version_id"]
          },
          {
            foreignKeyName: "user_questionnaire_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_questionnaire_responses_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_questionnaire_selected_choices: {
        Row: {
          choice_id: string
          context_text: string | null
          created_at: string
          response_id: string
        }
        Insert: {
          choice_id: string
          context_text?: string | null
          created_at?: string
          response_id: string
        }
        Update: {
          choice_id?: string
          context_text?: string | null
          created_at?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_questionnaire_selected_choices_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_answer_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_questionnaire_selected_choices_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "user_questionnaire_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_questionnaire_write_operations: {
        Row: {
          created_at: string
          operation_id: string
          operation_kind: string
          question_id: string | null
          request_fingerprint: string
          result: Json
          target_key: string | null
          user_id: string
          version_id: string
        }
        Insert: {
          created_at?: string
          operation_id: string
          operation_kind: string
          question_id?: string | null
          request_fingerprint: string
          result: Json
          target_key?: string | null
          user_id: string
          version_id: string
        }
        Update: {
          created_at?: string
          operation_id?: string
          operation_kind?: string
          question_id?: string | null
          request_fingerprint?: string
          result?: Json
          target_key?: string | null
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_questionnaire_write_operations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_questionnaire_write_operations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      report_evidence: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          id: string
          mime_type: string
          report_id: string
          reporter_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          report_id: string
          reporter_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          report_id?: string
          reporter_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "user_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_action_audit: {
        Row: {
          action: string
          actor_user_id: string | null
          connection_was_active: boolean
          conversation_id: string | null
          created_at: string
          id: string
          messaging_reopened: boolean
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          connection_was_active?: boolean
          conversation_id?: string | null
          created_at?: string
          id?: string
          messaging_reopened?: boolean
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          connection_was_active?: boolean
          conversation_id?: string | null
          created_at?: string
          id?: string
          messaging_reopened?: boolean
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_action_audit_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_report_notifications: {
        Row: {
          accepted_at: string | null
          attempt_count: number
          attempted_at: string | null
          created_at: string
          failed_at: string | null
          last_error: string | null
          provider: string
          provider_message_id: string | null
          report_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          attempt_count?: number
          attempted_at?: string | null
          created_at?: string
          failed_at?: string | null
          last_error?: string | null
          provider?: string
          provider_message_id?: string | null
          report_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          attempt_count?: number
          attempted_at?: string | null
          created_at?: string
          failed_at?: string | null
          last_error?: string | null
          provider?: string
          provider_message_id?: string | null
          report_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_report_notifications_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "user_reports"
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
          relationship_goals: string[] | null
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
          relationship_goals?: string[] | null
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
          relationship_goals?: string[] | null
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
      block_user: { Args: { p_blocked_user_id: string }; Returns: Json }
      can_activate_discovery_visibility: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      clear_my_questionnaire_category: {
        Args: {
          p_category_key: string
          p_expected_write_generation?: number
          p_operation_id: string
          p_version_key: string
        }
        Returns: Json
      }
      clear_my_questionnaire_profile: {
        Args: {
          p_expected_write_generation?: number
          p_operation_id: string
          p_version_key: string
        }
        Returns: Json
      }
      clear_my_questionnaire_question: {
        Args: {
          p_expected_revision?: number
          p_expected_write_generation?: number
          p_operation_id: string
          p_question_key: string
          p_version_key: string
        }
        Returns: Json
      }
      count_open_to_chat_sent_today: {
        Args: { p_user_id?: string }
        Returns: number
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
          profile_completed_at: string | null
          profile_photo_url: string | null
          relationship_goal: string | null
          relationship_goals: string[]
          relocation: string | null
          service_background: string | null
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
          relationship_goals: string[] | null
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
          relationship_goals: string[] | null
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
          relationship_goals: string[] | null
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
        | "open_to_chat_accepted"
        | "interest_received"
      open_to_chat_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "deferred"
      photo_moderation_status: "pending" | "approved" | "rejected"
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
