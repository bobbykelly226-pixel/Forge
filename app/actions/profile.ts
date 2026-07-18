'use server';

import { revalidatePath } from 'next/cache';

import {
  upsertCurrentUserPrivateDetails,
  upsertCurrentUserProfile,
} from '@/lib/data/profile';
import { createClient } from '@/lib/supabase/server';
import { CORE_VALUES_OPTIONS, THINGS_I_ENJOY_OPTIONS } from '@/lib/types/profile-answers';
import {
  MAX_PROFILE_PHOTOS,
  MAX_PROFILE_PHOTOS_MESSAGE,
  PROFILE_PHOTO_BUCKET,
  PROFILE_PHOTO_REVALIDATE_PATHS,
  buildPublicProfilePhotoUrl,
} from '@/lib/profile-photo';
import {
  formatPublicLocation,
  toPublicLocationFields,
} from '@/lib/profile/location-format';
import {
  normalizeDrinkingPartnerPreferences,
  normalizePetTypeSelection,
  normalizePetsAllergyTypes,
  normalizePetsIdentity,
  normalizePetsPartnerPreferences,
  normalizeSmokingPartnerPreferences,
  normalizeSmokingProductSelection,
  parsePetsAllergyConstraintFormValue,
  smokingUsesProducts,
} from '@/lib/profile/lifestyle-compatibility';
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

function readMultiField(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map(String)
    .map((value) => value.trim())
    .filter(Boolean);
}

function readLifestylePetsFields(formData: FormData) {
  const petsRaw = readOptionalString(formData, 'pets');
  const petsIdentity = petsRaw ? normalizePetsIdentity(petsRaw) || petsRaw : null;
  if (petsIdentity && !isValidStructuredValue('pets', petsIdentity)) {
    return { ok: false as const, message: 'Please choose a valid option for pets.' };
  }

  const hasPets = petsIdentity === 'yes';
  const answeredIdentity = Boolean(petsIdentity);
  const petsTypes = hasPets
    ? normalizePetTypeSelection(readMultiField(formData, 'pets_types'))
    : [];
  const partnerPrefs = answeredIdentity
    ? normalizePetsPartnerPreferences(readMultiField(formData, 'pets_partner_preferences'))
    : [];
  // Tri-state: yes → true, no → false, unanswered/empty → null.
  // Do not collapse false with a truthiness check (false === unanswered).
  const allergyRaw = answeredIdentity
    ? readOptionalString(formData, 'pets_allergy_constraint')
    : null;
  const allergyConstraint = answeredIdentity
    ? parsePetsAllergyConstraintFormValue(allergyRaw)
    : null;
  const allergyTypes =
    answeredIdentity && allergyConstraint === true
      ? normalizePetsAllergyTypes(readMultiField(formData, 'pets_allergy_types'))
      : [];

  return {
    ok: true as const,
    fields: {
      pets: petsIdentity === '' ? null : petsIdentity,
      pets_types: petsTypes,
      pets_partner_preferences: partnerPrefs,
      pets_allergy_constraint: allergyConstraint,
      pets_allergy_types: allergyTypes,
    },
  };
}

function readLifestyleSmokingFields(formData: FormData) {
  const smoking = readStructuredField(formData, 'smoking', 'smoking');
  if (!smoking.ok) return smoking;

  const usesProducts = smokingUsesProducts(smoking.value);
  const productTypes = usesProducts
    ? normalizeSmokingProductSelection(readMultiField(formData, 'smoking_product_types'))
    : [];
  const productOther =
    usesProducts && productTypes.includes('other')
      ? readOptionalString(formData, 'smoking_product_other')
      : null;
  const partnerPrefs = smoking.value
    ? normalizeSmokingPartnerPreferences(readMultiField(formData, 'smoking_partner_preferences'))
    : [];

  return {
    ok: true as const,
    fields: {
      smoking: smoking.value,
      smoking_product_types: productTypes,
      smoking_product_other: productOther,
      smoking_partner_preferences: partnerPrefs,
    },
  };
}

function readLifestyleDrinkingFields(formData: FormData) {
  const drinking = readStructuredField(formData, 'drinking', 'drinking');
  if (!drinking.ok) return drinking;

  // Normalize legacy occasionally → rarely at write time.
  const normalized =
    drinking.value === 'occasionally' ? 'rarely' : drinking.value;

  const partnerPrefs = normalized
    ? normalizeDrinkingPartnerPreferences(
        readMultiField(formData, 'drinking_partner_preferences')
      )
    : [];

  return {
    ok: true as const,
    fields: {
      drinking: normalized,
      drinking_partner_preferences: partnerPrefs,
    },
  };
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

  const petsLifestyle = readLifestylePetsFields(formData);
  if (!petsLifestyle.ok) {
    return { success: false, message: petsLifestyle.message };
  }
  const smokingLifestyle = readLifestyleSmokingFields(formData);
  if (!smokingLifestyle.ok) {
    return { success: false, message: smokingLifestyle.message };
  }
  const drinkingLifestyle = readLifestyleDrinkingFields(formData);
  if (!drinkingLifestyle.ok) {
    return { success: false, message: drinkingLifestyle.message };
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
    smoking: smokingLifestyle.fields.smoking,
    smoking_product_types: smokingLifestyle.fields.smoking_product_types,
    smoking_product_other: smokingLifestyle.fields.smoking_product_other,
    smoking_partner_preferences: smokingLifestyle.fields.smoking_partner_preferences,
    drinking: drinkingLifestyle.fields.drinking,
    drinking_partner_preferences: drinkingLifestyle.fields.drinking_partner_preferences,
    education: structuredValues.education,
    pets: petsLifestyle.fields.pets,
    pets_types: petsLifestyle.fields.pets_types,
    pets_partner_preferences: petsLifestyle.fields.pets_partner_preferences,
    pets_allergy_constraint: petsLifestyle.fields.pets_allergy_constraint,
    pets_allergy_types: petsLifestyle.fields.pets_allergy_types,
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

export type ProfileSectionSaveResult = ProfileActionResult & {
  profile?: Record<string, unknown>;
  coreValues?: string[];
};

async function clearUnmappedKeysForFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  answeredKeys: string[]
): Promise<Json> {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('unmapped_legacy_fields')
    .eq('id', userId)
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

  for (const key of answeredKeys) {
    if (previousUnmapped[key]) delete previousUnmapped[key];
  }

  return previousUnmapped as Json;
}

/**
 * Save a single My Profile workspace section without rewriting unrelated fields.
 * Authoritative shared save path for the unified /profile editor.
 */
export async function saveProfileSection(
  sectionId: string,
  formData: FormData
): Promise<ProfileSectionSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be signed in to save your profile.' };
  }

  if (!isValidSectionId(sectionId)) {
    return { success: false, message: 'Unknown profile section.' };
  }

  if (sectionId === 'voice' || sectionId === 'video') {
    return { success: false, message: 'This section is coming soon.' };
  }

  if (sectionId === 'factors') {
    const selected = formData.getAll('core_values').map(String);
    const allowed = new Set<string>(CORE_VALUES_OPTIONS);
    const coreValues = CORE_VALUES_OPTIONS.filter((label) => selected.includes(label)).filter(
      (label) => allowed.has(label)
    );

    const { error } = await supabase.from('profile_answers').upsert(
      {
        user_id: user.id,
        question_key: 'core_values',
        answer: coreValues,
        visibility: 'private',
        is_non_negotiable: false,
      },
      { onConflict: 'user_id,question_key' }
    );

    if (error) {
      console.error('saveProfileSection factors:', error.message);
      return { success: false, message: 'Could not save your values. Please try again.' };
    }

    revalidateProfileRoutes();
    return {
      success: true,
      message: 'Saved.',
      coreValues,
    };
  }

  if (sectionId === 'photo') {
    const profilePhotoUrlInput = readOptionalString(formData, 'profile_photo_url');
    const storagePathInput = readOptionalString(formData, 'profile_photo_storage_path');

    if (!profilePhotoUrlInput || !storagePathInput) {
      return { success: false, message: 'Choose a photo to upload before saving.' };
    }
    if (!storagePathInput.startsWith(`${user.id}/`)) {
      return { success: false, message: 'Invalid photo path.' };
    }

    // Reuse full save path by synthesizing a minimal profile payload would wipe fields.
    // Handle photo-only write here.
    const { data: existingPhotos, error: existingPhotosError } = await supabase
      .from('profile_photos')
      .select('id, storage_path, is_primary, display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });

    if (existingPhotosError) {
      return { success: false, message: 'Could not load your current photos. Please try again.' };
    }

    const previousPaths = (existingPhotos ?? [])
      .map((photo) => photo.storage_path)
      .filter((path) => path && path !== storagePathInput);

    const nextPhotoUrl =
      profilePhotoUrlInput || buildPublicProfilePhotoUrl(storagePathInput) || null;

    const profileResult = await upsertCurrentUserProfile({
      profile_photo_url: nextPhotoUrl,
    });
    if (!profileResult.success) {
      return { success: false, message: profileResult.message };
    }

    const primary = (existingPhotos ?? []).find((photo) => photo.is_primary);
    const target = primary ?? existingPhotos?.[0] ?? null;

    if (target) {
      await supabase
        .from('profile_photos')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .neq('id', target.id);

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

      if (updateError || !updatedPhoto || updatedPhoto.storage_path !== storagePathInput) {
        return {
          success: false,
          message: 'Your photo could not be updated. Please try again.',
        };
      }
    } else {
      const { error: insertError } = await supabase.from('profile_photos').insert({
        user_id: user.id,
        storage_path: storagePathInput,
        display_order: 0,
        is_primary: true,
        moderation_status: 'approved',
      });
      if (insertError) {
        return {
          success: false,
          message: 'Your photo could not be saved. Please try again.',
        };
      }
    }

    for (const oldPath of previousPaths) {
      await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([oldPath]);
    }

    revalidateProfileRoutes();
    return {
      success: true,
      message: 'Saved.',
      profilePhotoUrl: nextPhotoUrl,
      profile: { profile_photo_url: nextPhotoUrl },
    };
  }

  const fields: Record<string, unknown> = {};
  const answeredUnmapped: string[] = [];

  if (sectionId === 'basics') {
    const fullName = (formData.get('full_name') as string)?.trim();
    if (!fullName) {
      return { success: false, message: 'Full name is required.' };
    }
    const ageValue = (formData.get('age') as string)?.trim();
    let age: number | null = null;
    if (ageValue) {
      const parsedAge = Number.parseInt(ageValue, 10);
      if (Number.isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
        return { success: false, message: 'Age must be between 18 and 120.' };
      }
      age = parsedAge;
    }
    fields.full_name = fullName;
    fields.age = age;
  }

  if (sectionId === 'about') {
    // Canonical public biography lives in short_bio. Clear legacy more_about on save
    // so dual-field content is not re-combined on the next read.
    fields.short_bio = readOptionalString(formData, 'short_bio');
    fields.more_about = null;
  }

  if (sectionId === 'career') {
    fields.career = readOptionalString(formData, 'career');
  }

  if (sectionId === 'relationship') {
    const parsed = readStructuredField(formData, 'relationship_goal', 'relationship_goal');
    if (!parsed.ok) return { success: false, message: parsed.message };
    fields.relationship_goal = parsed.value;
    if (parsed.value) answeredUnmapped.push('relationship_goal');
  }

  if (sectionId === 'children') {
    for (const item of [
      { key: 'has_children', field: 'has_children' as const },
      { key: 'children_count', field: 'children_count' as const },
      { key: 'children', field: 'children' as const },
      {
        key: 'open_to_partner_with_children',
        field: 'open_to_partner_with_children' as const,
      },
    ]) {
      const parsed = readStructuredField(formData, item.key, item.field);
      if (!parsed.ok) return { success: false, message: parsed.message };
      fields[item.key] = parsed.value;
      if (parsed.value) answeredUnmapped.push(item.key);
    }
    if (fields.has_children !== 'yes') {
      fields.children_count = null;
    }
  }

  if (sectionId === 'faith') {
    const identity = readStructuredField(formData, 'faith_identity', 'faith_identity');
    if (!identity.ok) return { success: false, message: identity.message };
    const importance = readStructuredField(formData, 'faith_importance', 'faith_importance');
    if (!importance.ok) return { success: false, message: importance.message };
    const faithOther = readOptionalString(formData, 'faith_other');
    const faithTradition = readOptionalString(formData, 'faith_tradition');
    fields.faith_identity = identity.value;
    fields.faith_importance = importance.value;
    fields.faith_other = identity.value === 'other' ? faithOther : null;
    fields.faith_tradition =
      identity.value &&
      ['christian', 'catholic', 'protestant', 'jewish', 'muslim', 'hindu', 'buddhist', 'other'].includes(
        identity.value
      )
        ? faithTradition
        : null;
    if (identity.value) answeredUnmapped.push('faith_identity');
    if (importance.value) answeredUnmapped.push('faith_importance');
  }

  if (sectionId === 'pets') {
    const parsed = readLifestylePetsFields(formData);
    if (!parsed.ok) return { success: false, message: parsed.message };
    Object.assign(fields, parsed.fields);
    if (parsed.fields.pets) answeredUnmapped.push('pets');
  }

  if (sectionId === 'smoking') {
    const parsed = readLifestyleSmokingFields(formData);
    if (!parsed.ok) return { success: false, message: parsed.message };
    Object.assign(fields, parsed.fields);
    if (parsed.fields.smoking) answeredUnmapped.push('smoking');
  }

  if (sectionId === 'drinking') {
    const parsed = readLifestyleDrinkingFields(formData);
    if (!parsed.ok) return { success: false, message: parsed.message };
    Object.assign(fields, parsed.fields);
    if (parsed.fields.drinking) answeredUnmapped.push('drinking');
  }

  for (const single of [
    { id: 'education', key: 'education', field: 'education' as const },
    { id: 'relocation', key: 'relocation', field: 'relocation' as const },
  ] as const) {
    if (sectionId === single.id) {
      const parsed = readStructuredField(formData, single.key, single.field);
      if (!parsed.ok) return { success: false, message: parsed.message };
      fields[single.key] = parsed.value;
      if (parsed.value) answeredUnmapped.push(single.key);
    }
  }

  if (sectionId === 'service') {
    const serviceRaw = formData.getAll('service_backgrounds').map(String);
    const serviceBackgrounds = normalizeServiceBackgroundSelection(serviceRaw);
    for (const value of serviceBackgrounds) {
      if (!isValidStructuredValue('service_background', value)) {
        return { success: false, message: 'Please choose valid service background options.' };
      }
    }
    fields.service_backgrounds = serviceBackgrounds;
    fields.service_background = serviceBackgroundDisplayLabel(serviceBackgrounds);
    if (serviceBackgrounds.length > 0) answeredUnmapped.push('service_background');
  }

  if (sectionId === 'enjoy') {
    fields.things_i_enjoy = parseEnjoySelection(formData);
  }

  if (sectionId === 'music') {
    fields.favorite_music_artists = parseLineList(
      formData.get('favorite_music_artists') as string | null
    );
    fields.favorite_music_songs = parseLineList(
      formData.get('favorite_music_songs') as string | null
    );
  }

  if (sectionId === 'location') {
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

    fields.location = publicLocation.location;
    fields.location_city = publicLocation.location_city;
    fields.location_region = publicLocation.location_region;
    fields.location_country = publicLocation.location_country;

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
      return { success: false, message: privateResult.message };
    }
  }

  if (answeredUnmapped.length > 0) {
    fields.unmapped_legacy_fields = await clearUnmappedKeysForFields(
      supabase,
      user.id,
      answeredUnmapped
    );
  }

  const result = await upsertCurrentUserProfile(fields);
  if (!result.success) {
    // Upsert already logs the underlying Supabase/Postgres error in preview/dev.
    // Include section context here so Vercel function logs show which section failed.
    if (
      process.env.VERCEL_ENV === 'preview' ||
      process.env.NODE_ENV === 'development'
    ) {
      console.error('saveProfileSection failed:', {
        sectionId,
        fieldKeys: Object.keys(fields).sort(),
        message: result.message,
      });
    }
    return { success: false, message: result.message };
  }

  if (sectionId === 'relationship' && typeof fields.relationship_goal === 'string') {
    const { error: intentionError } = await supabase.from('profile_answers').upsert(
      {
        user_id: user.id,
        question_key: 'relationship_intention',
        answer: fields.relationship_goal,
        visibility: 'private',
        is_non_negotiable: false,
      },
      { onConflict: 'user_id,question_key' }
    );
    if (intentionError) {
      console.error('saveProfileSection sync intention:', intentionError.message);
      return {
        success: false,
        message: 'Your profile saved, but relationship intention could not be synced.',
      };
    }
  }

  revalidateProfileRoutes();

  return {
    success: true,
    message: 'Saved.',
    profile: fields,
    profilePhotoUrl: result.data.profile_photo_url,
  };
}

function isValidSectionId(value: string): boolean {
  return [
    'photo',
    'basics',
    'location',
    'about',
    'relationship',
    'children',
    'faith',
    'smoking',
    'drinking',
    'education',
    'pets',
    'relocation',
    'career',
    'service',
    'enjoy',
    'music',
    'factors',
    'voice',
    'video',
  ].includes(value);
}

export type ProfilePhotoActionResult = {
  success: boolean;
  message: string;
  photos?: Array<{
    id: string;
    storage_path: string;
    display_order: number;
    is_primary: boolean;
    public_url: string | null;
  }>;
  primaryPhotoUrl?: string | null;
};

async function loadOwnerPhotos(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return supabase
    .from('profile_photos')
    .select('id, storage_path, is_primary, display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });
}

function mapPhotoRows(
  rows: Array<{
    id: string;
    storage_path: string;
    is_primary: boolean;
    display_order: number;
  }>
) {
  return rows.map((photo) => ({
    id: photo.id,
    storage_path: photo.storage_path,
    display_order: photo.display_order,
    is_primary: photo.is_primary,
    public_url: buildPublicProfilePhotoUrl(photo.storage_path),
  }));
}

async function syncLegacyPrimaryPhotoUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  photos: Array<{ storage_path: string; is_primary: boolean; display_order: number }>
): Promise<string | null> {
  const primary =
    photos.find((photo) => photo.is_primary) ??
    [...photos].sort((a, b) => a.display_order - b.display_order)[0] ??
    null;
  const nextUrl = primary
    ? buildPublicProfilePhotoUrl(primary.storage_path)
    : null;

  const result = await upsertCurrentUserProfile({
    profile_photo_url: nextUrl,
  });
  if (!result.success) {
    throw new Error(result.message);
  }
  return nextUrl;
}

/**
 * Persist a newly uploaded photo after client storage upload succeeds.
 * Does not report success unless metadata + primary rules are valid.
 * On metadata failure, caller should remove the orphan storage object.
 */
export async function addProfilePhoto(input: {
  storagePath: string;
  publicUrl?: string | null;
}): Promise<ProfilePhotoActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const storagePath = input.storagePath.trim();
  if (!storagePath.startsWith(`${user.id}/`)) {
    return { success: false, message: 'Invalid photo path.' };
  }

  const { data: existing, error: loadError } = await loadOwnerPhotos(supabase, user.id);
  if (loadError) {
    return { success: false, message: 'Could not load your photos. Please try again.' };
  }

  const photos = existing ?? [];
  if (photos.length >= MAX_PROFILE_PHOTOS) {
    return { success: false, message: MAX_PROFILE_PHOTOS_MESSAGE };
  }

  const displayOrder =
    photos.length === 0
      ? 0
      : Math.max(...photos.map((photo) => photo.display_order)) + 1;
  const makePrimary = photos.length === 0 || !photos.some((photo) => photo.is_primary);

  if (makePrimary && photos.length > 0) {
    const { error: clearError } = await supabase
      .from('profile_photos')
      .update({ is_primary: false })
      .eq('user_id', user.id);
    if (clearError) {
      return { success: false, message: 'Could not update photo primary status.' };
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profile_photos')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      display_order: displayOrder,
      is_primary: makePrimary,
      moderation_status: 'approved',
    })
    .select('id, storage_path, is_primary, display_order')
    .single();

  if (insertError || !inserted) {
    console.error('addProfilePhoto insert:', insertError?.message);
    return {
      success: false,
      message: 'Your photo uploaded, but could not be saved. Please try again.',
    };
  }

  const { data: refreshed, error: refreshError } = await loadOwnerPhotos(supabase, user.id);
  if (refreshError || !refreshed) {
    return { success: false, message: 'Photo saved, but could not confirm the collection.' };
  }

  let primaryPhotoUrl: string | null = null;
  try {
    primaryPhotoUrl = await syncLegacyPrimaryPhotoUrl(supabase, user.id, refreshed);
  } catch (error) {
    // Roll back metadata insert so we do not leave inconsistent state.
    await supabase.from('profile_photos').delete().eq('id', inserted.id).eq('user_id', user.id);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Photo metadata could not be confirmed. Please try again.',
    };
  }

  revalidateProfileRoutes();
  return {
    success: true,
    message: 'Photo added.',
    photos: mapPhotoRows(refreshed),
    primaryPhotoUrl,
  };
}

export async function deleteProfilePhoto(photoId: string): Promise<ProfilePhotoActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data: existing, error: loadError } = await loadOwnerPhotos(supabase, user.id);
  if (loadError) {
    return { success: false, message: 'Could not load your photos. Please try again.' };
  }

  const target = (existing ?? []).find((photo) => photo.id === photoId);
  if (!target) {
    return { success: false, message: 'That photo could not be found.' };
  }

  const remaining = (existing ?? []).filter((photo) => photo.id !== photoId);
  const wasPrimary = target.is_primary;
  const promote =
    wasPrimary && remaining.length > 0
      ? [...remaining].sort((a, b) => a.display_order - b.display_order)[0]
      : null;

  if (promote) {
    const { error: clearError } = await supabase
      .from('profile_photos')
      .update({ is_primary: false })
      .eq('user_id', user.id);
    if (clearError) {
      return { success: false, message: 'Could not update primary photo.' };
    }
    const { error: promoteError } = await supabase
      .from('profile_photos')
      .update({ is_primary: true })
      .eq('id', promote.id)
      .eq('user_id', user.id);
    if (promoteError) {
      return { success: false, message: 'Could not promote the next photo to primary.' };
    }
  }

  const { error: deleteError } = await supabase
    .from('profile_photos')
    .delete()
    .eq('id', target.id)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('deleteProfilePhoto:', deleteError.message);
    return { success: false, message: 'Could not remove that photo. Please try again.' };
  }

  const { error: removeError } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .remove([target.storage_path]);
  if (removeError) {
    console.error('deleteProfilePhoto storage:', removeError.message);
  }

  // Compact display_order to 0..n-1 while preserving relative order.
  const { data: afterDelete } = await loadOwnerPhotos(supabase, user.id);
  const ordered = [...(afterDelete ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );
  for (let index = 0; index < ordered.length; index += 1) {
    const photo = ordered[index]!;
    if (photo.display_order !== index) {
      await supabase
        .from('profile_photos')
        .update({ display_order: index })
        .eq('id', photo.id)
        .eq('user_id', user.id);
    }
  }

  const { data: refreshed } = await loadOwnerPhotos(supabase, user.id);
  let primaryPhotoUrl: string | null = null;
  try {
    primaryPhotoUrl = await syncLegacyPrimaryPhotoUrl(supabase, user.id, refreshed ?? []);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Photo removed, but profile could not be updated. Please refresh.',
    };
  }

  revalidateProfileRoutes();
  return {
    success: true,
    message: 'Photo removed.',
    photos: mapPhotoRows(refreshed ?? []),
    primaryPhotoUrl,
  };
}

export async function setPrimaryProfilePhoto(
  photoId: string
): Promise<ProfilePhotoActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data: existing, error: loadError } = await loadOwnerPhotos(supabase, user.id);
  if (loadError) {
    return { success: false, message: 'Could not load your photos. Please try again.' };
  }

  const target = (existing ?? []).find((photo) => photo.id === photoId);
  if (!target) {
    return { success: false, message: 'That photo could not be found.' };
  }

  const { error: clearError } = await supabase
    .from('profile_photos')
    .update({ is_primary: false })
    .eq('user_id', user.id);
  if (clearError) {
    return { success: false, message: 'Could not update primary photo.' };
  }

  const { data: updated, error: updateError } = await supabase
    .from('profile_photos')
    .update({ is_primary: true })
    .eq('id', target.id)
    .eq('user_id', user.id)
    .select('id, storage_path, is_primary, display_order')
    .single();

  if (updateError || !updated || !updated.is_primary) {
    return { success: false, message: 'Could not set that photo as primary.' };
  }

  const { data: refreshed } = await loadOwnerPhotos(supabase, user.id);
  let primaryPhotoUrl: string | null = null;
  try {
    primaryPhotoUrl = await syncLegacyPrimaryPhotoUrl(supabase, user.id, refreshed ?? []);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Could not sync primary photo.',
    };
  }

  revalidateProfileRoutes();
  return {
    success: true,
    message: 'Primary photo updated.',
    photos: mapPhotoRows(refreshed ?? []),
    primaryPhotoUrl,
  };
}

export async function reorderProfilePhotos(
  orderedPhotoIds: string[]
): Promise<ProfilePhotoActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const { data: existing, error: loadError } = await loadOwnerPhotos(supabase, user.id);
  if (loadError) {
    return { success: false, message: 'Could not load your photos. Please try again.' };
  }

  const photos = existing ?? [];
  if (photos.length === 0) {
    return { success: true, message: 'No photos to reorder.', photos: [] };
  }

  const idSet = new Set(photos.map((photo) => photo.id));
  if (
    orderedPhotoIds.length !== photos.length ||
    orderedPhotoIds.some((id) => !idSet.has(id)) ||
    new Set(orderedPhotoIds).size !== orderedPhotoIds.length
  ) {
    return { success: false, message: 'Photo order is invalid.' };
  }

  // Two-phase update avoids unique (user_id, display_order) collisions.
  for (let index = 0; index < orderedPhotoIds.length; index += 1) {
    const { error } = await supabase
      .from('profile_photos')
      .update({ display_order: 1000 + index })
      .eq('id', orderedPhotoIds[index]!)
      .eq('user_id', user.id);
    if (error) {
      return { success: false, message: 'Could not reorder photos. Please try again.' };
    }
  }
  for (let index = 0; index < orderedPhotoIds.length; index += 1) {
    const { error } = await supabase
      .from('profile_photos')
      .update({ display_order: index })
      .eq('id', orderedPhotoIds[index]!)
      .eq('user_id', user.id);
    if (error) {
      return { success: false, message: 'Could not reorder photos. Please try again.' };
    }
  }

  const { data: refreshed } = await loadOwnerPhotos(supabase, user.id);
  let primaryPhotoUrl: string | null = null;
  try {
    primaryPhotoUrl = await syncLegacyPrimaryPhotoUrl(supabase, user.id, refreshed ?? []);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Could not sync photo order.',
    };
  }

  revalidateProfileRoutes();
  return {
    success: true,
    message: 'Photo order saved.',
    photos: mapPhotoRows(refreshed ?? []),
    primaryPhotoUrl,
  };
}

export async function replaceProfilePhoto(input: {
  photoId: string;
  storagePath: string;
}): Promise<ProfilePhotoActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in.' };
  }

  const storagePath = input.storagePath.trim();
  if (!storagePath.startsWith(`${user.id}/`)) {
    return { success: false, message: 'Invalid photo path.' };
  }

  const { data: existing, error: loadError } = await loadOwnerPhotos(supabase, user.id);
  if (loadError) {
    return { success: false, message: 'Could not load your photos. Please try again.' };
  }

  const target = (existing ?? []).find((photo) => photo.id === input.photoId);
  if (!target) {
    return { success: false, message: 'That photo could not be found.' };
  }

  const previousPath = target.storage_path;
  const { data: updated, error: updateError } = await supabase
    .from('profile_photos')
    .update({ storage_path: storagePath })
    .eq('id', target.id)
    .eq('user_id', user.id)
    .select('id, storage_path, is_primary, display_order')
    .single();

  if (updateError || !updated || updated.storage_path !== storagePath) {
    return {
      success: false,
      message: 'Your photo uploaded, but could not be saved. Please try again.',
    };
  }

  if (previousPath && previousPath !== storagePath) {
    await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([previousPath]);
  }

  const { data: refreshed } = await loadOwnerPhotos(supabase, user.id);
  let primaryPhotoUrl: string | null = null;
  try {
    primaryPhotoUrl = await syncLegacyPrimaryPhotoUrl(supabase, user.id, refreshed ?? []);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Could not sync replaced photo.',
    };
  }

  revalidateProfileRoutes();
  return {
    success: true,
    message: 'Photo replaced.',
    photos: mapPhotoRows(refreshed ?? []),
    primaryPhotoUrl,
  };
}

