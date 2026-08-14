import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import NotificationsProvider from '@/components/notifications/NotificationsProvider';
import { CharacterSignalsProvider } from '@/components/character-signals/CharacterSignalsProvider';
import MyProfileHub from '@/components/profile/MyProfileHub';
import { loadCompatibilityProfileStateAction } from '@/app/actions/questionnaire';
import { loadCurrentUserProfileBundle } from '@/lib/data/bundle';
import { loadMyCharacterSignals } from '@/lib/data/character-signals';
import { getQuestionnaireCatalog } from '@/lib/questionnaire/catalog';
import {
  areAllCategoriesComplete,
  countAllCompletedEligibleQuestions,
  countAllEligibleQuestions,
  countCompletedCategories,
} from '@/lib/questionnaire/persistence/completion';
import { resolveAuthoritativeProfilePhotoUrl, toManagedProfilePhoto } from '@/lib/profile-photo';
import { PROFILE_ANSWER_KEYS } from '@/lib/types/profile-answers';
import type { Profile } from '@/lib/types/profile';
import { createClient } from '@/lib/supabase/server';
import { validateAdultDateOfBirth } from '@/lib/age';
import { getCurrentUserPreferences } from '@/lib/data/profile';
import { matchingPreferencesAreComplete } from '@/lib/profile/matching-preferences';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-discovery-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-discovery-sans',
  display: 'swap',
});

export const metadata = {
  title: 'My Profile | Forge',
  description: 'Your home inside Forge — manage and edit how you show up.',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams?: Promise<{ section?: string }>;
};

export default async function MyProfileHubPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/profile');
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const initialSection = resolvedParams.section ?? null;

  const [bundle, privateDetailsResult, preferencesResult, compatibilityState, characterSignalsDashboard] = await Promise.all([
    loadCurrentUserProfileBundle(),
    supabase
      .from('profile_private_details')
      .select(
        'date_of_birth, postal_code, latitude, longitude, location_place_id, location_provider'
      )
      .eq('user_id', user.id)
      .maybeSingle(),
    getCurrentUserPreferences(),
    loadCompatibilityProfileStateAction(),
    loadMyCharacterSignals(),
  ]);

  if (!bundle.success) {
    return (
      <ForgeAppCanvas
        className={`${display.variable} ${sans.variable}`}
        style={{
          fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <p className="text-[#0B2D5C]">{bundle.message}</p>
        </div>
      </ForgeAppCanvas>
    );
  }

  const { profile, photos, completionPercent, appState, answers } = bundle.data;

  if (!profile) {
    // Ensure a row exists for the workspace by creating a minimal editable shell.
    redirect('/onboarding');
  }

  const displayName =
    profile.full_name?.trim().split(/\s+/)[0] ||
    profile.full_name?.trim() ||
    'Your profile';

  const photoUrl = resolveAuthoritativeProfilePhotoUrl({
    photos,
    legacyProfilePhotoUrl: profile.profile_photo_url,
  });

  const coreValuesRaw = answers[PROFILE_ANSWER_KEYS.coreValues];
  const coreValues = Array.isArray(coreValuesRaw)
    ? coreValuesRaw.filter((item): item is string => typeof item === 'string')
    : [];

  const hasRelationshipAlignment =
    (Array.isArray(profile.relationship_goals) && profile.relationship_goals.length > 0) ||
    (typeof answers[PROFILE_ANSWER_KEYS.relationshipIntention] === 'string' &&
      Boolean(
        (answers[PROFILE_ANSWER_KEYS.relationshipIntention] as string).trim().length
      ));
  const hasImportantAlignmentFactors = coreValues.length > 0;

  const discoveryCanEnable =
    profile.status !== 'deactivated' &&
    profile.status !== 'hidden' &&
    validateAdultDateOfBirth(privateDetailsResult.data?.date_of_birth ?? '').ok &&
    matchingPreferencesAreComplete(preferencesResult.success ? preferencesResult.data : null) &&
    privateDetailsResult.data?.latitude != null &&
    privateDetailsResult.data?.longitude != null;

  const profileForWorkspace = {
    ...profile,
    profile_photo_url: photoUrl,
  } as Profile;

  const catalog = getQuestionnaireCatalog();
  const parentingProfile = compatibilityState.success
    ? compatibilityState.data.parentingProfile
    : null;
  const answersByCategory = compatibilityState.success
    ? compatibilityState.data.state.answersByCategory
    : {};
  const completedCategories = countCompletedCategories(
    catalog.categories,
    answersByCategory,
    parentingProfile
  );
  const completedQuestions = countAllCompletedEligibleQuestions(
    catalog.categories,
    answersByCategory,
    parentingProfile
  );
  const totalEligibleQuestions = countAllEligibleQuestions(
    catalog.categories,
    parentingProfile
  );
  const overallComplete = areAllCategoriesComplete(
    catalog.categories,
    answersByCategory,
    parentingProfile
  );
  const compatibilityAction =
    overallComplete
      ? ('review' as const)
      : completedQuestions > 0
        ? ('continue' as const)
        : ('start' as const);

  return (
    <ForgeAppCanvas
      desktopViewportLock
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <NotificationsProvider>
        <CharacterSignalsProvider initialData={characterSignalsDashboard}>
          <MyProfileHub
          displayName={displayName}
          location={profile.location ?? null}
          photoUrl={photoUrl}
          completionPercent={completionPercent}
          onboardingCompleted={Boolean(appState?.onboarding_completed)}
          discoveryVisibility={{
            enabled: Boolean(profile.is_discoverable),
            canEnable: discoveryCanEnable,
            message: discoveryCanEnable
              ? null
              : profile.status === 'deactivated' || profile.status === 'hidden'
                ? 'Discovery visibility is unavailable for this account.'
                : 'Complete adult eligibility, matching preferences, and private location before entering Discovery.',
          }}
          profile={profileForWorkspace}
          privateDetails={privateDetailsResult.data ?? null}
          preferences={preferencesResult.success ? preferencesResult.data : null}
          coreValues={coreValues}
          hasRelationshipAlignment={hasRelationshipAlignment}
          hasImportantAlignmentFactors={hasImportantAlignmentFactors}
          photos={photos.map(toManagedProfilePhoto)}
          initialSection={initialSection}
            compatibilityCard={{
              completedCategories,
              totalCategories: 10,
              completedQuestions,
              totalEligibleQuestions,
              action: compatibilityAction,
            }}
          />
        </CharacterSignalsProvider>
      </NotificationsProvider>
    </ForgeAppCanvas>
  );
}
