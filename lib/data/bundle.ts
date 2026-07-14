import {
  calculateProfileCompletionPercent,
  getProfileCompletionSections,
  type ProfileCompletionSection,
} from '@/lib/profile-completion';
import type { Tables } from '@/lib/supabase/database.types';
import {
  PROFILE_ANSWER_KEYS,
  type ProfileAnswersMap,
} from '@/lib/types/profile-answers';
import {
  ensureFoundationalRecords,
  getCurrentUserAppState,
  getCurrentUserProfile,
  getCurrentUserProfileAnswers,
  getCurrentUserProfilePhotos,
  type DataAccessResult,
} from '@/lib/data/profile';
import { loadCurrentUserProfileAnswersMap } from '@/lib/data/onboarding';
import { resolveAuthoritativeProfilePhotoUrl } from '@/lib/profile-photo';

export type CurrentUserProfileBundle = {
  profile: Tables<'profiles'> | null;
  photos: Tables<'profile_photos'>[];
  answers: ProfileAnswersMap;
  answerRows: Tables<'profile_answers'>[];
  appState: Tables<'user_app_state'> | null;
  completionSections: ProfileCompletionSection[];
  completionPercent: number;
};

function answersIndicateAlignment(answers: ProfileAnswersMap): boolean {
  const value = answers[PROFILE_ANSWER_KEYS.relationshipIntention];
  return typeof value === 'string' && value.trim().length > 0;
}

function answersIndicateFactors(answers: ProfileAnswersMap): boolean {
  const value = answers[PROFILE_ANSWER_KEYS.coreValues];
  return Array.isArray(value) && value.length > 0;
}

export async function loadCurrentUserProfileBundle(): Promise<
  DataAccessResult<CurrentUserProfileBundle>
> {
  const ensured = await ensureFoundationalRecords();
  if (!ensured.success) {
    return ensured;
  }

  const [profileResult, photosResult, answersMapResult, answerRowsResult, appStateResult] =
    await Promise.all([
      getCurrentUserProfile(),
      getCurrentUserProfilePhotos(),
      loadCurrentUserProfileAnswersMap(),
      getCurrentUserProfileAnswers(),
      getCurrentUserAppState(),
    ]);

  for (const result of [
    profileResult,
    photosResult,
    answersMapResult,
    answerRowsResult,
    appStateResult,
  ]) {
    if (!result.success) {
      return result;
    }
  }

  const profile = profileResult.success ? profileResult.data : null;
  const photos = photosResult.success ? photosResult.data : [];
  const answers = answersMapResult.success ? answersMapResult.data : {};
  const answerRows = answerRowsResult.success ? answerRowsResult.data : [];
  const appState = appStateResult.success ? appStateResult.data : null;

  const completionSections = getProfileCompletionSections({
    profile,
    photoCount: photos.length,
    hasRelationshipAlignment: answersIndicateAlignment(answers),
    hasImportantAlignmentFactors: answersIndicateFactors(answers),
  });

  return {
    success: true,
    data: {
      profile,
      photos,
      answers,
      answerRows,
      appState,
      completionSections,
      completionPercent: calculateProfileCompletionPercent(completionSections),
    },
  };
}

/**
 * Safe public presentation fields for the owner's own preview.
 * Never includes private details or private answer payloads.
 */
export type SelfProfilePreview = {
  id: string;
  full_name: string | null;
  age: number | null;
  location: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  short_bio: string | null;
  more_about: string | null;
  relationship_goal: string | null;
  faith_identity: string | null;
  faith_tradition: string | null;
  faith_other: string | null;
  faith_importance: string | null;
  service_background: string | null;
  service_backgrounds: string[];
  children: string | null;
  has_children: string | null;
  children_count: string | null;
  open_to_partner_with_children: string | null;
  education: string | null;
  pets: string | null;
  smoking: string | null;
  drinking: string | null;
  career: string | null;
  relocation: string | null;
  things_i_enjoy: string[];
  favorite_music_artists: string[];
  favorite_music_songs: string[];
  profile_photo_url: string | null;
  photos: Array<{
    id: string;
    storage_path: string;
    display_order: number;
    is_primary: boolean;
    public_url: string | null;
  }>;
};

export async function loadSelfProfilePreview(): Promise<
  DataAccessResult<SelfProfilePreview | null>
> {
  const bundle = await loadCurrentUserProfileBundle();
  if (!bundle.success) {
    return bundle;
  }

  const { profile, photos } = bundle.data;
  if (!profile) {
    return { success: true, data: null };
  }

  const resolvedPhotoUrl = resolveAuthoritativeProfilePhotoUrl({
    photos,
    legacyProfilePhotoUrl: profile.profile_photo_url,
  });

  return {
    success: true,
    data: {
      id: profile.id,
      full_name: profile.full_name,
      age: profile.age,
      location: profile.location,
      location_city: profile.location_city,
      location_region: profile.location_region,
      location_country: profile.location_country,
      short_bio: profile.short_bio,
      more_about: profile.more_about,
      relationship_goal: profile.relationship_goal,
      faith_identity: profile.faith_identity,
      faith_tradition: profile.faith_tradition,
      faith_other: profile.faith_other,
      faith_importance: profile.faith_importance,
      service_background: profile.service_background,
      service_backgrounds: profile.service_backgrounds ?? [],
      children: profile.children,
      has_children: profile.has_children,
      children_count: profile.children_count,
      open_to_partner_with_children: profile.open_to_partner_with_children,
      education: profile.education,
      pets: profile.pets,
      smoking: profile.smoking,
      drinking: profile.drinking,
      career: profile.career,
      relocation: profile.relocation,
      things_i_enjoy: profile.things_i_enjoy ?? [],
      favorite_music_artists: profile.favorite_music_artists ?? [],
      favorite_music_songs: profile.favorite_music_songs ?? [],
      profile_photo_url: resolvedPhotoUrl,
      photos: photos.map((photo) => ({
        id: photo.id,
        storage_path: photo.storage_path,
        display_order: photo.display_order,
        is_primary: photo.is_primary,
        public_url: resolveAuthoritativeProfilePhotoUrl({
          photos: [photo],
          legacyProfilePhotoUrl: null,
        }),
      })),
    },
  };
}
