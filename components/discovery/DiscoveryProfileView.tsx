'use client';

import Link from 'next/link';

import DiscoveryActionTiles from '@/components/discovery/DiscoveryActionTiles';
import { useDiscoveryActions } from '@/components/discovery/DiscoveryActionsProvider';
import PublicProfilePresentation, {
  PublicProfileBackLink,
} from '@/components/discovery/PublicProfilePresentation';
import {
  isDemoConnectionProfileId,
  isDemoDiscoveryProfileId,
  isDemoProfileId,
} from '@/lib/demo/demo-access';
import {
  getSampleConnectionById,
  toSampleAlignmentPresentation,
} from '@/lib/demo/sample-connections';
import {
  getSampleDiscoveryProfileById,
  toSampleDiscoveryAlignmentPresentation,
} from '@/lib/demo/sample-discovery-profiles';
import {
  firstNameFromFullName,
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
  const isDiscoverySample = isDemoDiscoveryProfileId(profileId);
  const isConnectionSample = isDemoConnectionProfileId(profileId);
  const isAnyDemo = isDemoProfileId(profileId);

  const discoverySample = isDiscoverySample
    ? getSampleDiscoveryProfileById(profileId)
    : undefined;
  const connectionSample = isConnectionSample
    ? getSampleConnectionById(profileId)
    : undefined;

  const alignmentPresentation = discoverySample
    ? toSampleDiscoveryAlignmentPresentation(discoverySample)
    : connectionSample
      ? toSampleAlignmentPresentation(connectionSample)
      : null;

  if (passed && !isAnyDemo) {
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

  if (passed && isDiscoverySample) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1
          className="text-2xl text-[#0B2D5C]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          Introduction passed.
        </h1>
        <p className="mt-3 text-[#5A6575]">
          Sample preview only — this choice stays in your browser session.
        </p>
        <Link href="/discovery" className="mt-8 font-semibold text-[#D62828]">
          Back to Discovery
        </Link>
      </div>
    );
  }

  const backHref = isConnectionSample ? '/connections' : '/discovery';
  const backLabel = isConnectionSample ? '← Back to Connections' : '← Back to Discovery';

  return (
    <div className="min-h-screen pb-28 pt-5 lg:pb-16 lg:pt-8">
      <PublicProfilePresentation
        profile={profile}
        mode="discovery"
        showAlignmentCard
        showSurfacedReason={!isAnyDemo}
        alignmentPresentation={alignmentPresentation}
        header={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PublicProfileBackLink href={backHref} label={backLabel} />
          </div>
        }
        footer={
          isConnectionSample ? (
            <div className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/80 px-5 py-4">
              <p className="text-sm leading-relaxed text-[#5A6575]">
                Sample Connections preview profile. Relationship actions that would write live data
                stay unavailable.
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                Interested · Open to Chat · Demo only
              </p>
            </div>
          ) : (
            <DiscoveryActionTiles
              profileId={profileId}
              profileName={firstName}
              layout="profile-stack"
            />
          )
        }
      />
    </div>
  );
}
