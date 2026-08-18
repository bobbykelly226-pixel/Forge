import 'server-only';

import { PROFILE_PHOTO_BUCKET } from '@/lib/profile-photo';
import { createServiceClient } from '@/lib/supabase/admin';

const OPERATOR_PHOTO_URL_TTL_SECONDS = 5 * 60;

export type OperatorPhotoReviewItem = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerLocation: string | null;
  storagePath: string;
  displayOrder: number;
  isPrimary: boolean;
  uploadedAt: string;
  signedUrl: string;
};

export type PendingPhotoQueueResult =
  | { success: true; data: OperatorPhotoReviewItem[] }
  | { success: false; message: string };

export async function loadPendingProfilePhotosForOperator(): Promise<PendingPhotoQueueResult> {
  const admin = createServiceClient();
  if (!admin) {
    return {
      success: false,
      message: 'The operator review service is not configured.',
    };
  }

  const { data: photos, error } = await admin
    .from('profile_photos')
    .select('id, user_id, storage_path, display_order, is_primary, created_at')
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Pending profile photos could not be loaded.', {
      code: error.code,
      message: error.message,
    });
    return {
      success: false,
      message: 'Pending photos could not be loaded right now.',
    };
  }

  if (!photos?.length) {
    return { success: true, data: [] };
  }

  const ownerIds = [...new Set(photos.map((photo) => photo.user_id))];
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, full_name, location')
    .in('id', ownerIds);

  if (profilesError) {
    console.error('Photo owner details could not be loaded.', {
      code: profilesError.code,
      message: profilesError.message,
    });
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile] as const)
  );

  const queue = await Promise.all(
    photos.map(async (photo): Promise<OperatorPhotoReviewItem | null> => {
      const { data, error: signingError } = await admin.storage
        .from(PROFILE_PHOTO_BUCKET)
        .createSignedUrl(photo.storage_path, OPERATOR_PHOTO_URL_TTL_SECONDS);

      if (signingError || !data?.signedUrl) {
        console.error('Pending profile photo could not be signed for review.', {
          photoId: photo.id,
          message: signingError?.message ?? 'No signed URL returned.',
        });
        return null;
      }

      const profile = profilesById.get(photo.user_id);
      return {
        id: photo.id,
        ownerId: photo.user_id,
        ownerName: profile?.full_name?.trim() || 'Forge member',
        ownerLocation: profile?.location ?? null,
        storagePath: photo.storage_path,
        displayOrder: photo.display_order,
        isPrimary: photo.is_primary,
        uploadedAt: photo.created_at,
        signedUrl: data.signedUrl,
      };
    })
  );

  return {
    success: true,
    data: queue.filter((photo): photo is OperatorPhotoReviewItem => photo !== null),
  };
}
