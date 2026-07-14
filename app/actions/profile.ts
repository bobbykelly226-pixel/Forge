'use server';

import { revalidatePath } from 'next/cache';

import {
  upsertCurrentUserPrivateDetails,
  upsertCurrentUserProfile,
} from '@/lib/data/profile';
import { createClient } from '@/lib/supabase/server';
import { THINGS_I_ENJOY_OPTIONS } from '@/lib/types/profile-answers';
import {
  PROFILE_PHOTO_BUCKET,
  PROFILE_PHOTO_REVALIDATE_PATHS,
  buildPublicProfilePhotoUrl,
} from '@/lib/profile-photo';
import {
  formatPublicLocation,
  toPublicLocationFields,
} from '@/lib/profile/location-format';
import {
  isValidStructuredValue,
  normalizeServiceBackgroundSelection,
  serviceBackgroundDisplayLabel,
  type StructuredFieldKey,
} from '@/lib/profile/structured-options';
import type { Json } from '@/lib/supabase/database.types';

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

function readOptionalString(formData: FormData, key: string): string | null {
  const value = (formData.get(key) as string | null)?.trim() ?? '';
  return value ? value : null;
}

function readStructuredField(
  formData: FormData,
  key: string,
  field: StructuredFieldKey
): { ok: true; value: string | null } | { ok: false; message: string } {
  const raw = readOptionalString(formData, key);
  if (!raw) return { ok: true, value: null };
  if (!isValidStructuredValue(field, raw)) {
    return { ok: false, message: `Please choose a valid option for ${field.replaceAll('_', ' ')}.` };
  }
  return { ok: true, value: raw };
}

function parseOptionalNumber(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
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
  const shortBio = readOptionalString(formData, 'short_bio');
  const moreAbout = readOptionalString(formData, 'more_about');
  const career = readOptionalString(formData, 'career');
  const faithOther = readOptionalString(formData, 'faith_other');
  const faithTradition = readOptionalString(formData, 'faith_tradition');
  const profilePhotoUrlInput = readOptionalString(formData, 'profile_photo_url');
  const storagePathInput = readOptionalString(formData, 'profile_photo_storage_path');

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

  const structuredReads: Array<{
    key: string;
    field: StructuredFieldKey;
  }> = [
    { key: 'relationship_goal', field: 'relationship_goal' },
    { key: 'has_children', field: 'has_children' },
    { key: 'children_count', field: 'children_count' },
    { key: 'children', field: 'children' },
    { key: 'open_to_partner_with_children', field: 'open_to_partner_with_children' },
    { key: 'faith_identity', field: 'faith_identity' },
    { key: 'faith_importance', field: 'faith_importance' },
    { key: 'smoking', field: 'smoking' },
    { key: 'drinking', field: 'drinking' },
    { key: 'education', field: 'education' },
    { key: 'pets', field: 'pets' },
    { key: 'relocation', field: 'relocation' },
  ];

  const structuredValues: Record<string, string | null> = {};
  for (const item of structuredReads) {
    const parsed = readStructuredField(formData, item.key, item.field);
    if (!parsed.ok) {
      return { success: false, message: parsed.message };
    }
    structuredValues[item.key] = parsed.value;
  }

  // Conditional children count — only keep when has_children = yes
  if (structuredValues.has_children !== 'yes') {
    structuredValues.children_count = null;
  }

  // Faith follow-ups
  const faithIdentity = structuredValues.faith_identity;
  const resolvedFaithOther = faithIdentity === 'other' ? faithOther : null;
  const resolvedFaithTradition =
    faithIdentity &&
    ['christian', 'catholic', 'protestant', 'jewish', 'muslim', 'hindu', 'buddhist', 'other'].includes(
      faithIdentity
    )
      ? faithTradition
      : null;

  const serviceRaw = formData.getAll('service_backgrounds').map(String);
  const serviceBackgrounds = normalizeServiceBackgroundSelection(serviceRaw);
  for (const value of serviceBackgrounds) {
    if (!isValidStructuredValue('service_background', value)) {
      return { success: false, message: 'Please choose valid service background options.' };
    }
  }

  const locationCity = readOptionalString(formData, 'location_city');
  const locationRegion = readOptionalString(formData, 'location_region');
  const locationCountry = readOptionalString(formData, 'location_country');
  const locationPostal = readOptionalString(formData, 'location_postal_code');
  const locationPlaceId = readOptionalString(formData, 'location_place_id');
  const locationProvider = readOptionalString(formData, 'location_provider');
  const locationLatitude = parseOptionalNumber(
    readOptionalString(formData, 'location_latitude')
  );
  const locationLongitude = parseOptionalNumber(
    readOptionalString(formData, 'location_longitude')
  );

  const hasLocation = Boolean(locationCity || locationRegion);
  const publicLocation = hasLocation
    ? toPublicLocationFields({
        city: locationCity ?? '',
        region: locationRegion ?? '',
        country: locationCountry ?? 'US',
        postalCode: locationPostal,
        latitude: locationLatitude,
        longitude: locationLongitude,
        placeId: locationPlaceId,
        provider: locationProvider,
      })
    : {
        location: null,
        location_city: null,
        location_region: null,
        location_country: null,
      };

  // Guard: never put postal/coords into public location text.
  if (
    publicLocation.location &&
    (locationPostal || locationLatitude != null || locationLongitude != null)
  ) {
    const safe = formatPublicLocation({
      city: publicLocation.location_city,
      region: publicLocation.location_region,
    });
    if (safe && (safe.includes(locationPostal ?? '___') || /\d{5}/.test(safe))) {
      publicLocation.location = formatPublicLocation({
        city: publicLocation.location_city,
        region: publicLocation.location_region,
      });
    }
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

  // Clear unmapped legacy notes for fields the user has now answered.
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('unmapped_legacy_fields')
    .eq('id', user.id)
    .maybeSingle();

  const previousUnmapped =
    existingProfile?.unmapped_legacy_fields &&
    typeof existingProfile.unmapped_legacy_fields === 'object' &&
    !Array.isArray(existingProfile.unmapped_legacy_fields)
      ? ({ ...(existingProfile.unmapped_legacy_fields as Record<string, string>) } as Record<
          string,
          string
        >)
      : {};

  const clearUnmappedKeys = [
    'relationship_goal',
    'has_children',
    'children',
    'children_count',
    'open_to_partner_with_children',
    'faith_identity',
    'faith_importance',
    'smoking',
    'drinking',
    'education',
    'pets',
    'relocation',
    'service_background',
  ] as const;

  for (const key of clearUnmappedKeys) {
    if (key === 'service_background') {
      if (serviceBackgrounds.length > 0) delete previousUnmapped.service_background;
      continue;
    }
    if (structuredValues[key]) {
      delete previousUnmapped[key];
    }
  }

  const profileFields = {
    full_name: fullName,
    age,
    location: publicLocation.location,
    location_city: publicLocation.location_city,
    location_region: publicLocation.location_region,
    location_country: publicLocation.location_country,
    relationship_goal: structuredValues.relationship_goal,
    has_children: structuredValues.has_children,
    children_count: structuredValues.children_count,
    children: structuredValues.children,
    open_to_partner_with_children: structuredValues.open_to_partner_with_children,
    faith_identity: structuredValues.faith_identity,
    faith_tradition: resolvedFaithTradition,
    faith_other: resolvedFaithOther,
    faith_importance: structuredValues.faith_importance,
    smoking: structuredValues.smoking,
    drinking: structuredValues.drinking,
    education: structuredValues.education,
    pets: structuredValues.pets,
    relocation: structuredValues.relocation,
    career: career,
    service_backgrounds: serviceBackgrounds,
    service_background: serviceBackgroundDisplayLabel(serviceBackgrounds),
    short_bio: shortBio,
    more_about: moreAbout,
    things_i_enjoy: thingsIEnjoy,
    favorite_music_artists: favoriteArtists,
    favorite_music_songs: favoriteSongs,
    unmapped_legacy_fields: previousUnmapped as Json,
    ...(nextPhotoUrl !== undefined ? { profile_photo_url: nextPhotoUrl } : {}),
  };

  const result = await upsertCurrentUserProfile(profileFields);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  // Keep onboarding/alignment answer in sync with the public relationship goal.
  if (structuredValues.relationship_goal) {
    const { error: intentionError } = await supabase.from('profile_answers').upsert(
      {
        user_id: user.id,
        question_key: 'relationship_intention',
        answer: structuredValues.relationship_goal,
        visibility: 'private',
        is_non_negotiable: false,
      },
      { onConflict: 'user_id,question_key' }
    );
    if (intentionError) {
      console.error('saveProfile sync intention:', intentionError.message);
      return {
        success: false,
        message:
          'Your profile saved, but relationship intention could not be synced. Please try again.',
      };
    }
  }

  const privateResult = await upsertCurrentUserPrivateDetails({
    location_city: publicLocation.location_city,
    location_region: publicLocation.location_region,
    location_country: publicLocation.location_country,
    postal_code: hasLocation ? locationPostal : null,
    latitude: hasLocation ? locationLatitude : null,
    longitude: hasLocation ? locationLongitude : null,
    location_place_id: hasLocation ? locationPlaceId : null,
    location_provider: hasLocation ? locationProvider : null,
  });

  if (!privateResult.success) {
    return {
      success: false,
      message:
        'Your public profile saved, but private location details could not be updated. Please try again.',
    };
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
