import type { SelfProfilePreview } from '@/lib/data/bundle';

type Props = {
  profile: SelfProfilePreview;
};

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="rounded-3xl border border-[#0B2D5C]/08 bg-[#F8F6F2] px-5 py-5 sm:px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
        {label}
      </p>
      <p className="text-lg leading-relaxed text-[#1F1F1F]">{value}</p>
    </div>
  );
}

export default function SelfProfilePreviewCard({ profile }: Props) {
  const displayName = profile.full_name?.trim() || 'Your name';
  const details = [
    { label: 'Relationship Goal', value: profile.relationship_goal },
    { label: 'Children', value: profile.children },
    { label: 'Has Children', value: profile.has_children },
    { label: 'Faith', value: profile.faith_importance },
    { label: 'Education', value: profile.education },
    { label: 'Pets', value: profile.pets },
    { label: 'Smoking', value: profile.smoking },
    { label: 'Drinking', value: profile.drinking },
    { label: 'Career', value: profile.career },
    { label: 'Relocation', value: profile.relocation },
    { label: 'Service Background', value: profile.service_background },
  ];

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#0B2D5C]/12 bg-white shadow-[0_18px_50px_rgba(11,45,92,0.08)]">
      <div className="relative">
        {profile.profile_photo_url ? (
          <div className="aspect-[3/4] w-full overflow-hidden bg-[#0B2D5C]">
            <img
              src={profile.profile_photo_url}
              alt={`${displayName} profile photo`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center bg-gradient-to-b from-[#0B2D5C] to-[#0A2540] px-8 text-center">
            <p className="text-lg text-white/90">Add a clear photo so someone can put a face to your story.</p>
          </div>
        )}
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center rounded-full bg-[#F8F6F2]/95 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#0B2D5C] shadow-sm">
            Your Preview
          </span>
        </div>
      </div>

      <div className="space-y-5 px-6 pb-9 pt-7 sm:px-8 sm:pb-10 sm:pt-8">
        <header className="border-b border-[#0B2D5C]/10 pb-7">
          <h2 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#0B2D5C] sm:text-5xl">
            {displayName}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {profile.age ? (
              <span className="rounded-full bg-[#0B2D5C]/[0.06] px-4 py-2 text-sm font-medium text-[#0B2D5C]">
                {profile.age} years old
              </span>
            ) : null}
            {profile.location ? (
              <span className="rounded-full bg-[#0B2D5C]/[0.06] px-4 py-2 text-sm font-medium text-[#0B2D5C]">
                {profile.location}
              </span>
            ) : null}
          </div>
        </header>

        {profile.short_bio ? (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              About
            </p>
            <p className="text-base leading-relaxed text-[#333333]">{profile.short_bio}</p>
          </section>
        ) : null}

        {profile.more_about ? (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              More About
            </p>
            <p className="text-base leading-relaxed text-[#333333]">{profile.more_about}</p>
          </section>
        ) : null}

        <div className="grid gap-3">
          {details.map((detail) => (
            <DetailBlock key={detail.label} label={detail.label} value={detail.value} />
          ))}
        </div>

        {profile.things_i_enjoy.length > 0 ? (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              Things I Enjoy
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.things_i_enjoy.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[#F8F6F2] px-4 py-2 text-sm font-medium text-[#0B2D5C]"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {(profile.favorite_music_artists.length > 0 ||
          profile.favorite_music_songs.length > 0) && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D62828]">
              Favorite Music
            </p>
            {profile.favorite_music_artists.length > 0 ? (
              <p className="text-sm text-[#333333]">
                <span className="font-semibold text-[#0B2D5C]">Artists: </span>
                {profile.favorite_music_artists.join(', ')}
              </p>
            ) : null}
            {profile.favorite_music_songs.length > 0 ? (
              <p className="mt-2 text-sm text-[#333333]">
                <span className="font-semibold text-[#0B2D5C]">Songs: </span>
                {profile.favorite_music_songs.join(', ')}
              </p>
            ) : null}
          </section>
        )}

        <section className="rounded-3xl border border-dashed border-[#0B2D5C]/15 bg-[#F8F6F2]/70 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5A6575]">
            Coming Soon
          </p>
          <p className="mt-2 text-sm text-[#5A6575]">
            Voice Introduction and Video Introduction are not part of your profile yet.
          </p>
        </section>
      </div>
    </article>
  );
}
