/**
 * Server-side data access for Forge foundational persistence.
 */

export {
  ensureFoundationalRecords,
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

export {
  completeOnboarding,
  loadCurrentUserProfileAnswersMap,
  loadOnboardingState,
  saveOnboardingStepProgress,
  upsertCurrentUserProfileAnswer,
  type OnboardingLoadState,
} from './onboarding';

export {
  loadCurrentUserProfileBundle,
  loadSelfProfilePreview,
  type CurrentUserProfileBundle,
  type SelfProfilePreview,
} from './bundle';

export {
  getDiscoveryProfile,
  getDiscoveryVisibilityState,
  listDiscoveryFeedProfiles,
  loadActionStateForProfiles,
  setDiscoveryVisibility,
  type DiscoveryVisibilityState,
  type ProfileActionState,
} from './discovery';

export {
  getOpenToChatEducationSeen,
  markOpenToChatEducationSeen,
  passOnProfile,
  removeSavedProfile,
  respondOpenToChat,
  saveProfileForLater,
  sendInterest,
  sendOpenToChat,
  withdrawInterest,
} from './relationships';

export {
  loadConnectionsHub,
  type ConnectionsHubData,
} from './connections-hub';
