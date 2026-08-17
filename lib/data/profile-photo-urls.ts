import 'server-only';

import { PROFILE_PHOTO_BUCKET } from '@/lib/profile-photo';
import type { createClient } from '@/lib/supabase/server';

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const PROFILE_PHOTO_SIGNED_URL_TTL_SECONDS = 5 * 60;

export async function signProfilePhotoRows<
  T extends { storage_path: string }
>(
  supabase: ServerSupabaseClient,
  photos: readonly T[],
  expiresIn = PROFILE_PHOTO_SIGNED_URL_TTL_SECONDS
): Promise<Array<T & { public_url: string | null }>> {
  return Promise.all(
    photos.map(async (photo) => {
      const { data, error } = await supabase.storage
        .from(PROFILE_PHOTO_BUCKET)
        .createSignedUrl(photo.storage_path, expiresIn);

      if (error) {
        console.error('signProfilePhotoRows:', error.message);
      }

      return {
        ...photo,
        public_url: error ? null : data?.signedUrl ?? null,
      };
    })
  );
}
