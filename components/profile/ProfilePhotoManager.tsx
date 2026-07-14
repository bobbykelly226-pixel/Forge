'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Trash2, Upload } from 'lucide-react';

import {
  addProfilePhoto,
  deleteProfilePhoto,
  reorderProfilePhotos,
  replaceProfilePhoto,
  setPrimaryProfilePhoto,
} from '@/app/actions/profile';
import ProfilePhotoCropDialog from '@/components/profile/ProfilePhotoCropDialog';
import {
  MAX_PROFILE_PHOTOS,
  MAX_PROFILE_PHOTOS_MESSAGE,
  PROFILE_PHOTO_BUCKET,
  canAddAnotherProfilePhoto,
  createUniqueProfilePhotoPath,
  type ManagedProfilePhoto,
  validateProcessedProfilePhoto,
} from '@/lib/profile-photo';
import {
  type LoadedProfileImage,
  calmProfilePhotoError,
  loadProfileImage,
  validateSelectedProfilePhoto,
} from '@/lib/profile/image-processing';
import { createClient } from '@/lib/supabase/client';

export type ProfilePhotoManagerProps = {
  initialPhotos: ManagedProfilePhoto[];
  disabled?: boolean;
  onChange: (next: {
    photos: ManagedProfilePhoto[];
    primaryPhotoUrl: string | null;
  }) => void;
};

type PendingCrop = {
  image: LoadedProfileImage;
  fileName: string;
  replaceId: string | null;
};

export default function ProfilePhotoManager({
  initialPhotos,
  disabled,
  onChange,
}: ProfilePhotoManagerProps) {
  const [photos, setPhotos] = useState<ManagedProfilePhoto[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyResult = (result: {
    success: boolean;
    message: string;
    photos?: ManagedProfilePhoto[];
    primaryPhotoUrl?: string | null;
  }) => {
    if (!result.success) {
      setError(result.message);
      return false;
    }
    const nextPhotos = result.photos ?? photos;
    setPhotos(nextPhotos);
    onChange({
      photos: nextPhotos,
      primaryPhotoUrl: result.primaryPhotoUrl ?? null,
    });
    setError(null);
    return true;
  };

  const uploadProcessedFile = async (file: File, replaceId: string | null) => {
    const processedError = validateProcessedProfilePhoto(file);
    if (processedError) {
      setError(processedError);
      return;
    }
    if (!replaceId && !canAddAnotherProfilePhoto(photos.length)) {
      setError(MAX_PROFILE_PHOTOS_MESSAGE);
      return;
    }

    setBusy(true);
    setError(null);
    let uploadedPath: string | null = null;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to upload a profile photo.');

      const filePath = createUniqueProfilePhotoPath(user.id, 'image/jpeg');
      uploadedPath = filePath;
      const { error: uploadError } = await supabase.storage
        .from(PROFILE_PHOTO_BUCKET)
        .upload(filePath, file, {
          upsert: false,
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      if (uploadError) throw new Error('Could not upload your profile photo.');

      const result = replaceId
        ? await replaceProfilePhoto({ photoId: replaceId, storagePath: filePath })
        : await addProfilePhoto({ storagePath: filePath });

      if (!result.success) {
        await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([filePath]);
        setError(result.message);
        return;
      }

      applyResult(result);
    } catch (err) {
      if (uploadedPath) {
        try {
          const supabase = createClient();
          await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([uploadedPath]);
        } catch {
          // Best-effort orphan cleanup.
        }
      }
      setError(calmProfilePhotoError(err));
    } finally {
      setBusy(false);
      setReplaceTargetId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const replaceId = replaceTargetId;
    event.target.value = '';
    if (!file) return;

    if (!replaceId && !canAddAnotherProfilePhoto(photos.length)) {
      setError(MAX_PROFILE_PHOTOS_MESSAGE);
      return;
    }

    const selectionError = validateSelectedProfilePhoto(file);
    if (selectionError) {
      setError(selectionError.message);
      setReplaceTargetId(null);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const loaded = await loadProfileImage(file);
      setPendingCrop({
        image: loaded,
        fileName: file.name,
        replaceId,
      });
    } catch (err) {
      setError(calmProfilePhotoError(err));
      setReplaceTargetId(null);
    } finally {
      setBusy(false);
    }
  };

  const movePhoto = async (photoId: string, direction: -1 | 1) => {
    const index = photos.findIndex((photo) => photo.id === photoId);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= photos.length) return;

    const nextOrder = [...photos];
    const [item] = nextOrder.splice(index, 1);
    nextOrder.splice(nextIndex, 0, item!);
    const orderedIds = nextOrder.map((photo) => photo.id);

    setBusy(true);
    setError(null);
    try {
      const result = await reorderProfilePhotos(orderedIds);
      applyResult(result);
    } finally {
      setBusy(false);
    }
  };

  const onSetPrimary = async (photoId: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await setPrimaryProfilePhoto(photoId);
      applyResult(result);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (photoId: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await deleteProfilePhoto(photoId);
      applyResult(result);
    } finally {
      setBusy(false);
    }
  };

  const atLimit = !canAddAnotherProfilePhoto(photos.length);

  return (
    <div className="space-y-4" data-testid="profile-photo-manager">
      <div>
        <p className="text-sm font-medium text-[#0B2D5C]">Your photos</p>
        <p className="mt-1 text-sm text-[#5A6575]">
          Add up to {MAX_PROFILE_PHOTOS}. Large phone photos are resized before upload.
          The primary photo appears first on your profile and in Discovery.
        </p>
      </div>

      {photos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#0B2D5C]/20 bg-[#EEF2F7] px-4 py-6 text-center text-sm text-[#5A6575]">
          No photos yet. Add a clear recent photo to get started.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => {
            const src = photo.public_url;
            return (
              <li
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-[#0B2D5C]/12 bg-white"
                data-photo-id={photo.id}
                data-primary={photo.is_primary ? 'true' : 'false'}
              >
                <div className="relative aspect-square bg-[#EEF2F7]">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  {photo.is_primary ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#0B2D5C] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Primary
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 p-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      aria-label="Move photo earlier"
                      disabled={disabled || busy || index === 0}
                      onClick={() => void movePhoto(photo.id, -1)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0B2D5C]/15 text-[#0B2D5C] disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move photo later"
                      disabled={disabled || busy || index === photos.length - 1}
                      onClick={() => void movePhoto(photo.id, 1)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0B2D5C]/15 text-[#0B2D5C] disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  {!photo.is_primary ? (
                    <button
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => void onSetPrimary(photo.id)}
                      className="w-full rounded-xl border border-[#0B2D5C]/15 px-2 py-2 text-xs font-semibold text-[#0B2D5C] disabled:opacity-60"
                    >
                      Set as primary
                    </button>
                  ) : (
                    <p className="py-2 text-center text-xs font-medium text-[#5A6575]">
                      Shown as your main photo
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => {
                        setReplaceTargetId(photo.id);
                        fileInputRef.current?.click();
                      }}
                      className="rounded-xl border border-[#0B2D5C]/15 px-2 py-2 text-xs font-semibold text-[#0B2D5C] disabled:opacity-60"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => void onDelete(photo.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#D62828]/25 px-2 py-2 text-xs font-semibold text-[#D62828] disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
          className="hidden"
          disabled={disabled || busy}
          onChange={(event) => void onFileChange(event)}
        />
        <button
          type="button"
          disabled={disabled || busy || atLimit}
          onClick={() => {
            setReplaceTargetId(null);
            fileInputRef.current?.click();
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/20 bg-white px-5 py-3.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-[#EEF2F7] disabled:opacity-60"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Working…' : atLimit ? 'Photo limit reached' : 'Add photo'}
        </button>
        {atLimit ? (
          <p className="text-center text-xs text-[#5A6575]">{MAX_PROFILE_PHOTOS_MESSAGE}</p>
        ) : (
          <p className="text-center text-xs text-[#8A93A0]">
            {photos.length} of {MAX_PROFILE_PHOTOS} photos · JPG, PNG, or WebP
          </p>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {pendingCrop ? (
        <ProfilePhotoCropDialog
          image={pendingCrop.image}
          fileName={pendingCrop.fileName}
          onCancel={() => {
            setPendingCrop(null);
            setReplaceTargetId(null);
          }}
          onConfirm={(processed) => {
            const replaceId = pendingCrop.replaceId;
            setPendingCrop(null);
            void uploadProcessedFile(processed, replaceId);
          }}
        />
      ) : null}
    </div>
  );
}
