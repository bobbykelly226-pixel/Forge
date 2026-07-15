import Link from 'next/link';

import DemoConnectionPortrait from '@/components/demo/DemoConnectionPortrait';
import {
  DEMO_CONNECTIONS_ROUTE,
  DEMO_VIEWER,
  factorSeverityStyles,
  type DemoConnection,
} from '@/lib/demo/demo-connections';

const cardClassName =
  'rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.06)] backdrop-blur-sm sm:p-7';

export default function DemoCompatibilityDetail({
  connection,
}: {
  connection: DemoConnection;
}) {
  const hasNumericIndex = connection.compatibilityIndex != null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-8 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-10 lg:pt-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={DEMO_CONNECTIONS_ROUTE}
          className="inline-flex min-h-11 items-center text-sm font-medium text-[#0B2D5C]/70 transition hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
        >
          ← Back to Demo Connections
        </Link>
        <span className="inline-flex rounded-full border border-[#0B2D5C]/12 bg-[#E8EEF6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0B2D5C]/75">
          Demo Connection
        </span>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(14rem,30%)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:gap-10">
        <div className="space-y-4">
          <DemoConnectionPortrait connection={connection} size="lg" />
          <section className={cardClassName} aria-labelledby="demo-profile-summary">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
              Profile summary
            </p>
            <h1
              id="demo-profile-summary"
              className="mt-2 text-[1.85rem] leading-none tracking-[-0.02em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {connection.firstName}, {connection.age}
            </h1>
            <p className="mt-2 text-[15px] text-[#5A6575]">{connection.location}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
              {connection.aboutPreview}
            </p>
          </section>
        </div>

        <div className="mt-6 space-y-4 lg:mt-0">
          {/* Relationship Alignment + Compatibility Index + Confidence */}
          <section className={cardClassName} aria-labelledby="demo-alignment-heading">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D62828]">
              Relationship Alignment
            </p>
            <h2
              id="demo-alignment-heading"
              className="mt-2 text-2xl tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {connection.alignmentLabel}
            </h2>

            <div className="mt-5 grid gap-4 border-t border-[#0B2D5C]/06 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                  Compatibility Index
                </p>
                <p
                  className="mt-1.5 text-2xl font-semibold tracking-tight text-[#0B2D5C]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                  aria-label={
                    hasNumericIndex
                      ? `Compatibility Index ${connection.compatibilityIndexDisplay}`
                      : 'Compatibility Index not yet available'
                  }
                >
                  {connection.compatibilityIndexDisplay}
                </p>
                {!hasNumericIndex && (
                  <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
                    A numeric score is withheld until Forge has enough shared answers.
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8494]">
                  Confidence
                </p>
                <p className="mt-1.5 text-lg font-semibold text-[#0B2D5C]">
                  {connection.confidence}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#5A6575]">
                  The index supports the explanation — it does not replace conversation or judgment.
                </p>
              </div>
            </div>

            {connection.incompleteAssessmentCopy ? (
              <p className="mt-5 rounded-2xl border border-dashed border-[#0B2D5C]/18 bg-[#F8F6F2] px-4 py-3 text-[15px] leading-relaxed text-[#3D4654]">
                {connection.incompleteAssessmentCopy}
              </p>
            ) : null}
          </section>

          {/* Why you align */}
          <section className={cardClassName} aria-labelledby="demo-strengths-heading">
            <h2
              id="demo-strengths-heading"
              className="text-xl tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              {connection.strengthsHeading}
            </h2>
            <ul className="mt-4 space-y-3">
              {connection.sharedStrengths.map((strength) => (
                <li
                  key={strength}
                  className="flex items-start gap-3 rounded-[1.25rem] border border-[#0B2D5C]/06 bg-white/80 px-4 py-3"
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B2D5C] text-[11px] font-bold text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-[15px] leading-relaxed text-[#3D4654]">{strength}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Important Alignment Factors */}
          <section className={cardClassName} aria-labelledby="demo-factors-heading">
            <h2
              id="demo-factors-heading"
              className="text-xl tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Important Alignment Factors
            </h2>
            {connection.importantFactors.length === 0 ? (
              <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
                {connection.noFactorsCopy ??
                  'No major alignment concerns surfaced from the information currently available.'}
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {connection.importantFactors.map((factor) => {
                  const styles = factorSeverityStyles(factor.severity);
                  return (
                    <li
                      key={factor.id}
                      className={`rounded-[1.5rem] border-2 ${styles.borderClass} ${styles.backgroundClass} p-5`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${styles.badgeClass}`}
                        >
                          {styles.badgeLabel}
                        </span>
                        <span className="sr-only">
                          Severity: {factor.severity.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#0B2D5C]">{factor.title}</h3>
                      {(factor.viewerAnswer || factor.partnerAnswer) && (
                        <dl className="mt-4 space-y-3">
                          {factor.partnerAnswer ? (
                            <div className="rounded-2xl bg-white/80 px-4 py-3">
                              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                                {connection.firstName}
                              </dt>
                              <dd className="mt-1 text-[15px] font-medium text-[#0B2D5C]">
                                {factor.partnerAnswer}
                              </dd>
                            </div>
                          ) : null}
                          {factor.viewerAnswer ? (
                            <div className="rounded-2xl bg-white/80 px-4 py-3">
                              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A93A0]">
                                {DEMO_VIEWER.label}
                              </dt>
                              <dd className="mt-1 text-[15px] font-medium text-[#0B2D5C]">
                                {factor.viewerAnswer}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      )}
                      <p className="mt-4 text-[15px] leading-relaxed text-[#3D4654]">
                        {factor.explanation}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Compatibility breakdown */}
          <section className={cardClassName} aria-labelledby="demo-breakdown-heading">
            <h2
              id="demo-breakdown-heading"
              className="text-xl tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Compatibility breakdown
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#7A8494]">
              Category guidance based on completed answers — not a game score.
            </p>
            <ul className="mt-5 space-y-3">
              {connection.breakdown.map((row) => {
                const score = row.score;
                const available = score != null;
                const width = available ? Math.max(8, Math.min(100, score)) : 0;
                return (
                  <li
                    key={row.label}
                    className="rounded-[1.25rem] border border-[#0B2D5C]/06 bg-[#FBF9F6] px-4 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-[#0B2D5C]">{row.label}</p>
                      <p className="text-sm font-semibold text-[#0B2D5C]">
                        {available ? row.score : (row.unavailableLabel ?? 'Unavailable')}
                      </p>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-[#0B2D5C]/08"
                      role="presentation"
                      aria-hidden="true"
                    >
                      {available ? (
                        <div
                          className="h-full rounded-full bg-[#0B2D5C]/55"
                          style={{ width: `${width}%` }}
                        />
                      ) : (
                        <div className="h-full w-full rounded-full border border-dashed border-[#0B2D5C]/15 bg-transparent" />
                      )}
                    </div>
                    <p className="sr-only">
                      {available
                        ? `${row.label}: ${row.score}`
                        : `${row.label}: ${row.unavailableLabel ?? 'Unavailable'}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Character Signals */}
          <section className={cardClassName} aria-labelledby="demo-signals-heading">
            <h2
              id="demo-signals-heading"
              className="text-xl tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Character Signals
            </h2>
            {connection.characterSignals.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {connection.characterSignals.map((signal) => (
                  <li
                    key={signal}
                    className="rounded-full border border-[#0B2D5C]/10 bg-[#F8F6F2] px-3 py-1.5 text-sm font-medium text-[#0B2D5C]"
                  >
                    {signal}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[15px] leading-relaxed text-[#5A6575]">
                {connection.characterSignalsEmptyCopy ?? 'No public Character Signals yet'}
              </p>
            )}
          </section>

          {/* Conversation topics */}
          <section className={cardClassName} aria-labelledby="demo-topics-heading">
            <h2
              id="demo-topics-heading"
              className="text-xl tracking-[-0.01em] text-[#0B2D5C]"
              style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
            >
              Suggested topics to discuss
            </h2>
            <ul className="mt-4 space-y-3">
              {connection.conversationTopics.map((topic) => (
                <li
                  key={topic}
                  className="rounded-[1.25rem] border border-[#0B2D5C]/08 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(11,45,92,0.04)]"
                >
                  <p
                    className="text-[16px] leading-relaxed text-[#0B2D5C]"
                    style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                  >
                    “{topic}”
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#7A8494]">Use these as starting points, not scripts.</p>
          </section>

          <p className="text-center text-xs text-[#8A93A0]">
            Demo showcase only — read-only fixtures. No messages, connections, or Supabase writes.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={DEMO_CONNECTIONS_ROUTE}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-[#0B2D5C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
            >
              Return to Demo Connections
            </Link>
            <span className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0B2D5C]/12 px-4 py-3 text-sm font-medium text-[#8A93A0]">
              Open to Chat · Demo only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
