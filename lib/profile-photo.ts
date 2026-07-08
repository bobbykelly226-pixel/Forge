export const PROFILE_PHOTO_BUCKET = 'profile-photos';
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

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

export function getProfilePhotoPath(userId: string, mimeType: ProfilePhotoMimeType): string {
  return `${userId}/profile-photo.${getProfilePhotoExtension(mimeType)}`;
}
