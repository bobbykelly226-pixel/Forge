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

function DetailRow({
  label,
  value,
  emptyMessage,
}: {
  label: string;
  value: string | number | null | undefined;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F8F6F2] px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-[#D62828] font-semibold mb-1.5">
        {label}
      </p>
      {value ? (
        <p className="text-base text-[#222222] leading-relaxed">{value}</p>
      ) : (
        <p className="text-base text-[#888888] leading-relaxed italic">{emptyMessage}</p>
      )}
    </div>
  );
}

function getMissingFields(profile: Profile): string[] {
  const missing: string[] = [];

  if (!profile.profile_photo_url) missing.push('a photo');
  if (!profile.age) missing.push('your age');
  if (!profile.location) missing.push('your location');
  if (!profile.short_bio) missing.push('a short bio');
  if (!profile.relationship_goal) missing.push('your relationship goal');
  if (!profile.faith_importance) missing.push('how important faith is to you');
  if (!profile.service_background) missing.push('your service background');

  return missing;
}

export default function ProfilePreviewCard({ profile }: ProfilePreviewCardProps) {
  const initials = getInitials(profile.full_name);
  const displayName = profile.full_name?.trim() || 'Your name';
  const metaLine = [profile.age, profile.location].filter(Boolean).join(' · ');
  const missingFields = getMissingFields(profile);
  const isIncomplete = missingFields.length > 0;

  return (
    <article className="bg-white border border-[#0B2D5C]/10 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="relative bg-[#0B2D5C]">
        {profile.profile_photo_url ? (
          <div className="aspect-[4/5] sm:aspect-[5/6] w-full overflow-hidden">
            <img
              src={profile.profile_photo_url}
              alt={profile.full_name ? `${profile.full_name} profile photo` : 'Profile photo'}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            aria-label="Profile photo placeholder"
            className="aspect-[4/5] sm:aspect-[5/6] w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0B2D5C] to-[#0A2540] px-6"
          >
            <div className="w-28 h-28 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-5">
              <span className="text-4xl font-bold text-white">{initials}</span>
            </div>
            <p className="text-white/90 text-center text-base leading-relaxed max-w-xs">
              Add a photo so others can put a face to your story.
            </p>
          </div>
        )}
      </div>

      <div className="px-6 pt-7 pb-8 sm:px-8 sm:pt-8 sm:pb-10">
        <header className="mb-7 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2D5C]">
            {displayName}
          </h2>

          {metaLine ? (
            <p className="mt-2 text-lg text-[#555555]">{metaLine}</p>
          ) : (
            <p className="mt-2 text-base text-[#888888] italic">
              Add your age and location to help others know where you are in life.
            </p>
          )}
        </header>

        <section className="mb-7 sm:mb-8">
          <h3 className="text-sm uppercase tracking-wide text-[#D62828] font-semibold mb-3">
            About
          </h3>
          {profile.short_bio ? (
            <p className="text-base sm:text-lg text-[#333333] leading-relaxed whitespace-pre-wrap">
              {profile.short_bio}
            </p>
          ) : (
            <div className="rounded-2xl bg-[#F8F6F2] px-5 py-5">
              <p className="text-base text-[#666666] leading-relaxed">
                Your profile is starting to take shape. Add a short bio so future matches can
                understand what matters to you.
              </p>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm uppercase tracking-wide text-[#D62828] font-semibold mb-3">
            What matters
          </h3>
          <div className="space-y-3">
            <DetailRow
              label="Relationship goal"
              value={profile.relationship_goal}
              emptyMessage="Share what you are looking for in a relationship."
            />
            <DetailRow
              label="Faith importance"
              value={profile.faith_importance}
              emptyMessage="Tell others how faith shapes your life and relationships."
            />
            <DetailRow
              label="Service background"
              value={profile.service_background}
              emptyMessage="Military, first responder, healthcare, volunteer, or other service."
            />
          </div>
        </section>

        {isIncomplete && (
          <div className="mt-8 rounded-2xl border border-[#0B2D5C]/15 bg-[#0B2D5C]/[0.03] px-5 py-5">
            <p className="text-base font-semibold text-[#0B2D5C] mb-2">
              Complete your profile to help Forge make better compatibility suggestions.
            </p>
            <p className="text-sm text-[#555555] leading-relaxed">
              The more intentional your profile is, the better Forge can help surface meaningful
              alignment. Consider adding {missingFields.slice(0, 3).join(', ')}
              {missingFields.length > 3 ? ', and more' : ''}.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
