import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  PROFILE_PHOTO_CROP_ASPECT,
  PROFILE_PHOTO_ORIGINAL_MAX_BYTES,
  PROFILE_PHOTO_PROCESSED_MAX_BYTES,
  PROFILE_PHOTO_PROCESSED_MAX_LONG_EDGE,
  PROFILE_PHOTO_PROCESS_MESSAGES,
  ProfilePhotoProcessError,
  centeredCropRect,
  clampCropRect,
  isHeicLikeFile,
  panCropRect,
  resizedOutputDimensions,
  validateSelectedProfilePhoto,
  zoomCropRect,
} from '../profile/image-processing';
import {
  PROFILE_PHOTO_MAX_BYTES,
  validateProcessedProfilePhoto,
  validateProfilePhoto,
} from '../profile-photo';

describe('profile photo processing rules', () => {
  it('does not reject originals solely for exceeding 5 MB', () => {
    const largeJpeg = {
      name: 'phone.jpg',
      type: 'image/jpeg',
      size: 12 * 1024 * 1024,
    } as File;
    assert.equal(validateProfilePhoto(largeJpeg), null);
    assert.equal(validateSelectedProfilePhoto(largeJpeg), null);
    assert.ok(largeJpeg.size > PROFILE_PHOTO_MAX_BYTES);
    assert.ok(largeJpeg.size < PROFILE_PHOTO_ORIGINAL_MAX_BYTES);
  });

  it('applies long-edge resizing without upscaling or distorting aspect', () => {
    const landscape = resizedOutputDimensions(4000, 3000, 1920);
    assert.equal(landscape.width, 1920);
    assert.equal(landscape.height, 1440);
    assert.equal(Number((landscape.width / landscape.height).toFixed(2)), 1.33);

    const portrait = resizedOutputDimensions(1200, 1600, 1920);
    assert.equal(portrait.width, 1200);
    assert.equal(portrait.height, 1600);

    const square = resizedOutputDimensions(5000, 5000, PROFILE_PHOTO_PROCESSED_MAX_LONG_EDGE);
    assert.equal(square.width, PROFILE_PHOTO_PROCESSED_MAX_LONG_EDGE);
    assert.equal(square.height, PROFILE_PHOTO_PROCESSED_MAX_LONG_EDGE);
  });

  it('keeps crop aspect at 3:4 for primary and additional photos', () => {
    assert.equal(PROFILE_PHOTO_CROP_ASPECT, 3 / 4);
    const crop = centeredCropRect(4000, 3000, PROFILE_PHOTO_CROP_ASPECT);
    assert.ok(Math.abs(crop.width / crop.height - PROFILE_PHOTO_CROP_ASPECT) < 0.001);
    const zoomed = zoomCropRect(crop, 2);
    assert.ok(Math.abs(zoomed.width / zoomed.height - PROFILE_PHOTO_CROP_ASPECT) < 0.001);
    const panned = clampCropRect(
      panCropRect(zoomed, 5000, -5000, 4000, 3000),
      4000,
      3000
    );
    assert.ok(panned.x >= 0);
    assert.ok(panned.y >= 0);
    assert.ok(panned.x + panned.width <= 4000 + 0.001);
    assert.ok(panned.y + panned.height <= 3000 + 0.001);
  });

  it('rejects HEIC with clear guidance, not a size error', () => {
    const heic = {
      name: 'IMG_0001.HEIC',
      type: 'image/heic',
      size: 2 * 1024 * 1024,
    } as File;
    assert.equal(isHeicLikeFile(heic), true);
    const error = validateSelectedProfilePhoto(heic);
    assert.ok(error instanceof ProfilePhotoProcessError);
    assert.equal(error?.code, 'heic');
    assert.match(error?.message ?? '', /HEIC/i);
    assert.doesNotMatch(error?.message ?? '', /5 MB/i);
  });

  it('validates processed output before upload', () => {
    const ok = {
      name: 'processed.jpg',
      type: 'image/jpeg',
      size: 900_000,
    } as File;
    assert.equal(validateProcessedProfilePhoto(ok), null);

    const tooBig = {
      name: 'processed.jpg',
      type: 'image/jpeg',
      size: PROFILE_PHOTO_PROCESSED_MAX_BYTES + 1,
    } as File;
    assert.match(
      validateProcessedProfilePhoto(tooBig) ?? '',
      /still too large/i
    );
  });

  it('documents calm process messages', () => {
    assert.match(PROFILE_PHOTO_PROCESS_MESSAGES.process, /couldn’t process/i);
    assert.match(PROFILE_PHOTO_PROCESS_MESSAGES.unsupported, /isn’t supported/i);
    assert.match(PROFILE_PHOTO_PROCESS_MESSAGES.still_too_large, /still too large/i);
  });

  it('wires crop dialog and processing into the photo manager', () => {
    const manager = readFileSync(
      join(process.cwd(), 'components/profile/ProfilePhotoManager.tsx'),
      'utf8'
    );
    const crop = readFileSync(
      join(process.cwd(), 'components/profile/ProfilePhotoCropDialog.tsx'),
      'utf8'
    );
    assert.match(manager, /ProfilePhotoCropDialog/);
    assert.match(manager, /loadProfileImage/);
    assert.match(manager, /validateSelectedProfilePhoto/);
    assert.match(manager, /validateProcessedProfilePhoto/);
    assert.match(crop, /profile-photo-crop-dialog/);
    assert.match(crop, /Confirm photo/);
    assert.match(crop, /Cancel/);
    assert.match(crop, /processCroppedProfilePhoto/);
    assert.doesNotMatch(manager, /Image must be 5 MB or smaller/);
  });
});

describe('public profile photo gallery', () => {
  it('starts on primary, wraps, and never mutates primary metadata while browsing', () => {
    const gallery = readFileSync(
      join(process.cwd(), 'components/discovery/ProfilePhotoGallery.tsx'),
      'utf8'
    );
    const presentation = readFileSync(
      join(process.cwd(), 'components/discovery/PublicProfilePresentation.tsx'),
      'utf8'
    );

    assert.match(gallery, /Browsing changes only the active display/);
    assert.match(gallery, /is_primary/);
    assert.doesNotMatch(gallery, /setPrimaryProfilePhoto/);
    assert.doesNotMatch(gallery, /addProfilePhoto|deleteProfilePhoto|reorderProfilePhotos/);
    assert.match(gallery, /goPrev|Previous photo/);
    assert.match(gallery, /goNext|Next photo/);
    assert.match(gallery, /ArrowLeft/);
    assert.match(gallery, /ArrowRight/);
    assert.match(gallery, /onTouchStart/);
    assert.match(gallery, /onTouchEnd/);
    assert.match(gallery, /\(\(index % count\) \+ count\) % count/);
    assert.match(gallery, /gallery-position/);
    assert.match(gallery, /gallery-thumbnails/);
    assert.match(gallery, /primaryIndex/);
    assert.match(presentation, /ProfilePhotoGallery/);
    assert.doesNotMatch(presentation, /Set as primary|Remove photo|Add photo/);
  });

  it('hides arrows and indicators for single-photo profiles', () => {
    const gallery = readFileSync(
      join(process.cwd(), 'components/discovery/ProfilePhotoGallery.tsx'),
      'utf8'
    );
    assert.match(gallery, /hasMultiple/);
    assert.match(gallery, /count > 1/);
  });

  it('keeps thumbnail strip self-contained without page overflow classes on the page root', () => {
    const gallery = readFileSync(
      join(process.cwd(), 'components/discovery/ProfilePhotoGallery.tsx'),
      'utf8'
    );
    assert.match(gallery, /overflow-x-auto/);
    assert.match(gallery, /shrink-0/);
  });
});
