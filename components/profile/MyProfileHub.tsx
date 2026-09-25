'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import './profile-hub.css';

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
import type { ManagedProfilePhoto } from '@/lib/profile-photo';
import type { Profile } from '@/lib/types/profile';

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
  coreValues,
  hasRelationshipAlignment,
  hasImportantAlignmentFactors,
  photos,
  initialSection,
  compatibilityCard,
}: MyProfileHubProps) {
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [profilePhotos, setProfilePhotos] = useState(photos);
  const workspaceRef = useRef<ProfileWorkspaceHandle>(null);
  const orderedPhotos = [...profilePhotos]
    .sort((a, b) => a.display_order - b.display_order)
    .slice(0, 6);

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
              src="/Logos/forgedinlife-simple-light.png"
              alt="Forge"
              className="forge-corner-logo h-10 w-auto"
            />
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#C92027]">Your space</p>
            <h1
              className="mt-2 text-[1.75rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
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
            className="profile-hub space-y-5"
            style={{ animation: 'profileHubFadeUp 0.5s ease-out both' }}
          >
            <div className="space-y-5">
              <section className="profile-hub-summary rounded-[6px] border border-[#0B2D5C] bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.05)]">
                <p className="profile-hub-eyebrow">YOUR PROFILE</p>
                <div className="profile-hub-identity-row">
                  <div className="flex min-w-0 items-center gap-4">
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
                        className="text-[clamp(1.85rem,3vw,2.4rem)] leading-none tracking-[-0.03em] text-[#0B2D5C]"
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
                  <div className="profile-hub-gallery" aria-label="Your profile photos">
                    {Array.from({ length: Math.max(5, orderedPhotos.length) }, (_, index) => {
                      const photo = orderedPhotos[index];
                      return (
                        <button
                          key={photo?.id ?? `empty-${index}`}
                          type="button"
                          onClick={() => workspaceRef.current?.openPhotos()}
                          className="profile-hub-photo-slot"
                          aria-label={photo ? `Edit ${photo.is_primary ? 'primary' : `profile photo ${index + 1}`}${photo.moderation_status === 'pending' ? ', pending review' : ''}` : `Add profile photo ${index + 1}`}
                        >
                          {photo?.public_url ? (
                            <img src={photo.public_url} alt="" className="h-full w-full object-cover" />
                          ) : photo ? (
                            <span className="profile-hub-photo-status" aria-hidden="true">{photo.moderation_status === 'pending' ? 'Pending review' : 'Preview unavailable'}</span>
                          ) : (
                            <span aria-hidden="true">+</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="profile-hub-actions">
                  <button
                    type="button"
                    onClick={() => workspaceRef.current?.openPhotos()}
                    className="profile-hub-photo-action inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Update photos
                  </button>

                  <Link
                    href="/character-signals#eligible-recognition-heading"
                    data-text-link
                    className="profile-hub-signal-action inline-flex min-h-11 items-center justify-center px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Give a Character Signal
                  </Link>
                </div>

                <div className="mt-5 border-t border-[#C9CBCE] pt-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <Link
                      data-text-link href="/profile/preview"
                      className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-[#0B2D5C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <Eye className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      View My Profile
                    </Link>
                    <LogoutButton textLink className="min-h-11" />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#5C636B]">
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
                onPhotosChange={setProfilePhotos}
                compatibilityComplete={compatibilityCard.totalEligibleQuestions > 0 && compatibilityCard.completedQuestions >= compatibilityCard.totalEligibleQuestions}
              />
              <section aria-label="Compatibility" className="space-y-3">
                <ProfileCompatibilityCard {...compatibilityCard} compact />
                <details className="rounded-[6px] border border-[#0B2D5C] bg-[#E6E6E7] p-5">
                  <summary className="cursor-pointer font-semibold text-[#0B2D5C]">Character Signals</summary>
                  <CharacterSignalsProfileSection />
                </details>
              </section>
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
