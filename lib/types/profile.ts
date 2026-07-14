import type { Tables } from '@/lib/supabase/database.types';

/** Full profiles row from generated database types. */
export type Profile = Tables<'profiles'>;

export type ProfileFormData = {
  full_name: string;
  age: string;
  location: string;
  relationship_goal: string;
  faith_importance: string;
  service_background: string;
  short_bio: string;
  more_about: string;
  children: string;
  has_children: string;
  education: string;
  pets: string;
  smoking: string;
  drinking: string;
  career: string;
  relocation: string;
};
