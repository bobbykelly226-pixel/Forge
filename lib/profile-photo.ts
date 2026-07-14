export const PROFILE_PHOTO_BUCKET = 'profile-photos';
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Centralized maximum for profile photo collection. */
export const MAX_PROFILE_PHOTOS = 6;

export const MAX_PROFILE_PHOTOS_MESSAGE =
  'You can add up to 6 photos. Remove one to add another.';

export const PROFILE_PHOTO_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type ProfilePhotoMimeType = (typeof PROFILE_PHOTO_ALLOWED_TYPES)[number];

export function isAllowedProfilePhotoType(type: string): type is ProfilePhotoMimeType {
  return PROFILE_PHOTO_ALLOWED_TYPES.includes(type as ProfilePhotoMimeType);
}

export function getProfilePhotoExtension(type: ProfilePhotoMimeType): string {
  switch (type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export function validateProfilePhoto(file: File): string | null {
  if (!file || file.size === 0) {
    return null;
  }

  if (!isAllowedProfilePhotoType(file.type)) {
    return 'Please upload a JPG, PNG, WEBP, or GIF image.';
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return 'Image must be 5 MB or smaller.';
  }

  return null;
}

/**
 * Unique user-scoped storage path for every upload/replacement.
 * Avoids reusing a cached public URL when replacing a photo.
 */
export function createUniqueProfilePhotoPath(
  userId: string,
  mimeType: ProfilePhotoMimeType,
  uniqueId: string = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
): string {
  const safeId = uniqueId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${userId}/${safeId}.${getProfilePhotoExtension(mimeType)}`;
}

/** @deprecated Prefer createUniqueProfilePhotoPath — fixed filenames cache forever. */
export function getProfilePhotoPath(userId: string, mimeType: ProfilePhotoMimeType): string {
  return createUniqueProfilePhotoPath(userId, mimeType, 'profile-photo');
}

export function buildPublicProfilePhotoUrl(storagePath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !storagePath) return null;
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/${storagePath}`;
}

type PhotoLike = {
  storage_path: string;
  is_primary?: boolean | null;
  display_order?: number | null;
};

/**
 * Authoritative current profile photo URL.
 * Prefer primary profile_photos row; fall back to legacy profiles.profile_photo_url.
 */
export function resolveAuthoritativeProfilePhotoUrl(input: {
  photos: PhotoLike[] | null | undefined;
  legacyProfilePhotoUrl?: string | null;
}): string | null {
  const photos = [...(input.photos ?? [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
  const primary = photos.find((photo) => photo.is_primary) ?? photos[0] ?? null;
  if (primary?.storage_path) {
    return buildPublicProfilePhotoUrl(primary.storage_path);
  }
  return input.legacyProfilePhotoUrl?.trim() || null;
}

export function photosAgreeWithLegacyUrl(input: {
  photos: PhotoLike[] | null | undefined;
  legacyProfilePhotoUrl?: string | null;
}): boolean {
  const authoritative = resolveAuthoritativeProfilePhotoUrl(input);
  if (!authoritative) {
    return !input.legacyProfilePhotoUrl;
  }
  if (!input.legacyProfilePhotoUrl) {
    return true;
  }
  return authoritative === input.legacyProfilePhotoUrl;
}

export const PROFILE_PHOTO_REVALIDATE_PATHS = [
  '/profile',
  '/profile/edit',
  '/profile/preview',
  '/discovery',
] as const;

export type ManagedProfilePhoto = {
  id: string;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
  public_url: string | null;
};

export function toManagedProfilePhoto(photo: {
  id: string;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
}): ManagedProfilePhoto {
  return {
    id: photo.id,
    storage_path: photo.storage_path,
    display_order: photo.display_order,
    is_primary: photo.is_primary,
    public_url: buildPublicProfilePhotoUrl(photo.storage_path),
  };
}

/** Photos sorted by display_order for public + management presentation. */
export function sortPhotosByDisplayOrder<T extends { display_order?: number | null }>(
  photos: readonly T[]
): T[] {
  return [...photos].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

/**
 * Ordered public photo URLs by saved display_order.
 * Empty slots are omitted.
 */
export function orderedPublicPhotoUrls(input: {
  photos: PhotoLike[] | null | undefined;
  legacyProfilePhotoUrl?: string | null;
}): string[] {
  const photos = sortPhotosByDisplayOrder(input.photos ?? []);
  if (photos.length === 0) {
    const legacy = input.legacyProfilePhotoUrl?.trim();
    return legacy ? [legacy] : [];
  }

  return photos
    .map((photo) =>
      photo.storage_path ? buildPublicProfilePhotoUrl(photo.storage_path) : null
    )
    .filter((url): url is string => Boolean(url));
}

/** Non-primary photos in saved display_order for public gallery strips. */
export function additionalPublicPhotoUrls(
  photos: PhotoLike[] | null | undefined
): string[] {
  return sortPhotosByDisplayOrder(photos ?? [])
    .filter((photo) => !photo.is_primary)
    .map((photo) =>
      photo.storage_path ? buildPublicProfilePhotoUrl(photo.storage_path) : null
    )
    .filter((url): url is string => Boolean(url));
}

export function nextDisplayOrder(
  photos: ReadonlyArray<{ display_order: number }>
): number {
  if (photos.length === 0) return 0;
  return Math.max(...photos.map((photo) => photo.display_order)) + 1;
}

export function canAddAnotherProfilePhoto(currentCount: number): boolean {
  return currentCount < MAX_PROFILE_PHOTOS;
}
