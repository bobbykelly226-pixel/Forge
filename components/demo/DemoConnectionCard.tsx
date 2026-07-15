import Link from 'next/link';

import DemoConnectionPortrait from '@/components/demo/DemoConnectionPortrait';
import {
  demoConnectionDetailPath,
  type DemoConnection,
} from '@/lib/demo/demo-connections';

const cardShell =
  'overflow-hidden rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 shadow-[0_12px_40px_rgba(11,45,92,0.06)] backdrop-blur-sm';

export default function DemoConnectionCard({
  connection,
}: {
  connection: DemoConnection;
}) {
  const hasNumericIndex = connection.compatibilityIndex != null;
  const signalPreview = connection.characterSignals.slice(0, 2);
  const detailHref = demoConnectionDetailPath(connection.id);

  return (
    <article className={cardShell}>
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(11rem,26%)_minmax(0,1fr)] lg:gap-6">
        <DemoConnectionPortrait connection={connection} size="lg" />
        <div className="flex min-w-0 flex-col p-5 sm:p-6 lg:p-7 lg:pl-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                className="text-xl leading-none tracking-[-0.02em] text-[#0B2D5C] lg:text-[1.35rem]"
                style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
              >
                {connection.firstName}, {connection.age}
              </h2>
              <p className="mt-1 text-[15px] text-[#5A6575]">{connection.location}</p>
            </div>
            <span className="inline-flex rounded-full border border-[#0B2D5C]/12 bg-[#E8EEF6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0B2D5C]/75">
              Demo Connection
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
              Relationship Alignment
            </p>
            <p
              className="mt-1 text-base font-medium text-[#0B2D5C] lg:text-lg"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {connection.alignmentLabel}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A8494]">
                Compatibility Index
              </p>
              <p
                className="mt-1 text-base font-semibold text-[#0B2D5C]"
                aria-label={
                  hasNumericIndex
                    ? `Compatibility Index ${connection.compatibilityIndexDisplay}`
                    : 'Compatibility Index not yet available'
                }
              >
                {connection.compatibilityIndexDisplay}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A8494]">
                Confidence
              </p>
              <p className="mt-1 text-base font-semibold text-[#0B2D5C]">
                {connection.confidence}
              </p>
            </div>
          </div>

          {connection.cardFactorSummary ? (
            <div className="mt-3 flex gap-2 rounded-xl border border-[#0B2D5C]/12 bg-[#FBF9F6] px-3 py-2.5">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B2D5C] text-[10px] font-bold text-white"
                aria-hidden="true"
              >
                i
              </span>
              <p className="text-xs leading-relaxed text-[#5A6575] lg:text-sm">
                <span className="font-semibold text-[#0B2D5C]">
                  Important Alignment Factor:{' '}
                </span>
                {connection.cardFactorSummary}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-[#5A6575]">
              No major alignment concerns currently identified.
            </p>
          )}

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
              Character Signals
            </p>
            {signalPreview.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {signalPreview.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-1 text-xs font-medium text-[#0B2D5C]"
                  >
                    {signal}
                  </span>
                ))}
                {connection.characterSignals.length > signalPreview.length ? (
                  <span className="rounded-full border border-[#0B2D5C]/08 bg-white px-3 py-1 text-xs font-medium text-[#6B7585]">
                    +{connection.characterSignals.length - signalPreview.length} more
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#5A6575]">
                {connection.characterSignalsEmptyCopy ?? 'No public Character Signals yet'}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={detailHref}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
            >
              View Compatibility
            </Link>
            <span
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0B2D5C]/12 px-4 py-3 text-sm font-medium text-[#8A93A0]"
              title="Messaging is unavailable in the demo showcase"
            >
              Message · Demo only
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
