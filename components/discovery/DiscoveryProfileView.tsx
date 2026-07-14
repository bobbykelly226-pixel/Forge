'use client';

import Link from 'next/link';

import DiscoveryActionTiles from '@/components/discovery/DiscoveryActionTiles';
import { useDiscoveryActions } from '@/components/discovery/DiscoveryActionsProvider';
import PublicProfilePresentation, {
  PublicProfileBackLink,
} from '@/components/discovery/PublicProfilePresentation';
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

  return (
    <div className="min-h-screen pb-28 pt-5 lg:pb-16 lg:pt-8">
      <PublicProfilePresentation
        profile={profile}
        mode="discovery"
        showAlignmentCard
        showSurfacedReason
        header={
          <PublicProfileBackLink href="/discovery" label="← Back to Discovery" />
        }
        footer={
          <DiscoveryActionTiles
            profileId={profileId}
            profileName={firstName}
            layout="profile-stack"
          />
        }
      />
    </div>
  );
}
