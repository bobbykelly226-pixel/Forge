import type { DemoConnection } from '@/lib/demo/demo-connections';

type DemoConnectionPortraitProps = {
  connection: DemoConnection;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-16 w-16 rounded-2xl text-xl',
  md: 'h-24 w-24 rounded-2xl text-2xl lg:h-28 lg:w-28 lg:text-3xl',
  lg: 'aspect-[3/4] w-full rounded-[1.25rem] text-4xl lg:rounded-[1.5rem] lg:text-5xl',
} as const;

/**
 * Portrait for demo fixtures. Uses photoUrl when present; otherwise a polished
 * initials placeholder on the shared Forge gradient treatment.
 */
export default function DemoConnectionPortrait({
  connection,
  size = 'md',
}: DemoConnectionPortraitProps) {
  return (
    <div className={`relative shrink-0 overflow-hidden ${sizeClasses[size]}`}>
      {connection.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local/demo asset path reserved for later
        <img
          src={connection.photoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: connection.portraitGradient,
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
      {!connection.photoUrl && (
        <span
          className="absolute inset-0 flex items-center justify-center font-semibold tracking-wide text-white/90"
          style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          aria-hidden="true"
        >
          {connection.initials}
        </span>
      )}
      <span className="sr-only">{`${connection.firstName}, portrait`}</span>
    </div>
  );
}
