'use client';

import Link from 'next/link';
import ForgeAppBottomNav from '@/components/ForgeAppBottomNav';

import DiscoveryActionTiles from '@/components/discovery/DiscoveryActionTiles';
import DiscoveryProfileConversationCta from '@/components/discovery/DiscoveryProfileConversationCta';
import { useDiscoveryActions } from '@/components/discovery/DiscoveryActionsProvider';
import PublicProfilePresentation, {
  PublicProfileBackLink,
} from '@/components/discovery/PublicProfilePresentation';
import { isPersistedConnectionId } from '@/lib/conversations/resolve';
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
import type { RecognitionRecipient } from '@/lib/character-signals/types';

type Props = {
  ended?: boolean;
  profile: PublicDiscoveryProfile;
  /** Live engine presentation from the server; seed profiles compute locally. */
  alignmentPresentation?: SeedProfileAlignmentPresentation | null;
  /** Active mutual connection id when the viewer is already connected. */
  mutualConnectionId?: string | null;
  /** Existing conversation id for this peer when one already exists. */
  existingConversationId?: string | null;
  /** Signed-in viewer id for Start Conversation QA logging. */
  viewerUserId?: string | null;
  /** Eligible Character Signal recipient for this signed-in viewer, when available. */
  recognitionRecipient?: RecognitionRecipient | null;
};

export default function DiscoveryProfileView({
  ended = false,
  profile,
  alignmentPresentation: liveAlignmentPresentation = null,
  mutualConnectionId = null,
  existingConversationId = null,
  viewerUserId = null,
  recognitionRecipient = null,
}: Props) {
  const profileId = profile.id;
  const firstName = firstNameFromFullName(profile.full_name);
  const { isPassed } = useDiscoveryActions();
  const passed = isPassed(profileId);
  const seedProfile = isSeedProfileId(profileId) ? getSeedProfileById(profileId) : undefined;
  const isSeed = Boolean(seedProfile);
  const isSeedMutual = seedProfile?.isMutualConnection === true;
  const liveMutualConnectionId = isPersistedConnectionId(mutualConnectionId)
    ? mutualConnectionId
    : null;
  const isMutualConnection = isSeedMutual || Boolean(liveMutualConnectionId);

  const alignmentPresentation = seedProfile
    ? toSeedAlignmentPresentation(seedProfile)
    : liveAlignmentPresentation;

  if (passed && !isSeed && !ended) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 pb-[calc(7rem+env(safe-area-inset-bottom))] text-center">
        <h1
          className="text-2xl text-[#0B2D5C]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          Introduction passed.
        </h1>
        <p className="mt-3 text-[#5A6575]">They will not be notified.</p>
        <Link data-text-link href="/discovery" className="mt-8 font-semibold text-[#D62828]">
          Back to Discovery
        </Link>
        <ForgeAppBottomNav active="discovery" />
      </div>
    );
  }

  if (passed && isSeed && !isMutualConnection) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 pb-[calc(7rem+env(safe-area-inset-bottom))] text-center">
        <h1
          className="text-2xl text-[#0B2D5C]"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
        >
          Introduction passed.
        </h1>
        <p className="mt-3 text-[#5A6575]">They will not be notified.</p>
        <Link data-text-link href="/discovery" className="mt-8 font-semibold text-[#D62828]">
          Back to Discovery
        </Link>
        <ForgeAppBottomNav active="discovery" />
      </div>
    );
  }

  const backHref = ended ? '/connections?tab=conversations' : isMutualConnection ? '/connections?tab=mutual' : '/discovery';
  const backLabel = ended ? 'Back to Past Conversations' : isMutualConnection ? '← Back to Connections' : '← Back to Discovery';

  return (
    <div className="min-h-screen pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 lg:pb-16 lg:pt-8">
      {ended ? (
        <div role="status" className="mx-auto max-w-3xl px-5 py-4">
          <p>This connection has ended. This member will no longer appear in Discovery.</p>
          {existingConversationId ? (
            <Link data-text-link href={`/connections/c/${existingConversationId}`} className="inline-flex min-h-11 items-center font-semibold">
              View past conversation · Block or Report
            </Link>
          ) : null}
        </div>
      ) : null}
      <PublicProfilePresentation
        profile={profile}
        mode="discovery"
        showAlignmentCard
        showSurfacedReason={!isSeed && !alignmentPresentation}
        alignmentPresentation={alignmentPresentation}
        recognitionRecipient={ended ? null : recognitionRecipient}
        header={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PublicProfileBackLink href={backHref} label={backLabel} />
          </div>
        }
        primaryAction={
          isMutualConnection && !ended ? (
            <DiscoveryProfileConversationCta
              profileId={profileId}
              firstName={firstName}
              connectionId={liveMutualConnectionId}
              existingConversationId={existingConversationId}
              viewerUserId={viewerUserId}
              isSeed={isSeedMutual}
            />
          ) : null
        }
        footer={
          !isMutualConnection && !ended ? (
            <DiscoveryActionTiles
              profileId={profileId}
              profileName={firstName}
              layout="profile-stack"
            />
          ) : null
        }
      />
      <ForgeAppBottomNav active={isMutualConnection ? 'connections' : 'discovery'} />
    </div>
  );
}
