'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';

import DiscoveryActionTiles from '@/components/discovery/DiscoveryActionTiles';
import { useDiscoveryActions } from '@/components/discovery/DiscoveryActionsProvider';
import {
  DISCOVERY_NEUTRAL_ALIGNMENT_LABEL,
  DISCOVERY_SURFACED_REASON,
} from '@/lib/discovery/config';
import {
  firstNameFromFullName,
  stablePortraitGradient,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';

type Props = {
  profile: PublicDiscoveryProfile;
};

export default function DiscoveryProfileView({ profile }: Props) {
  const profileId = profile.id;
  const firstName = firstNameFromFullName(profile.full_name);
  const { isPassed } = useDiscoveryActions();
  const passed = isPassed(profileId);
  const portrait = profile.profile_photo_url
    ? `url(${profile.profile_photo_url})`
    : stablePortraitGradient(profileId);

  if (passed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1
          className="text-2xl text-[#0B2D5C]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          Introduction passed.
        </h1>
        <p className="mt-3 text-[#5A6575]">They will not be notified.</p>
        <Link href="/discovery" className="mt-8 font-semibold text-[#D62828]">
          Back to Discovery
        </Link>
      </div>
    );
  }

  const details: Array<{ label: string; value: string | null }> = [
    { label: 'Relationship goal', value: profile.relationship_goal },
    { label: 'Faith', value: profile.faith_importance },
    { label: 'Children', value: profile.children },
    { label: 'Has children', value: profile.has_children },
    { label: 'Education', value: profile.education },
    { label: 'Career', value: profile.career },
    { label: 'Pets', value: profile.pets },
    { label: 'Smoking', value: profile.smoking },
    { label: 'Drinking', value: profile.drinking },
    { label: 'Relocation', value: profile.relocation },
    { label: 'Service', value: profile.service_background },
  ].filter((row) => row.value && row.value.trim().length > 0);

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg px-4 pb-28 pt-5 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/discovery" className="text-sm font-semibold text-[#0B2D5C]">
          ← Back to Discovery
        </Link>
      </div>

      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem]"
        style={{
          backgroundImage: portrait,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B2D5C]/70 to-transparent px-6 pb-6 pt-24">
          <h1
            className="text-[2.25rem] leading-none text-white"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            {firstName}
            {profile.age != null ? `, ${profile.age}` : ''}
          </h1>
          {profile.location ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/90">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {profile.location}
            </p>
          ) : null}
        </div>
      </div>

      <section className="mt-8 rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6">
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

      {profile.short_bio ? (
        <section className="mt-6">
          <h2
            className="text-xl text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            About
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5A6575]">{profile.short_bio}</p>
        </section>
      ) : null}

      {profile.more_about ? (
        <section className="mt-6">
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
        <section className="mt-6 space-y-3">
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

      {profile.things_i_enjoy && profile.things_i_enjoy.length > 0 ? (
        <section className="mt-6">
          <h2
            className="text-xl text-[#0B2D5C]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            Things I Enjoy
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.things_i_enjoy.map((item) => (
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

      <section className="mt-8 rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6">
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

      <div className="mt-8">
        <DiscoveryActionTiles
          profileId={profileId}
          profileName={firstName}
          layout="profile-stack"
        />
      </div>
    </div>
  );
}
