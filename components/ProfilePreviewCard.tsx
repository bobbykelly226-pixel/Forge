import type { Profile } from '@/lib/types/profile';

type ProfilePreviewCardProps = {
  profile: Profile;
};

function getInitials(name: string | null): string {
  if (!name) {
    return 'F';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'F';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="border-t border-[#0B2D5C]/10 pt-4">
      <p className="text-xs uppercase tracking-wide text-[#D62828] font-semibold mb-1">
        {label}
      </p>
      <p className="text-base text-[#444444] leading-relaxed">{value}</p>
    </div>
  );
}

export default function ProfilePreviewCard({ profile }: ProfilePreviewCardProps) {
  const initials = getInitials(profile.full_name);

  return (
    <article className="bg-white border border-[#0B2D5C]/10 rounded-3xl shadow-sm overflow-hidden">
      <div className="bg-[#0B2D5C] px-6 py-5 text-center">
        <p className="text-sm uppercase tracking-wide text-white/80 font-semibold">
          Profile Preview
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-8">
          {profile.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt={profile.full_name ? `${profile.full_name} profile photo` : 'Profile photo'}
              className="w-36 h-36 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#F8F6F2] shadow-md"
            />
          ) : (
            <div
              aria-label="Profile photo placeholder"
              className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-[#0B2D5C]/10 border-4 border-[#F8F6F2] shadow-md flex items-center justify-center"
            >
              <span className="text-4xl font-bold text-[#0B2D5C]">{initials}</span>
            </div>
          )}

          <h2 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2D5C]">
            {profile.full_name}
          </h2>

          {(profile.age || profile.location) && (
            <p className="mt-2 text-lg text-[#666666]">
              {[profile.age, profile.location].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <ProfileField label="Relationship goal" value={profile.relationship_goal} />
          <ProfileField label="Faith importance" value={profile.faith_importance} />
          <ProfileField label="Service background" value={profile.service_background} />
          {profile.short_bio && (
            <div className="border-t border-[#0B2D5C]/10 pt-4">
              <p className="text-xs uppercase tracking-wide text-[#D62828] font-semibold mb-2">
                About
              </p>
              <p className="text-base text-[#444444] leading-relaxed whitespace-pre-wrap">
                {profile.short_bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
