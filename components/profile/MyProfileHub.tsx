'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Eye } from 'lucide-react';

import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeAuthenticatedTwoColumnShell from '@/components/ForgeAuthenticatedTwoColumnShell';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import LogoutButton from '@/components/LogoutButton';
import CharacterSignalsProfileSection from '@/components/profile/CharacterSignalsProfileSection';
import ProfileCompatibilityCard, {
  type ProfileCompatibilityCardProps,
} from '@/components/compatibility-profile/ProfileCompatibilityCard';
import DiscoveryVisibilityToggle from '@/components/profile/DiscoveryVisibilityToggle';
import ProfileWorkspace, { type ProfileWorkspaceHandle } from '@/components/profile/ProfileWorkspace';
import MatchingPreferencesCard from '@/components/profile/MatchingPreferencesCard';
import type { ManagedProfilePhoto } from '@/lib/profile-photo';
import type { Profile } from '@/lib/types/profile';
import type { Tables } from '@/lib/supabase/database.types';

type PrivateProfileSeed = {
  date_of_birth: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  location_place_id: string | null;
  location_provider: string | null;
};

export type MyProfileHubProps = {
  displayName: string;
  location: string | null;
  photoUrl: string | null;
  completionPercent: number;
  onboardingCompleted: boolean;
  discoveryVisibility: {
    enabled: boolean;
    canEnable: boolean;
    message: string | null;
    unmetRequirements: string[];
  };
  profile: Profile;
  privateDetails: PrivateProfileSeed | null;
  preferences: Tables<'profile_preferences'> | null;
  coreValues: string[];
  hasRelationshipAlignment: boolean;
  hasImportantAlignmentFactors: boolean;
  photos: ManagedProfilePhoto[];
  initialSection?: string | null;
  compatibilityCard: ProfileCompatibilityCardProps;
};

export default function MyProfileHub({
  displayName,
  location,
  photoUrl: initialPhotoUrl,
  onboardingCompleted,
  discoveryVisibility,
  profile,
  privateDetails,
  preferences,
  coreValues,
  hasRelationshipAlignment,
  hasImportantAlignmentFactors,
  photos,
  initialSection,
  compatibilityCard,
}: MyProfileHubProps) {
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const workspaceRef = useRef<ProfileWorkspaceHandle>(null);

  return (
    <>
      <style>{`
        @keyframes profileHubFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <ForgeAuthenticatedTwoColumnShell
        wide
        documentScroll
        asideStyle={{ animation: 'profileHubFadeUp 0.45s ease-out both' }}
        aside={
          <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-6 shadow-[0_12px_32px_rgba(11,45,92,0.04)] backdrop-blur-sm xl:p-7">
            <img
              src="/Logos/forge-founder-transparent.png"
              alt="Forge"
              className="forge-corner-logo h-12 w-auto"
            />
            <h1
              className="mt-8 text-[1.75rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              My Profile
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
              Review and update your profile in one place.
            </p>
            <ForgeDesktopAppNav active="profile" />
          </div>
        }
      >
        <div className="px-0">
          <DiscoveryDesktopTopBar />
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-10 lg:pt-0">
          <div className="forge-mobile-brand-row mb-5 flex flex-wrap items-center justify-between gap-3 lg:hidden">
            <img
              src="/Logos/forge-founder-transparent.png"
              alt="Forge"
              className="forge-corner-logo h-12 w-auto sm:h-14"
            />

          </div>

          {!onboardingCompleted ? (
            <section className="mb-5 flex flex-col gap-4 rounded-[1.5rem] border border-[#D62828]/15 bg-white/85 p-5 shadow-[0_10px_30px_rgba(11,45,92,0.04)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
                  Setup in progress
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5A6575]">
                  Continue the essentials when you are ready. Your saved profile is
                  available here in the meantime.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#D62828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A61F1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D62828]"
              >
                Continue onboarding
              </Link>
            </section>
          ) : null}

          <div
            className="space-y-5"
            style={{ animation: 'profileHubFadeUp 0.5s ease-out both' }}
          >
            <div className="space-y-5">
              <section className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.05)]">
                <div className="flex items-center gap-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow-[0_8px_24px_rgba(11,45,92,0.12)]"
                    />
                  ) : (
                    <div
                      className="h-20 w-20 shrink-0 rounded-full border-4 border-white shadow-[0_8px_24px_rgba(11,45,92,0.12)]"
                      style={{
                        background:
                          'linear-gradient(160deg, #1B2F4A 0%, #3E566F 38%, #A8927D 72%, #E6D5C3 100%)',
                      }}
                      role="img"
                      aria-label={`${displayName} profile photo`}
                    />
                  )}
                  <div className="min-w-0">
                    <h1
                      className="text-[1.85rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
                      style={{
                        fontFamily: 'var(--font-discovery-display), Georgia, serif',
                      }}
                    >
                      {displayName}
                    </h1>
                    <p className="mt-2 text-sm text-[#5A6575]">
                      {location || 'Add your location'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => workspaceRef.current?.openPhotos()}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Update photos
                </button>

                <div className="mt-5 border-t border-[#C9CBCE] pt-5">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  <Link
                    data-text-link href="/profile/preview"
                    className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-[#0B2D5C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <Eye className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    View My Profile
                  </Link>
                  <LogoutButton textLink className="min-h-11" />
                  </div>
                  <p className="mt-2.5 text-center text-xs leading-relaxed text-[#7A8494]">
                    See your profile exactly as others see it.
                  </p>
                </div>
              </section>


              <DiscoveryVisibilityToggle
                enabled={discoveryVisibility.enabled}
                canEnable={discoveryVisibility.canEnable}
                message={discoveryVisibility.message}
                unmetRequirements={discoveryVisibility.unmetRequirements}
              />

              <Link data-text-link href="/profile/account" className="inline-block text-sm font-semibold text-[#0B2D5C] underline">Account & Privacy</Link>
            </div>

            <div className="mt-8 min-w-0 space-y-5 lg:mt-0">
              <ProfileWorkspace
                ref={workspaceRef}
                initialProfile={profile}
                privateDetails={privateDetails}
                coreValues={coreValues}
                hasRelationshipAlignment={hasRelationshipAlignment}
                hasImportantAlignmentFactors={hasImportantAlignmentFactors}
                initialPhotos={photos}
                initialSection={initialSection}
                onPrimaryPhotoChange={setPhotoUrl}
                compatibilityComplete={compatibilityCard.totalEligibleQuestions > 0 && compatibilityCard.completedQuestions >= compatibilityCard.totalEligibleQuestions}
              />
              <section aria-label="Compatibility" className="space-y-3">
                <ProfileCompatibilityCard {...compatibilityCard} compact />
                <details className="rounded-[6px] border border-[#0B2D5C] bg-[#E6E6E7] p-5">
                  <summary className="cursor-pointer font-semibold text-[#0B2D5C]">Character Signals</summary>
                  <CharacterSignalsProfileSection />
                </details>
              </section>
              <details className="rounded-[6px] border border-[#0B2D5C] bg-[#E6E6E7] p-5">
                <summary className="cursor-pointer font-semibold text-[#0B2D5C]">Private matching preferences</summary>
                <MatchingPreferencesCard initialPreferences={preferences} hasPrivateCoordinates={privateDetails?.latitude != null && privateDetails?.longitude != null} />
              </details>
            </div>
          </div>

          {onboardingCompleted ? (
            <p className="mt-10 text-xs leading-relaxed text-[#8A93A0] lg:mt-12">
              Your Forge profile is saved to your account.
            </p>
          ) : null}
        </div>
      </ForgeAuthenticatedTwoColumnShell>

      <ForgeAppBottomNav active="profile" />
    </>
  );
}
