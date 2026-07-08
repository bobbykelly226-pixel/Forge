export type Profile = {
  id: string;
  full_name: string | null;
  age: number | null;
  location: string | null;
  relationship_goal: string | null;
  faith_importance: string | null;
  service_background: string | null;
  short_bio: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileFormData = {
  full_name: string;
  age: string;
  location: string;
  relationship_goal: string;
  faith_importance: string;
  service_background: string;
  short_bio: string;
};
