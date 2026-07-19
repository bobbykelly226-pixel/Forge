'use client';

import Link from 'next/link';

import DiscoveryActionTiles from '@/components/discovery/DiscoveryActionTiles';
import DiscoveryProfileConversationCta from '@/components/discovery/DiscoveryProfileConversationCta';
import { useDiscoveryActions } from '@/components/discovery/DiscoveryActionsProvider';
import PublicProfilePresentation, {
  PublicProfileBackLink,
} from '@/components/discovery/PublicProfilePresentation';
import { isSeedProfileId } from '@/lib/seed/access';
import {
  toSeedAlignmentPresentation,
  type SeedProfileAlignmentPresentation,
} from '@/lib/seed/adapters';
import { getSeedProfileById } from '@/lib/seed/catalog';
import {
  firstNameFromFullName,
  type PublicDiscoveryProfile,
} from '@/lib/discovery/presentation';

type Props = {
  profile: PublicDiscoveryProfile;
  /** Live engine presentation from the server; seed profiles compute locally. */
  alignmentPresentation?: SeedProfileAlignmentPresentation | null;
  /** Active mutual connection id when the viewer is already connected. */
  mutualConnectionId?: string | null;
  /** Existing conversation id for this peer when one already exists. */
  existingConversationId?: string | null;
};

export default function DiscoveryProfileView({
  profile,
  alignmentPresentation: liveAlignmentPresentation = null,
  mutualConnectionId = null,
  existingConversationId = null,
}: Props) {
  const profileId = profile.id;
  const firstName = firstNameFromFullName(profile.full_name);
  const { isPassed } = useDiscoveryActions();
  const passed = isPassed(profileId);
  const seedProfile = isSeedProfileId(profileId) ? getSeedProfileById(profileId) : undefined;
  const isSeed = Boolean(seedProfile);
  const isSeedMutual = seedProfile?.isMutualConnection === true;
  const isMutualConnection = isSeedMutual || Boolean(mutualConnectionId);

  const alignmentPresentation = seedProfile
    ? toSeedAlignmentPresentation(seedProfile)
    : liveAlignmentPresentation;

  if (passed && !isSeed) {
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

  if (passed && isSeed && !isMutualConnection) {
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

  const backHref = isMutualConnection ? '/connections?tab=mutual' : '/discovery';
  const backLabel = isMutualConnection ? '← Back to Connections' : '← Back to Discovery';

  return (
    <div className="min-h-screen pb-28 pt-5 lg:pb-16 lg:pt-8">
      <PublicProfilePresentation
        profile={profile}
        mode="discovery"
        showAlignmentCard
        showSurfacedReason={!isSeed && !alignmentPresentation}
        alignmentPresentation={alignmentPresentation}
        header={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PublicProfileBackLink href={backHref} label={backLabel} />
          </div>
        }
        footer={
          isMutualConnection ? (
            <DiscoveryProfileConversationCta
              profileId={profileId}
              firstName={firstName}
              connectionId={mutualConnectionId}
              existingConversationId={existingConversationId}
              isSeed={isSeedMutual}
            />
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
