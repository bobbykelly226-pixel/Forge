type SelfPreviewContent = {
  full_name?: string | null;
  age?: number | null;
  location?: string | null;
  location_city?: string | null;
  location_region?: string | null;
  location_country?: string | null;
  short_bio?: string | null;
  more_about?: string | null;
  relationship_goal?: string | null;
  relationship_goals?: string[] | null;
  faith_identity?: string | null;
  faith_tradition?: string | null;
  faith_other?: string | null;
  faith_importance?: string | null;
  service_background?: string | null;
  service_backgrounds?: string[] | null;
  children?: string | null;
  has_children?: string | null;
  children_count?: string | null;
  open_to_partner_with_children?: string | null;
  education?: string | null;
  pets?: string | null;
  smoking?: string | null;
  drinking?: string | null;
  career?: string | null;
  relocation?: string | null;
  things_i_enjoy?: string[] | null;
  favorite_music_artists?: string[] | null;
  favorite_music_songs?: string[] | null;
  profile_photo_url?: string | null;
  photos?: unknown[] | null;
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function hasItems(value: readonly unknown[] | null | undefined): boolean {
  return Boolean(value && value.length > 0);
}

/** Whether the owner has any safe public content worth rendering in self-preview. */
export function selfPreviewHasVisibleContent(
  profile: SelfPreviewContent | null | undefined
): boolean {
  if (!profile) return false;

  return Boolean(
    hasText(profile.full_name) ||
      profile.age != null ||
      hasText(profile.location) ||
      hasText(profile.location_city) ||
      hasText(profile.location_region) ||
      hasText(profile.location_country) ||
      hasText(profile.short_bio) ||
      hasText(profile.more_about) ||
      hasText(profile.relationship_goal) ||
      hasItems(profile.relationship_goals) ||
      hasText(profile.faith_identity) ||
      hasText(profile.faith_tradition) ||
      hasText(profile.faith_other) ||
      hasText(profile.faith_importance) ||
      hasText(profile.service_background) ||
      hasItems(profile.service_backgrounds) ||
      hasText(profile.children) ||
      hasText(profile.has_children) ||
      hasText(profile.children_count) ||
      hasText(profile.open_to_partner_with_children) ||
      hasText(profile.education) ||
      hasText(profile.pets) ||
      hasText(profile.smoking) ||
      hasText(profile.drinking) ||
      hasText(profile.career) ||
      hasText(profile.relocation) ||
      hasItems(profile.things_i_enjoy) ||
      hasItems(profile.favorite_music_artists) ||
      hasItems(profile.favorite_music_songs) ||
      hasText(profile.profile_photo_url) ||
      hasItems(profile.photos)
  );
}
