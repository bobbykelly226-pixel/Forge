'use server';

import { revalidatePath } from 'next/cache';

import { isForgeOperatorUser } from '@/lib/operator/access';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type PhotoModerationActionState = {
  success: boolean;
  message: string;
};

export async function moderateProfilePhotoAction(
  _previousState: PhotoModerationActionState,
  formData: FormData
): Promise<PhotoModerationActionState> {
  const photoId = String(formData.get('photo_id') ?? '').trim();
  const decision = String(formData.get('decision') ?? '').trim();
  const rejectionReason = String(formData.get('rejection_reason') ?? '').trim();

  if (!photoId || !['approved', 'rejected'].includes(decision)) {
    return { success: false, message: 'Choose a valid moderation action.' };
  }

  if (decision === 'rejected' && (rejectionReason.length < 3 || rejectionReason.length > 500)) {
    return {
      success: false,
      message: 'Enter a rejection reason between 3 and 500 characters.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Your session has expired. Sign in again.' };
  }

  if (!isForgeOperatorUser(user)) {
    return { success: false, message: 'You are not authorized to moderate photos.' };
  }

  const admin = createServiceClient();
  if (!admin) {
    return { success: false, message: 'The operator review service is not configured.' };
  }

  const { data, error } = await admin.rpc('review_profile_photo', {
    p_photo_id: photoId,
    p_operator_id: user.id,
    p_decision: decision as 'approved' | 'rejected',
    p_rejection_reason: decision === 'rejected' ? rejectionReason : null,
  });

  if (error) {
    console.error('Profile photo moderation decision could not be saved.', {
      photoId,
      operatorId: user.id,
      decision,
      code: error.code,
      message: error.message,
    });
    return { success: false, message: 'The moderation decision could not be saved.' };
  }

  if (!data) {
    return {
      success: false,
      message: 'This photo is no longer pending. Refresh the queue and try again.',
    };
  }

  revalidatePath('/internal/photo-moderation');
  revalidatePath('/profile');
  revalidatePath('/discovery');

  return {
    success: true,
    message: decision === 'approved' ? 'Photo approved.' : 'Photo rejected.',
  };
}
