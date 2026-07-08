'use server';

import { revalidatePath } from 'next/cache';

import {
  getProfilePhotoPath,
  isAllowedProfilePhotoType,
  PROFILE_PHOTO_BUCKET,
  validateProfilePhoto,
} from '@/lib/profile-photo';
import { createClient } from '@/lib/supabase/server';

type ProfileActionResult = {
  success: boolean;
  message: string;
};

async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const validationError = validateProfilePhoto(file);
  if (validationError) {
    return { url: null, error: validationError };
  }

  if (!isAllowedProfilePhotoType(file.type)) {
    return { url: null, error: 'Please upload a JPG, PNG, WEBP, or GIF image.' };
  }

  const supabase = await createClient();
  const filePath = getProfilePhotoPath(userId, file.type);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(filePath, fileBuffer, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error('Profile photo upload failed:', uploadError.message);
    return { url: null, error: 'Could not upload your profile photo. Please try again.' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(filePath);

  return { url: publicUrl, error: null };
}

export async function saveProfile(formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be signed in to save your profile.' };
  }

  const fullName = (formData.get('full_name') as string)?.trim();
  const ageValue = (formData.get('age') as string)?.trim();
  const location = (formData.get('location') as string)?.trim();
  const relationshipGoal = (formData.get('relationship_goal') as string)?.trim();
  const faithImportance = (formData.get('faith_importance') as string)?.trim();
  const serviceBackground = (formData.get('service_background') as string)?.trim();
  const shortBio = (formData.get('short_bio') as string)?.trim();
  const photoFile = formData.get('profile_photo');

  if (!fullName) {
    return { success: false, message: 'Full name is required.' };
  }

  let age: number | null = null;
  if (ageValue) {
    const parsedAge = Number.parseInt(ageValue, 10);
    if (Number.isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
      return { success: false, message: 'Age must be between 18 and 120.' };
    }
    age = parsedAge;
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('profile_photo_url')
    .eq('id', user.id)
    .maybeSingle();

  let profilePhotoUrl = existingProfile?.profile_photo_url ?? null;

  if (photoFile instanceof File && photoFile.size > 0) {
    const { url, error } = await uploadProfilePhoto(user.id, photoFile);
    if (error) {
      return { success: false, message: error };
    }
    profilePhotoUrl = url;
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: fullName,
      age,
      location: location || null,
      relationship_goal: relationshipGoal || null,
      faith_importance: faithImportance || null,
      service_background: serviceBackground || null,
      short_bio: shortBio || null,
      profile_photo_url: profilePhotoUrl,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Profile save failed:', error.message);
    return { success: false, message: 'Could not save your profile. Please try again.' };
  }

  revalidatePath('/profile');
  revalidatePath('/profile/preview');
  revalidatePath('/app');

  return { success: true, message: 'Your profile has been saved.' };
}
