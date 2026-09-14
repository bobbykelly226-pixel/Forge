'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BriefcaseBusiness,
  Church,
  Cigarette,
  GraduationCap,
  HeartHandshake,
  House,
  MapPin,
  PawPrint,
  Users,
  Wine,
  type LucideIcon,
} from 'lucide-react';

import ProfileAlignmentSections, {
  type ProfileAlignmentSectionsProps,
} from '@/components/discovery/ProfileAlignmentSections';
import ProfilePhotoGallery from '@/components/discovery/ProfilePhotoGallery';
import {
  DISCOVERY_NEUTRAL_ALIGNMENT_LABEL,
  DISCOVERY_SURFACED_REASON,
} from '@/lib/discovery/config';
import {
  collectPublicProfileDetails,
  firstNameFromFullName,
  nonEmptyStringList,
  resolvePublicLocation,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';
import { resolveUnifiedAbout } from '@/lib/profile/unified-about';
import { sortPhotosByDisplayOrder } from '@/lib/profile-photo';
import type { RecognitionRecipient } from '@/lib/character-signals/types';

export type PublicProfilePresentationProps = {
  profile: PublicDiscoveryProfile;
  /** Discovery match view vs owner self-preview */
  mode: 'discovery' | 'self-preview';
  /** Optional header slot above the profile (back links, badges). */
  header?: React.ReactNode;
  /** Optional footer (actions, edit CTAs). */
  footer?: React.ReactNode;
  /** Show Relationship Alignment card for Discovery when enrichment is unavailable. */
  showAlignmentCard?: boolean;
  /** Show “Why Forge Introduced You” (Discovery only). */
  showSurfacedReason?: boolean;
  /**
   * Optional qualitative alignment enrichment (enriched profiles).
   * When set, replaces the default More to Discover alignment card.
   */
  alignmentPresentation?: Omit<
    ProfileAlignmentSectionsProps,
    'profileName' | 'cardClassName' | 'recognitionRecipient'
  > | null;
  /** Signed-in viewer's eligible recognition target for this profile. */
  recognitionRecipient?: RecognitionRecipient | null;
};

const DETAIL_ICONS: Record<string, LucideIcon> = {
  'Looking for': HeartHandshake,
  Location: MapPin,
  Faith: Church,
  'Faith in daily life': Church,
  Children: Users,
  'Wants children': Users,
  'Partner with children': Users,
  Career: BriefcaseBusiness,
  Education: GraduationCap,
  Pets: PawPrint,
  Smoking: Cigarette,
  Drinking: Wine,
  Relocation: House,
  Service: BriefcaseBusiness,
};

/**
 * Responsive public profile presentation shared by Discovery and self-preview.
 * Mobile: stacked vertical layout. Desktop: photo + content side-by-side.
 * Empty sections are omitted — never filled with mock or “Not provided”.
 */
export default function PublicProfilePresentation({
  profile,
  mode,
  header,
  footer,
  showAlignmentCard = mode === 'discovery',
  showSurfacedReason = mode === 'discovery',
  alignmentPresentation = null,
  recognitionRecipient = null,
}: PublicProfilePresentationProps) {
  const [showAllDetails, setShowAllDetails] = useState(false);
  const firstName = firstNameFromFullName(profile.full_name);
  const orderedPhotos = sortPhotosByDisplayOrder(profile.photos ?? []);
  const details = collectPublicProfileDetails(profile);
  const enjoy = nonEmptyStringList(profile.things_i_enjoy);
  const musicGenres = [...(profile.favorite_music_genres ?? []).filter(item => item !== 'Other'), ...nonEmptyStringList(profile.favorite_music_other ? [profile.favorite_music_other] : [])];
  const musicArtists = nonEmptyStringList(profile.favorite_music_artists);
  const musicSongs = [...nonEmptyStringList(profile.favorite_music_songs), ...(profile.favorite_music_meaningful_song ? [`A song that says something about me: ${profile.favorite_music_meaningful_song}`] : [])];
  const hasMusic = musicGenres.length > 0 || musicArtists.length > 0 || musicSongs.length > 0;
  const locationLabel = resolvePublicLocation(profile);
  const aboutCopy = resolveUnifiedAbout(profile.short_bio, profile.more_about);
  const hasAbout = Boolean(aboutCopy);
  const lookingFor = details.find(row => row.label === 'Looking for');
  const otherDetails = details.filter(row => row !== lookingFor);
  const profileDetails = [
    ...(lookingFor ? [lookingFor] : []),
    ...(locationLabel ? [{ label: 'Location', value: locationLabel }] : []),
    ...otherDetails,
  ];
  const visibleDetails = showAllDetails ? profileDetails : profileDetails.slice(0, 5);
  const hasMoreDetails = profileDetails.length > 5;
  const headingClass = "text-2xl font-medium tracking-tight text-[#0B2D5C]";
  const headingStyle = { fontFamily: 'var(--font-discovery-display), Georgia, serif' };
  const useEnrichedAlignment = Boolean(alignmentPresentation) && showAlignmentCard;

  return (
    <div
      className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:max-w-5xl lg:px-8 xl:max-w-6xl"
      data-profile-layout={mode}
      data-testid={mode === 'self-preview' ? 'self-profile-preview' : 'discovery-profile'}
    >
      {header ? <div className="mb-5 lg:mb-8">{header}</div> : null}

      {showAlignmentCard ? (
        <div className="mb-6 rounded-xl border border-[#C9CBCE] bg-[#E6E6E7] p-5 text-black sm:p-7">
          {useEnrichedAlignment && alignmentPresentation ? (
            <ProfileAlignmentSections
              profileName={firstName}
              {...alignmentPresentation}
              recognitionRecipient={recognitionRecipient}
              cardClassName="p-0"
              view="summary"
            />
          ) : (
            <section aria-label="Relationship Alignment">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C92027]">Relationship Alignment</p>
              <h2 className="mt-2 text-2xl font-medium text-[#0B2D5C]" style={headingStyle}>{DISCOVERY_NEUTRAL_ALIGNMENT_LABEL}</h2>
              <p className="mt-2 text-base leading-7 text-black">Complete more profile and compatibility answers to help Forge understand your alignment.</p>
            </section>
          )}
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(18rem,38%)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-12">
        <div className="lg:sticky lg:top-8">
          <ProfilePhotoGallery
            profileId={profile.id}
            firstName={firstName}
            age={profile.age}
            locationLabel={locationLabel}
            legacyProfilePhotoUrl={profile.profile_photo_url}
            photos={orderedPhotos}
            badge={
              mode === 'self-preview' ? (
                <div className="absolute left-4 top-4 z-[1]">
                  <span className="inline-flex items-center rounded-md border border-[#C5CCD6]/80 bg-white/95 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#0B2D5C] shadow-sm">
                    Your Preview
                  </span>
                </div>
              ) : null
            }
          />
        </div>

        <div className="mt-6 min-w-0 rounded-xl border border-[#C9CBCE] bg-[#E6E6E7] p-5 text-black sm:p-7 lg:mt-0 lg:p-8">
          <div className="space-y-7 [&>section+section]:border-t [&>section+section]:border-[#C9CBCE] [&>section+section]:pt-7">
            {profileDetails.length > 0 ? (
              <section aria-label={`${firstName}'s profile highlights`}>
                <dl className="space-y-4">
                  {visibleDetails.map(row => {
                    const Icon = DETAIL_ICONS[row.label] ?? HeartHandshake;
                    return (
                    <div key={row.label} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3">
                      <span data-icon-badge className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#0B2D5C]" aria-hidden="true">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-widest text-[#0B2D5C]">{row.label}</dt>
                        <dd className="mt-0.5 break-words text-base leading-relaxed text-black">{row.value}</dd>
                      </div>
                    </div>
                    );
                  })}
                </dl>
                {hasMoreDetails ? (
                  <button
                    type="button"
                    onClick={() => setShowAllDetails(open => !open)}
                    className="mt-5 w-full"
                    aria-expanded={showAllDetails}
                  >
                    {showAllDetails ? 'Show less' : `See more about ${firstName}`}
                  </button>
                ) : null}
              </section>
            ) : null}

            {hasAbout ? (
              <section>
                <h2 className={headingClass} style={headingStyle}>About {firstName}</h2>
                <p className="mt-3 whitespace-pre-line break-words text-base leading-7 text-black">{aboutCopy}</p>
              </section>
            ) : null}

            {enjoy.length > 0 ? (
              <section>
                <h2 className={headingClass} style={headingStyle}>Things I Enjoy</h2>
                <p className="mt-3 break-words text-base leading-7 text-black">{enjoy.slice(0, 6).join(' · ')}</p>
                {enjoy.length > 6 ? (
                  <details className="mt-2">
                    <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-[#0B2D5C] underline underline-offset-4">More interests</summary>
                    <p className="mt-2 break-words text-base leading-7 text-black">{enjoy.slice(6).join(' · ')}</p>
                  </details>
                ) : null}
              </section>
            ) : null}

            {hasMusic ? (
              <section>
                <details>
                  <summary className="min-h-11 cursor-pointer py-2 text-xl font-medium text-[#0B2D5C]" style={headingStyle}>
                    Favorite Music
                    <span className="mt-1 block text-sm font-normal text-black" style={{ fontFamily: 'var(--font-discovery-body), sans-serif' }}>Genres, artists, and songs</span>
                  </summary>
                  <dl className="mt-4 space-y-4 text-base leading-7 text-black">
                    {[
                      { label: 'Genres', items: musicGenres },
                      { label: 'Artists', items: musicArtists },
                      { label: 'Songs', items: musicSongs },
                    ].filter(row => row.items.length > 0).map(row => (
                      <div key={row.label}>
                        <dt className="text-sm font-semibold text-[#0B2D5C]">{row.label}</dt>
                        <dd className="break-words">{row.items.join(' · ')}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </section>
            ) : null}

            {showAlignmentCard && useEnrichedAlignment && alignmentPresentation ? (
              <section aria-label="Your alignment">
                <ProfileAlignmentSections
                  profileName={firstName}
                  {...alignmentPresentation}
                  recognitionRecipient={recognitionRecipient}
                  cardClassName="py-3"
                  view="details"
                />
              </section>
            ) : null}

            {showSurfacedReason && !useEnrichedAlignment ? (
              <section>
                <details>
                  <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold text-[#0B2D5C]">Why Forge Introduced You</summary>
                  <p className="mt-3 text-base leading-7 text-black">{DISCOVERY_SURFACED_REASON}</p>
                </details>
              </section>
            ) : null}
          </div>
          {footer ? <div className="mt-7 border-t border-[#C9CBCE] pt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PublicProfileBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link data-text-link href={href} className="text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828]">
      {label}
    </Link>
  );
}
