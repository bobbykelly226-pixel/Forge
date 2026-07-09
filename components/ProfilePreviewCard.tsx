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

function DetailBlock({
  label,
  value,
  emptyMessage,
}: {
  label: string;
  value: string | number | null | undefined;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-3xl border border-[#0B2D5C]/08 bg-[#F8F6F2] px-5 py-5 sm:px-6">
      <p className="text-xs uppercase tracking-[0.14em] text-[#D62828] font-semibold mb-2">
        {label}
      </p>
      {value ? (
        <p className="text-lg text-[#1F1F1F] leading-relaxed">{value}</p>
      ) : (
        <p className="text-base text-[#7A7A7A] leading-relaxed">{emptyMessage}</p>
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
  const missingFields = getMissingFields(profile);
  const isIncomplete = missingFields.length > 0;

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#0B2D5C]/12 bg-white shadow-[0_18px_50px_rgba(11,45,92,0.08)]">
      <div className="relative">
        {profile.profile_photo_url ? (
          <div className="aspect-[3/4] w-full overflow-hidden bg-[#0B2D5C]">
            <img
              src={profile.profile_photo_url}
              alt={profile.full_name ? `${profile.full_name} profile photo` : 'Profile photo'}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            aria-label="Profile photo placeholder"
            className="aspect-[3/4] w-full bg-gradient-to-b from-[#0B2D5C] via-[#0C356B] to-[#0A2540] px-8 flex flex-col items-center justify-center text-center"
          >
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border border-white/25 bg-white/10">
              <span className="text-5xl font-bold text-white">{initials}</span>
            </div>
            <p className="max-w-xs text-lg leading-relaxed text-white/90">
              Add a clear photo so someone can put a face to your story.
            </p>
          </div>
        )}

        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center rounded-full bg-[#F8F6F2]/95 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#0B2D5C] shadow-sm">
            Preview Mode
          </span>
        </div>
      </div>

      <div className="px-6 pb-9 pt-7 sm:px-8 sm:pb-10 sm:pt-8">
        <header className="mb-8 border-b border-[#0B2D5C]/10 pb-7">
          <h2 className="text-[2.15rem] leading-tight font-bold tracking-tight text-[#0B2D5C] sm:text-5xl">
            {displayName}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {profile.age ? (
              <span className="rounded-full bg-[#0B2D5C]/[0.06] px-4 py-2 text-sm font-medium text-[#0B2D5C]">
                {profile.age} years old
              </span>
            ) : (
              <span className="rounded-full bg-[#F8F6F2] px-4 py-2 text-sm text-[#888888]">
                Age not added yet
              </span>
            )}

            {profile.location ? (
              <span className="rounded-full bg-[#0B2D5C]/[0.06] px-4 py-2 text-sm font-medium text-[#0B2D5C]">
                {profile.location}
              </span>
            ) : (
              <span className="rounded-full bg-[#F8F6F2] px-4 py-2 text-sm text-[#888888]">
                Location not added yet
              </span>
            )}
          </div>
        </header>

        <section className="mb-8">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
            About
          </h3>
          {profile.short_bio ? (
            <p className="text-lg leading-relaxed text-[#2A2A2A] whitespace-pre-wrap">
              {profile.short_bio}
            </p>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#0B2D5C]/20 bg-[#F8F6F2] px-5 py-6">
              <p className="text-base leading-relaxed text-[#555555]">
                Your profile is starting to take shape. Add a short bio so future matches can
                understand what matters to you.
              </p>
            </div>
          )}
        </section>

        <section className="mb-2">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
            What matters
          </h3>
          <div className="space-y-3">
            <DetailBlock
              label="Relationship goal"
              value={profile.relationship_goal}
              emptyMessage="Share what you are looking for in a relationship."
            />
            <DetailBlock
              label="Faith importance"
              value={profile.faith_importance}
              emptyMessage="Tell others how faith shapes your life and relationships."
            />
            <DetailBlock
              label="Service background"
              value={profile.service_background}
              emptyMessage="Military, first responder, healthcare, volunteer, or other service."
            />
          </div>
        </section>

        {isIncomplete && (
          <div className="mt-8 rounded-3xl border border-[#D62828]/20 bg-[#D62828]/[0.04] px-5 py-6 sm:px-6">
            <p className="mb-2 text-lg font-semibold text-[#0B2D5C]">
              Complete your profile to help Forge make better compatibility suggestions.
            </p>
            <p className="text-sm leading-relaxed text-[#555555]">
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
