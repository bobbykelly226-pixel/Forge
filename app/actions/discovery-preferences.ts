'use server';

import { revalidatePath } from 'next/cache';

import {
  upsertCurrentUserPreferences,
  upsertCurrentUserPrivateDetails,
  upsertCurrentUserProfile,
} from '@/lib/data/profile';
import {
  type MatchingPreferencesInput,
  validateMatchingPreferences,
} from '@/lib/profile/matching-preferences';
import { toPublicLocationFields } from '@/lib/profile/location-format';

type DiscoveryPreferencesResult = {
  success: boolean;
  message: string;
};

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function readNumber(formData: FormData, key: string): number {
  return Number(readText(formData, key));
}

export async function saveDiscoveryMatchingPreferences(
  formData: FormData
): Promise<DiscoveryPreferencesResult> {
  const input: MatchingPreferencesInput = {
    genderIdentity: readText(formData, 'gender_identity'),
    interestedIn: formData.getAll('interested_in').map(String),
    preferredAgeMin: readNumber(formData, 'preferred_age_min'),
    preferredAgeMax: readNumber(formData, 'preferred_age_max'),
    maxDistanceMiles: readNumber(formData, 'max_distance_miles'),
  };
  const validated = validateMatchingPreferences(input);
  if (!validated.ok) return { success: false, message: validated.message };

  const city = readText(formData, 'location_city');
  const region = readText(formData, 'location_region');
  const country = readText(formData, 'location_country') || 'US';
  const postalCode = readText(formData, 'location_postal_code') || null;
  const latitude = Number.parseFloat(readText(formData, 'location_latitude'));
  const longitude = Number.parseFloat(readText(formData, 'location_longitude'));
  const placeId = readText(formData, 'location_place_id') || null;
  const provider = readText(formData, 'location_provider') || null;

  if (
    !city ||
    !region ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      success: false,
      message: 'Choose a suggested location or use your current location before saving.',
    };
  }

  const publicLocation = toPublicLocationFields({
    city,
    region,
    country,
    postalCode,
    latitude,
    longitude,
    placeId,
    provider,
  });
  const value = validated.value;

  const preferencesResult = await upsertCurrentUserPreferences({
    gender_identity: value.genderIdentity,
    interested_in: value.interestedIn,
    preferred_age_min: value.preferredAgeMin,
    preferred_age_max: value.preferredAgeMax,
    max_distance_miles: value.maxDistanceMiles,
  });
  if (!preferencesResult.success) return preferencesResult;

  const privateResult = await upsertCurrentUserPrivateDetails({
    location_city: publicLocation.location_city,
    location_region: publicLocation.location_region,
    location_country: publicLocation.location_country,
    postal_code: postalCode,
    latitude,
    longitude,
    location_place_id: placeId,
    location_provider: provider,
  });
  if (!privateResult.success) return privateResult;

  const profileResult = await upsertCurrentUserProfile(publicLocation);
  if (!profileResult.success) return profileResult;

  for (const path of ['/discovery', '/profile', '/profile/preview']) {
    revalidatePath(path);
  }

  return { success: true, message: 'Matching preferences saved.' };
}
