'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';

import {
  DISCOVERY_NEUTRAL_ALIGNMENT_LABEL,
  DISCOVERY_SURFACED_REASON,
} from '@/lib/discovery/config';
import {
  collectPublicProfileDetails,
  firstNameFromFullName,
  nonEmptyStringList,
  resolvePublicLocation,
  stablePortraitGradient,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';

export type PublicProfilePresentationProps = {
  profile: PublicDiscoveryProfile;
  /** Discovery match view vs owner self-preview */
  mode: 'discovery' | 'self-preview';
  /** Optional header slot above the profile (back links, badges). */
  header?: React.ReactNode;
  /** Optional footer (actions, edit CTAs). */
  footer?: React.ReactNode;
  /** Show neutral alignment card (Discovery only). */
  showAlignmentCard?: boolean;
  /** Show “Why Forge surfaced this profile” (Discovery only). */
  showSurfacedReason?: boolean;
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
}: PublicProfilePresentationProps) {
  const firstName = firstNameFromFullName(profile.full_name);
  const portrait = profile.profile_photo_url
    ? `url(${profile.profile_photo_url})`
    : stablePortraitGradient(profile.id);
  const details = collectPublicProfileDetails(profile);
  const enjoy = nonEmptyStringList(profile.things_i_enjoy);
  const musicArtists = nonEmptyStringList(profile.favorite_music_artists);
  const musicSongs = nonEmptyStringList(profile.favorite_music_songs);
  const hasMusic = musicArtists.length > 0 || musicSongs.length > 0;
  const locationLabel = resolvePublicLocation(profile);
  const hasLocation = Boolean(locationLabel);
  const hasAbout = Boolean(profile.short_bio?.trim());
  const hasMoreAbout = Boolean(profile.more_about?.trim());

  return (
    <div
      className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:max-w-5xl lg:px-8 xl:max-w-6xl"
      data-profile-layout={mode}
      data-testid={mode === 'self-preview' ? 'self-profile-preview' : 'discovery-profile'}
    >
      {header ? <div className="mb-5 lg:mb-8">{header}</div> : null}

      <div className="lg:grid lg:grid-cols-[minmax(18rem,38%)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-12">
        <div
          className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] lg:sticky lg:top-8 lg:aspect-[3/4] lg:rounded-[2.25rem]"
          style={{
            backgroundImage: portrait,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B2D5C]/70 to-transparent px-6 pb-6 pt-24 lg:px-7 lg:pb-7">
            <h1
              className="text-[2.25rem] leading-none text-white lg:text-[2.5rem]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {firstName}
              {profile.age != null ? `, ${profile.age}` : ''}
            </h1>
            {hasLocation ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/90">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {locationLabel}
              </p>
            ) : null}
          </div>
          {mode === 'self-preview' ? (
            <div className="absolute left-4 top-4">
              <span className="inline-flex items-center rounded-full bg-[#F8F6F2]/95 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#0B2D5C] shadow-sm">
                Your Preview
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-8 space-y-6 lg:mt-0 lg:space-y-8">
          {showAlignmentCard ? (
            <section className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
                Relationship Alignment
              </p>
              <h2
                className="mt-2 text-2xl text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {DISCOVERY_NEUTRAL_ALIGNMENT_LABEL}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
                Matching scores are not calculated yet. This label is a neutral placeholder.
              </p>
            </section>
          ) : null}

          {hasAbout ? (
            <section>
              <h2
                className="text-xl text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                About
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">{profile.short_bio}</p>
            </section>
          ) : null}

          {hasMoreAbout ? (
            <section>
              <h2
                className="text-xl text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                More About {firstName}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">{profile.more_about}</p>
            </section>
          ) : null}

          {details.length > 0 ? (
            <section className="space-y-3">
              <h2
                className="text-xl text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Details
              </h2>
              <dl className="space-y-2">
                {details.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-[#8A93A0]">{row.label}</dt>
                    <dd className="text-right font-medium text-[#0B2D5C]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {enjoy.length > 0 ? (
            <section>
              <h2
                className="text-xl text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Things I Enjoy
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {enjoy.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-1.5 text-xs font-medium text-[#0B2D5C]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {hasMusic ? (
            <section>
              <h2
                className="text-xl text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Favorite Music
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...musicArtists, ...musicSongs].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-1.5 text-xs font-medium text-[#0B2D5C]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {mode === 'self-preview' ? (
            <section className="rounded-[1.75rem] border border-dashed border-[#0B2D5C]/15 bg-white/60 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A93A0]">
                Coming Soon
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
                Voice Introduction and Video Introduction will appear here when available.
              </p>
            </section>
          ) : null}

          {showSurfacedReason ? (
            <section className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6">
              <h2
                className="text-xl text-[#0B2D5C]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                Why Forge surfaced this profile
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">
                {DISCOVERY_SURFACED_REASON}
              </p>
            </section>
          ) : null}

          {footer ? <div className="pt-2">{footer}</div> : null}
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
    <Link href={href} className="text-sm font-semibold text-[#0B2D5C] transition hover:text-[#D62828]">
      {label}
    </Link>
  );
}
