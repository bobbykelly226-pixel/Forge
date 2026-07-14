/**
 * Server-side data access for Forge foundational persistence.
 *
 * These helpers always use the authenticated Supabase server client.
 * They never accept an arbitrary user id for “current user” operations
 * and never use the service-role key.
 *
 * UI wiring (Profile V2, onboarding, discovery) happens in later PRs.
 */

export {
  getCurrentUserAppState,
  getCurrentUserPrivateDetails,
  getCurrentUserPreferences,
  getCurrentUserProfile,
  getCurrentUserProfileAnswers,
  getCurrentUserProfilePhotos,
  hasCompletedOnboarding,
  updateOnboardingProgress,
  upsertCurrentUserProfile,
  type DataAccessError,
  type DataAccessResult,
  type DataAccessSuccess,
} from './profile';
