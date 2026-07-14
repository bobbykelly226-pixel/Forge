'use server';

import { revalidatePath } from 'next/cache';

import { upsertCurrentUserProfile } from '@/lib/data/profile';
import { createClient } from '@/lib/supabase/server';
import { THINGS_I_ENJOY_OPTIONS } from '@/lib/types/profile-answers';
import {
  PROFILE_PHOTO_BUCKET,
  PROFILE_PHOTO_REVALIDATE_PATHS,
  buildPublicProfilePhotoUrl,
} from '@/lib/profile-photo';

type ProfileActionResult = {
  success: boolean;
  message: string;
  profilePhotoUrl?: string | null;
};

function parseLineList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEnjoySelection(formData: FormData): string[] {
  const selected = formData.getAll('things_i_enjoy').map(String);
  const allowed = new Set<string>(THINGS_I_ENJOY_OPTIONS);
  return THINGS_I_ENJOY_OPTIONS.filter((label) => selected.includes(label)).filter((label) =>
    allowed.has(label)
  );
}

function revalidateProfileRoutes() {
  for (const path of PROFILE_PHOTO_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  revalidatePath('/app');
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
  const moreAbout = (formData.get('more_about') as string)?.trim();
  const children = (formData.get('children') as string)?.trim();
  const hasChildren = (formData.get('has_children') as string)?.trim();
  const education = (formData.get('education') as string)?.trim();
  const pets = (formData.get('pets') as string)?.trim();
  const smoking = (formData.get('smoking') as string)?.trim();
  const drinking = (formData.get('drinking') as string)?.trim();
  const career = (formData.get('career') as string)?.trim();
  const relocation = (formData.get('relocation') as string)?.trim();
  const profilePhotoUrlInput = (formData.get('profile_photo_url') as string)?.trim();
  const storagePathInput = (formData.get('profile_photo_storage_path') as string)?.trim();

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

  const { data: existingPhotos, error: existingPhotosError } = await supabase
    .from('profile_photos')
    .select('id, storage_path, is_primary, display_order')
    .eq('user_id', user.id)
    .order('display_order', { ascending: true });

  if (existingPhotosError) {
    console.error('saveProfile load photos:', existingPhotosError.message);
    return { success: false, message: 'Could not load your current photos. Please try again.' };
  }

  const replacingPhoto = Boolean(profilePhotoUrlInput && storagePathInput);
  if (replacingPhoto) {
    if (!storagePathInput!.startsWith(`${user.id}/`)) {
      return { success: false, message: 'Invalid photo path.' };
    }
  }

  const previousPaths = (existingPhotos ?? [])
    .map((photo) => photo.storage_path)
    .filter((path) => path && path !== storagePathInput);

  let nextPhotoUrl: string | null | undefined = undefined;
  if (replacingPhoto) {
    nextPhotoUrl =
      profilePhotoUrlInput || buildPublicProfilePhotoUrl(storagePathInput!) || null;
  }

  const thingsIEnjoy = parseEnjoySelection(formData);
  const favoriteArtists = parseLineList(formData.get('favorite_music_artists') as string | null);
  const favoriteSongs = parseLineList(formData.get('favorite_music_songs') as string | null);

  const profileFields = {
    full_name: fullName,
    age,
    location: location || null,
    relationship_goal: relationshipGoal || null,
    faith_importance: faithImportance || null,
    service_background: serviceBackground || null,
    short_bio: shortBio || null,
    more_about: moreAbout || null,
    children: children || null,
    has_children: hasChildren || null,
    education: education || null,
    pets: pets || null,
    smoking: smoking || null,
    drinking: drinking || null,
    career: career || null,
    relocation: relocation || null,
    things_i_enjoy: thingsIEnjoy,
    favorite_music_artists: favoriteArtists,
    favorite_music_songs: favoriteSongs,
    ...(nextPhotoUrl !== undefined ? { profile_photo_url: nextPhotoUrl } : {}),
  };

  const result = await upsertCurrentUserProfile(profileFields);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  let authoritativePhotoUrl = result.data.profile_photo_url;

  if (replacingPhoto && storagePathInput) {
    const primary = (existingPhotos ?? []).find((photo) => photo.is_primary);
    const target = primary ?? existingPhotos?.[0] ?? null;

    if (target) {
      const { error: clearError } = await supabase
        .from('profile_photos')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .neq('id', target.id);

      if (clearError) {
        console.error('saveProfile clear primary:', clearError.message);
        return {
          success: false,
          message: 'Your profile text saved, but the photo could not be updated. Please try again.',
        };
      }

      const { data: updatedPhoto, error: updateError } = await supabase
        .from('profile_photos')
        .update({
          storage_path: storagePathInput,
          is_primary: true,
          display_order: 0,
        })
        .eq('id', target.id)
        .eq('user_id', user.id)
        .select('id, storage_path, is_primary')
        .single();

      if (updateError || !updatedPhoto) {
        console.error('saveProfile update photo:', updateError?.message);
        return {
          success: false,
          message: 'Your profile text saved, but the photo could not be updated. Please try again.',
        };
      }

      if (updatedPhoto.storage_path !== storagePathInput || !updatedPhoto.is_primary) {
        return {
          success: false,
          message: 'Photo update could not be confirmed. Please try again.',
        };
      }
    } else {
      const { data: insertedPhoto, error: insertError } = await supabase
        .from('profile_photos')
        .insert({
          user_id: user.id,
          storage_path: storagePathInput,
          display_order: 0,
          is_primary: true,
          moderation_status: 'approved',
        })
        .select('id, storage_path, is_primary')
        .single();

      if (insertError || !insertedPhoto) {
        console.error('saveProfile insert photo:', insertError?.message);
        return {
          success: false,
          message: 'Your profile text saved, but the photo could not be saved. Please try again.',
        };
      }
    }

    // Confirm profiles.profile_photo_url matches the new public URL.
    const { data: confirmedProfile, error: confirmError } = await supabase
      .from('profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .single();

    if (confirmError || confirmedProfile?.profile_photo_url !== nextPhotoUrl) {
      console.error('saveProfile confirm url:', confirmError?.message);
      return {
        success: false,
        message: 'Photo save could not be confirmed. Please try again.',
      };
    }

    authoritativePhotoUrl = confirmedProfile.profile_photo_url;

    // Delete previous objects only after DB confirmation.
    for (const oldPath of previousPaths) {
      const { error: removeError } = await supabase.storage
        .from(PROFILE_PHOTO_BUCKET)
        .remove([oldPath]);
      if (removeError) {
        console.error('saveProfile remove old photo:', removeError.message);
      }
    }
  }

  revalidateProfileRoutes();

  return {
    success: true,
    message: 'Your profile has been saved.',
    profilePhotoUrl: authoritativePhotoUrl,
  };
}
