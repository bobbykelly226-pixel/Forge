import { Fraunces, Manrope } from 'next/font/google';
import { redirect } from 'next/navigation';

import ForgeAppCanvas from '@/components/ForgeAppCanvas';
import MyProfileHub from '@/components/profile/MyProfileHub';
import { loadCurrentUserProfileBundle } from '@/lib/data/bundle';
import { resolveAuthoritativeProfilePhotoUrl, toManagedProfilePhoto } from '@/lib/profile-photo';
import { PROFILE_ANSWER_KEYS } from '@/lib/types/profile-answers';
import type { Profile } from '@/lib/types/profile';
import { createClient } from '@/lib/supabase/server';

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

  const [bundle, privateDetailsResult] = await Promise.all([
    loadCurrentUserProfileBundle(),
    supabase
      .from('profile_private_details')
      .select(
        'postal_code, latitude, longitude, location_place_id, location_provider'
      )
      .eq('user_id', user.id)
      .maybeSingle(),
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
    typeof answers[PROFILE_ANSWER_KEYS.relationshipIntention] === 'string' &&
    Boolean(
      (answers[PROFILE_ANSWER_KEYS.relationshipIntention] as string).trim().length
    );
  const hasImportantAlignmentFactors = coreValues.length > 0;

  const discoveryCanEnable =
    profile.status !== 'deactivated' && profile.status !== 'hidden';

  const profileForWorkspace = {
    ...profile,
    profile_photo_url: photoUrl,
  } as Profile;

  return (
    <ForgeAppCanvas
      desktopViewportLock
      className={`${display.variable} ${sans.variable}`}
      style={{
        fontFamily: 'var(--font-discovery-sans), ui-sans-serif, system-ui, sans-serif',
      }}
    >
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
            : 'Discovery visibility is unavailable for this account.',
        }}
        profile={profileForWorkspace}
        privateDetails={privateDetailsResult.data ?? null}
        coreValues={coreValues}
        hasRelationshipAlignment={hasRelationshipAlignment}
        hasImportantAlignmentFactors={hasImportantAlignmentFactors}
        photos={photos.map(toManagedProfilePhoto)}
        initialSection={initialSection}
      />
    </ForgeAppCanvas>
  );
}
