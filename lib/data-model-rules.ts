/**
 * Shared Forge data-model rules mirrored from the foundation migration.
 * Used by tests and documentation — keep in sync with
 * supabase/migrations/20260714000000_forge_backend_foundation.sql
 */

/** Max length for Open to Chat introduction notes. */
export const OPEN_TO_CHAT_NOTE_MAX_LENGTH = 200;

/** Preference age bounds. */
export const PREFERRED_AGE_MIN = 18;
export const PREFERRED_AGE_MAX = 120;

/** Preference distance bounds (miles). */
export const MAX_DISTANCE_MIN_MILES = 1;
export const MAX_DISTANCE_MAX_MILES = 500;

/**
 * Columns another authenticated Forge user may see for a discoverable profile.
 * Exact DOB, postal code, coordinates, email, phone, admin timestamps, and
 * private answers are intentionally excluded.
 */
export const DISCOVERABLE_PROFILE_COLUMNS = [
  'id',
  'full_name',
  'age',
  'location',
  'relationship_goal',
  'faith_importance',
  'service_background',
  'short_bio',
  'more_about',
  'children',
  'has_children',
  'education',
  'pets',
  'smoking',
  'drinking',
  'career',
  'relocation',
  'things_i_enjoy',
  'favorite_music_artists',
  'favorite_music_songs',
  'profile_photo_url',
] as const;

export type DiscoverableProfileColumn =
  (typeof DISCOVERABLE_PROFILE_COLUMNS)[number];

/** Never exposed through discoverable profile reads. */
export const PRIVATE_OR_ADMIN_PROFILE_COLUMNS = [
  'date_of_birth',
  'postal_code',
  'latitude',
  'longitude',
  'email',
  'phone',
  'status',
  'is_discoverable',
  'onboarding_completed_at',
  'profile_completed_at',
  'last_active_at',
  'created_at',
  'updated_at',
] as const;

/** Owner-editable profile columns (excludes system/admin fields). */
export const OWNER_EDITABLE_PROFILE_COLUMNS = [
  'full_name',
  'age',
  'location',
  'relationship_goal',
  'faith_importance',
  'service_background',
  'short_bio',
  'more_about',
  'children',
  'has_children',
  'education',
  'pets',
  'smoking',
  'drinking',
  'career',
  'relocation',
  'things_i_enjoy',
  'favorite_music_artists',
  'favorite_music_songs',
  'profile_photo_url',
  'is_discoverable',
  'last_active_at',
] as const;

export function isSelfAction(actorId: string, targetId: string): boolean {
  return actorId === targetId;
}

export function isOpenToChatNoteValid(note: string | null | undefined): boolean {
  if (note == null) return true;
  return note.length <= OPEN_TO_CHAT_NOTE_MAX_LENGTH;
}

/** Enforce unordered connection pair ordering (user_a < user_b). */
export function orderConnectionParticipants(
  userId1: string,
  userId2: string
): { user_a_id: string; user_b_id: string } | null {
  if (userId1 === userId2) return null;
  return userId1 < userId2
    ? { user_a_id: userId1, user_b_id: userId2 }
    : { user_a_id: userId2, user_b_id: userId1 };
}

/**
 * Simulate unique-pair insert semantics for relationship tables.
 * Returns false when a duplicate (actor, target) already exists.
 */
export function canCreateUniquePair(
  existingPairs: ReadonlyArray<{ actorId: string; targetId: string }>,
  actorId: string,
  targetId: string
): boolean {
  if (isSelfAction(actorId, targetId)) return false;
  return !existingPairs.some(
    (pair) => pair.actorId === actorId && pair.targetId === targetId
  );
}

/**
 * Enforce at most one primary photo in a user's photo list.
 * Returns the list with a single primary (first marked, or none).
 */
export function normalizePrimaryPhotos<
  T extends { id: string; is_primary: boolean },
>(photos: T[]): T[] {
  let primarySeen = false;
  return photos.map((photo) => {
    if (!photo.is_primary) return photo;
    if (primarySeen) {
      return { ...photo, is_primary: false };
    }
    primarySeen = true;
    return photo;
  });
}

export function countPrimaryPhotos(
  photos: ReadonlyArray<{ is_primary: boolean }>
): number {
  return photos.filter((photo) => photo.is_primary).length;
}
