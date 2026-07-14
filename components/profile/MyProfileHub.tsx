'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye } from 'lucide-react';

import DiscoveryDesktopTopBar from '@/components/DiscoveryDesktopTopBar';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';
import ForgeDesktopAppNav from '@/components/ForgeDesktopAppNav';
import DiscoveryVisibilityToggle from '@/components/profile/DiscoveryVisibilityToggle';
import ProfileWorkspace from '@/components/profile/ProfileWorkspace';
import type { ManagedProfilePhoto } from '@/lib/profile-photo';
import type { Profile } from '@/lib/types/profile';

type PrivateLocationSeed = {
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
  };
  profile: Profile;
  privateDetails: PrivateLocationSeed | null;
  coreValues: string[];
  hasRelationshipAlignment: boolean;
  hasImportantAlignmentFactors: boolean;
  photos: ManagedProfilePhoto[];
  initialSection?: string | null;
};

function CompletionRing({ percent }: { percent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="relative h-20 w-20 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(11,45,92,0.1)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#D62828"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-[#0B2D5C]">{percent}%</span>
      </div>
    </div>
  );
}

export default function MyProfileHub({
  displayName,
  location,
  photoUrl: initialPhotoUrl,
  completionPercent,
  onboardingCompleted,
  discoveryVisibility,
  profile,
  privateDetails,
  coreValues,
  hasRelationshipAlignment,
  hasImportantAlignmentFactors,
  photos,
  initialSection,
}: MyProfileHubProps) {
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const showCompletionUi = completionPercent < 100;
  const flashNote = (message: string) => {
    void message;
  };

  return (
    <>
      <style>{`
        @keyframes profileHubFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto min-h-screen w-full lg:max-w-[1280px] lg:px-8 lg:py-8 xl:max-w-[1440px] xl:px-10">
        <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-12">
          <aside
            className="sticky top-8 hidden max-h-[calc(100vh-4rem)] self-start overflow-y-auto overscroll-contain lg:block"
            style={{ animation: 'profileHubFadeUp 0.45s ease-out both' }}
          >
            <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/70 p-6 shadow-[0_12px_32px_rgba(11,45,92,0.04)] backdrop-blur-sm xl:p-7">
              <img
                src="/Logos/forgedinlife-header-dark.png"
                alt="Forge"
                className="h-12 w-auto"
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
          </aside>

          <div className="min-h-screen w-full min-w-0 lg:min-h-0">
            <div className="hidden px-0 lg:block">
              <DiscoveryDesktopTopBar onPrototypeAction={flashNote} />
            </div>

            <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-[7.5rem] pt-5 sm:px-6 sm:pt-7 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-10 lg:pt-0">
              <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
                <img
                  src="/Logos/forgedinlife-header-dark.png"
                  alt="Forge"
                  className="h-12 w-auto sm:h-14"
                />
                <Link
                  href="/profile/preview"
                  className="rounded-full border border-[#0B2D5C]/12 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B2D5C]"
                >
                  Preview
                </Link>
              </div>

              <div
                className="lg:grid lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:gap-10"
                style={{ animation: 'profileHubFadeUp 0.5s ease-out both' }}
              >
                <div className="space-y-5 lg:sticky lg:top-8">
                  <section className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.05)]">
                    <div className="flex items-center gap-4">
                      {photoUrl || profile.profile_photo_url ? (
                        <img
                          src={photoUrl || profile.profile_photo_url || ''}
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

                    {showCompletionUi ? (
                      <div
                        className="mt-6 flex items-center gap-4 border-t border-[#0B2D5C]/06 pt-5"
                        data-testid="profile-completion-summary"
                      >
                        <CompletionRing percent={completionPercent} />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
                            Profile completion
                          </p>
                          <p className="mt-1.5 text-lg font-semibold text-[#0B2D5C]">
                            {completionPercent}% Complete
                          </p>
                          <p className="mt-1 text-sm text-[#5A6575]">
                            Encouragement only — never required for Discovery.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div
                      className={`${showCompletionUi ? 'mt-5' : 'mt-6'} border-t border-[#0B2D5C]/06 pt-5`}
                    >
                      <Link
                        href="/profile/preview"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/20 bg-white px-5 py-3.5 text-sm font-semibold text-[#0B2D5C] transition hover:border-[#0B2D5C]/35 hover:bg-[#FBF9F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                      >
                        <Eye className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                        View My Profile
                      </Link>
                      <p className="mt-2.5 text-center text-xs leading-relaxed text-[#7A8494]">
                        See your profile exactly as others see it.
                      </p>
                    </div>
                  </section>

                  <DiscoveryVisibilityToggle
                    enabled={discoveryVisibility.enabled}
                    canEnable={discoveryVisibility.canEnable}
                    message={discoveryVisibility.message}
                  />
                </div>

                <div className="mt-8 min-w-0 lg:mt-0">
                  <ProfileWorkspace
                    initialProfile={profile}
                    privateDetails={privateDetails}
                    coreValues={coreValues}
                    hasRelationshipAlignment={hasRelationshipAlignment}
                    hasImportantAlignmentFactors={hasImportantAlignmentFactors}
                    initialPhotos={photos}
                    initialSection={initialSection}
                    onPrimaryPhotoChange={setPhotoUrl}
                  />
                </div>
              </div>

              {onboardingCompleted ? (
                <p className="mt-10 text-xs leading-relaxed text-[#8A93A0] lg:mt-12">
                  Your Forge profile is saved to your account.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ForgeAppBottomNav active="profile" />
    </>
  );
}
