import type { HubProfileCard } from '@/lib/data/connections-hub';

type ConnectionPortraitProps = {
  profile: HubProfileCard;
  size?: 'sm' | 'md' | 'lg';
  overlay?: React.ReactNode;
};

const sizeClasses = {
  sm: 'h-16 w-16 rounded-2xl',
  md: 'h-24 w-24 rounded-2xl lg:h-28 lg:w-28',
  lg: 'aspect-[3/4] w-full rounded-[1.25rem] lg:rounded-[1.5rem]',
} as const;

export function ConnectionPortrait({
  profile,
  size = 'md',
  overlay,
}: ConnectionPortraitProps) {
  return (
    <div className={`relative shrink-0 overflow-hidden ${sizeClasses[size]}`}>
      {profile.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- connection hub portraits may be local fixtures
        <img
          src={profile.photoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: profile.portraitGradient,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
      )}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.35), transparent 42%)',
        }}
        aria-hidden="true"
      />
      <span className="sr-only">{`${profile.firstName}, portrait`}</span>
      {overlay}
    </div>
  );
}

export function ConnectionIdentity({
  profile,
  compact = false,
}: {
  profile: HubProfileCard;
  compact?: boolean;
}) {
  const title =
    profile.age != null ? `${profile.firstName}, ${profile.age}` : profile.firstName;

  return (
    <div>
      <h3
        className={`leading-none tracking-[-0.02em] text-[#0B2D5C] ${
          compact ? 'text-lg' : 'text-xl lg:text-[1.35rem]'
        }`}
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {title}
      </h3>
      {profile.location ? (
        <p className={`mt-1 text-[#5A6575] ${compact ? 'text-sm' : 'text-[15px]'}`}>
          {profile.location}
        </p>
      ) : null}
    </div>
  );
}

export function ConnectionAlignment({
  profile,
}: {
  profile: HubProfileCard;
}) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
        Relationship Alignment
      </p>
      <p
        className="mt-1.5 text-base font-semibold text-[#0B2D5C] lg:text-lg"
        style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
      >
        {profile.alignmentLabel}
      </p>
    </div>
  );
}

export function ImportantFactorsBadge({ profile }: { profile: HubProfileCard }) {
  if (!profile.hasImportantFactors) return null;

  return (
    <div className="mt-3 flex gap-2 rounded-xl border border-[#D62828]/60 bg-[#FBF6EE] px-3 py-2.5">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D62828] text-[10px] font-bold text-white"
        aria-hidden="true"
      >
        !
      </span>
      <p className="text-xs leading-relaxed text-[#5A6575] lg:text-sm">
        {profile.importantFactorsSummary?.trim()
          ? profile.importantFactorsSummary
          : 'Review alignment details on their profile.'}
      </p>
    </div>
  );
}
