import type { SelfProfilePreview } from '@/lib/data/bundle';
import PublicProfilePresentation, {
  PublicProfileBackLink,
} from '@/components/discovery/PublicProfilePresentation';
import type { PublicDiscoveryProfile } from '@/lib/discovery/presentation';
import Link from 'next/link';

type Props = {
  profile: SelfProfilePreview;
};

function toPublicProfile(profile: SelfProfilePreview): PublicDiscoveryProfile {
  return {
    id: profile.id,
    full_name: profile.full_name,
    age: profile.age,
    location: profile.location,
    location_city: profile.location_city,
    location_region: profile.location_region,
    location_country: profile.location_country,
    relationship_goal: profile.relationship_goal,
    faith_identity: profile.faith_identity,
    faith_tradition: profile.faith_tradition,
    faith_other: profile.faith_other,
    faith_importance: profile.faith_importance,
    service_background: profile.service_background,
    service_backgrounds: profile.service_backgrounds,
    short_bio: profile.short_bio,
    more_about: profile.more_about,
    children: profile.children,
    has_children: profile.has_children,
    children_count: profile.children_count,
    open_to_partner_with_children: profile.open_to_partner_with_children,
    education: profile.education,
    pets: profile.pets,
    smoking: profile.smoking,
    drinking: profile.drinking,
    career: profile.career,
    relocation: profile.relocation,
    things_i_enjoy: profile.things_i_enjoy,
    favorite_music_artists: profile.favorite_music_artists,
    favorite_music_songs: profile.favorite_music_songs,
    profile_photo_url: profile.profile_photo_url,
  };
}

/**
 * Owner self-preview — same responsive public profile system as Discovery,
 * without Interested, Open to Chat, Save, Not for Me, or surfacing copy.
 */
export default function SelfProfilePreviewCard({ profile }: Props) {
  return (
    <PublicProfilePresentation
      profile={toPublicProfile(profile)}
      mode="self-preview"
      showAlignmentCard={false}
      showSurfacedReason={false}
      header={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PublicProfileBackLink href="/profile" label="← Back to My Profile" />
          <span className="inline-flex w-fit items-center rounded-full border border-[#0B2D5C]/15 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
            Your Profile Preview
          </span>
        </div>
      }
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/profile/edit"
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#D62828] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#A61F1F]"
          >
            Edit Profile
          </Link>
          <Link
            href="/profile"
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#0B2D5C]/20 bg-white px-8 py-4 text-lg font-semibold text-[#0B2D5C] transition hover:bg-white/80"
          >
            Back to My Profile
          </Link>
        </div>
      }
    />
  );
}
