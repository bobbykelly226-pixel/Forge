/**
 * Client-side profile photo processing — decode, crop, resize, compress.
 * Only the processed file is uploaded; originals are never stored.
 */

export const PROFILE_PHOTO_PROCESSED_MAX_LONG_EDGE = 1920;
export const PROFILE_PHOTO_PROCESSED_QUALITY = 0.86;
export const PROFILE_PHOTO_PROCESSED_MIME = 'image/jpeg' as const;
/** Safety cap on the selected original before we attempt decode. */
export const PROFILE_PHOTO_ORIGINAL_MAX_BYTES = 40 * 1024 * 1024;
/** Processed upload must stay under storage-friendly limit. */
export const PROFILE_PHOTO_PROCESSED_MAX_BYTES = 5 * 1024 * 1024;
/** Portrait crop matching public profile presentation (aspect-[3/4]). */
export const PROFILE_PHOTO_CROP_ASPECT = 3 / 4;

export type ProfilePhotoProcessErrorCode =
  | 'unsupported'
  | 'heic'
  | 'empty'
  | 'too_large_original'
  | 'decode'
  | 'process'
  | 'still_too_large';

export class ProfilePhotoProcessError extends Error {
  readonly code: ProfilePhotoProcessErrorCode;

  constructor(code: ProfilePhotoProcessErrorCode, message: string) {
    super(message);
    this.name = 'ProfilePhotoProcessError';
    this.code = code;
  }
}

export const PROFILE_PHOTO_PROCESS_MESSAGES: Record<
  ProfilePhotoProcessErrorCode,
  string
> = {
  unsupported: 'That photo format isn’t supported yet.',
  heic:
    'iPhone HEIC photos aren’t supported yet. In Photos, choose a JPG or convert the image, then try again.',
  empty: 'We couldn’t process that image. Try another photo.',
  too_large_original:
    'That photo is too large to process. Try a different photo.',
  decode: 'We couldn’t process that image. Try another photo.',
  process: 'We couldn’t process that image. Try another photo.',
  still_too_large:
    'The processed image is still too large. Try a different photo.',
};

const DECODEABLE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function isHeicLikeFile(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

export function isDecodableProfilePhotoType(type: string): boolean {
  return DECODEABLE_TYPES.has(type.toLowerCase());
}

/**
 * Validate a selected original before crop/decode.
 * Does NOT reject solely for exceeding the processed 5 MB limit.
 */
export function validateSelectedProfilePhoto(file: File): ProfilePhotoProcessError | null {
  if (!file || file.size === 0) {
    return new ProfilePhotoProcessError('empty', PROFILE_PHOTO_PROCESS_MESSAGES.empty);
  }
  if (isHeicLikeFile(file)) {
    return new ProfilePhotoProcessError('heic', PROFILE_PHOTO_PROCESS_MESSAGES.heic);
  }
  const type = file.type || guessMimeFromName(file.name);
  if (!isDecodableProfilePhotoType(type)) {
    return new ProfilePhotoProcessError(
      'unsupported',
      PROFILE_PHOTO_PROCESS_MESSAGES.unsupported
    );
  }
  if (file.size > PROFILE_PHOTO_ORIGINAL_MAX_BYTES) {
    return new ProfilePhotoProcessError(
      'too_large_original',
      PROFILE_PHOTO_PROCESS_MESSAGES.too_large_original
    );
  }
  return null;
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return '';
}

export type LoadedProfileImage = {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  objectUrl: string;
};

/**
 * Decode a selected file into an ImageBitmap.
 * createImageBitmap applies EXIF orientation in modern browsers.
 */
export async function loadProfileImage(file: File): Promise<LoadedProfileImage> {
  const validation = validateSelectedProfilePhoto(file);
  if (validation) throw validation;

  const objectUrl = URL.createObjectURL(file);
  try {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions);
    } catch {
      // Fallback path for environments without imageOrientation support.
      bitmap = await createImageBitmap(file);
    }
    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      objectUrl,
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new ProfilePhotoProcessError('decode', PROFILE_PHOTO_PROCESS_MESSAGES.decode);
  }
}

export type CropRect = {
  /** Source x in natural image pixels */
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Compute the largest centered crop of the given aspect that fits in the image.
 */
export function centeredCropRect(
  imageWidth: number,
  imageHeight: number,
  aspect: number = PROFILE_PHOTO_CROP_ASPECT
): CropRect {
  const imageAspect = imageWidth / imageHeight;
  if (imageAspect > aspect) {
    const height = imageHeight;
    const width = height * aspect;
    return { x: (imageWidth - width) / 2, y: 0, width, height };
  }
  const width = imageWidth;
  const height = width / aspect;
  return { x: 0, y: (imageHeight - height) / 2, width, height };
}

/**
 * Scale a crop rect around its center.
 * zoom = 1 means the base crop; zoom > 1 zooms in (smaller source rect).
 */
export function zoomCropRect(base: CropRect, zoom: number): CropRect {
  const safeZoom = Math.max(1, Math.min(zoom, 4));
  const width = base.width / safeZoom;
  const height = base.height / safeZoom;
  const cx = base.x + base.width / 2;
  const cy = base.y + base.height / 2;
  return {
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
  };
}

/**
 * Pan a crop rect and clamp it inside the source image.
 */
export function panCropRect(
  crop: CropRect,
  deltaX: number,
  deltaY: number,
  imageWidth: number,
  imageHeight: number
): CropRect {
  const x = Math.min(Math.max(0, crop.x + deltaX), Math.max(0, imageWidth - crop.width));
  const y = Math.min(Math.max(0, crop.y + deltaY), Math.max(0, imageHeight - crop.height));
  return { ...crop, x, y };
}

export function clampCropRect(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number
): CropRect {
  const width = Math.min(crop.width, imageWidth);
  const height = Math.min(crop.height, imageHeight);
  const x = Math.min(Math.max(0, crop.x), Math.max(0, imageWidth - width));
  const y = Math.min(Math.max(0, crop.y), Math.max(0, imageHeight - height));
  return { x, y, width, height };
}

/**
 * Resize so the long edge is at most maxLongEdge, never upscaling.
 */
export function resizedOutputDimensions(
  width: number,
  height: number,
  maxLongEdge: number = PROFILE_PHOTO_PROCESSED_MAX_LONG_EDGE
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxLongEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type ProcessCroppedPhotoInput = {
  source: CanvasImageSource;
  crop: CropRect;
  maxLongEdge?: number;
  quality?: number;
  fileName?: string;
};

export type ProcessCroppedPhotoResult = {
  file: File;
  width: number;
  height: number;
  mimeType: typeof PROFILE_PHOTO_PROCESSED_MIME;
  bytes: number;
};

/**
 * Crop → resize → JPEG compress. Strips EXIF by redrawing to canvas.
 */
export async function processCroppedProfilePhoto(
  input: ProcessCroppedPhotoInput
): Promise<ProcessCroppedPhotoResult> {
  const crop = input.crop;
  if (crop.width < 1 || crop.height < 1) {
    throw new ProfilePhotoProcessError('process', PROFILE_PHOTO_PROCESS_MESSAGES.process);
  }

  const out = resizedOutputDimensions(
    crop.width,
    crop.height,
    input.maxLongEdge ?? PROFILE_PHOTO_PROCESSED_MAX_LONG_EDGE
  );

  const canvas = document.createElement('canvas');
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ProfilePhotoProcessError('process', PROFILE_PHOTO_PROCESS_MESSAGES.process);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    input.source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    out.width,
    out.height
  );

  const quality = input.quality ?? PROFILE_PHOTO_PROCESSED_QUALITY;
  const blob = await canvasToJpegBlob(canvas, quality);
  if (!blob) {
    throw new ProfilePhotoProcessError('process', PROFILE_PHOTO_PROCESS_MESSAGES.process);
  }

  if (blob.size > PROFILE_PHOTO_PROCESSED_MAX_BYTES) {
    // Retry once at a lower quality / slightly smaller edge.
    const tighter = resizedOutputDimensions(crop.width, crop.height, 1600);
    canvas.width = tighter.width;
    canvas.height = tighter.height;
    ctx.drawImage(
      input.source,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      tighter.width,
      tighter.height
    );
    const retry = await canvasToJpegBlob(canvas, 0.75);
    if (!retry || retry.size > PROFILE_PHOTO_PROCESSED_MAX_BYTES) {
      throw new ProfilePhotoProcessError(
        'still_too_large',
        PROFILE_PHOTO_PROCESS_MESSAGES.still_too_large
      );
    }
    const file = new File([retry], buildProcessedFileName(input.fileName), {
      type: PROFILE_PHOTO_PROCESSED_MIME,
      lastModified: Date.now(),
    });
    return {
      file,
      width: tighter.width,
      height: tighter.height,
      mimeType: PROFILE_PHOTO_PROCESSED_MIME,
      bytes: file.size,
    };
  }

  const file = new File([blob], buildProcessedFileName(input.fileName), {
    type: PROFILE_PHOTO_PROCESSED_MIME,
    lastModified: Date.now(),
  });

  return {
    file,
    width: out.width,
    height: out.height,
    mimeType: PROFILE_PHOTO_PROCESSED_MIME,
    bytes: file.size,
  };
}

function buildProcessedFileName(original?: string): string {
  const base = (original || 'profile-photo').replace(/\.[^.]+$/, '');
  const safe = base.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'profile-photo';
  return `${safe}.jpg`;
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), PROFILE_PHOTO_PROCESSED_MIME, quality);
  });
}

/** Calm user-facing message for any processing failure. */
export function calmProfilePhotoError(error: unknown): string {
  if (error instanceof ProfilePhotoProcessError) {
    return error.message;
  }
  return PROFILE_PHOTO_PROCESS_MESSAGES.process;
}
