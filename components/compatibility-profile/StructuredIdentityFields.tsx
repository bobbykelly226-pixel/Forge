'use client';

import type { QuestionDefinition } from '@/lib/questionnaire/types';
import type { PersistedIdentityFields } from '@/lib/questionnaire/persistence/answer-state';

type StructuredIdentityFieldsProps = {
  question: QuestionDefinition;
  identity: PersistedIdentityFields;
  onChange: (identity: PersistedIdentityFields) => void;
};

export default function StructuredIdentityFields({
  question,
  identity,
  onChange,
}: StructuredIdentityFieldsProps) {
  const config = question.structuredIdentity;
  if (!config) return null;

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_55%,transparent)] bg-[var(--forge-surface-soft)] px-4 py-4">
      <p className="text-sm font-medium text-[var(--forge-navy)]">
        Optional identity details
      </p>
      <p className="text-sm leading-relaxed text-[var(--forge-graphite)]">
        These details stay private unless you choose otherwise below. Defaults keep your identity
        private.
      </p>

      {config.allowsRefinement ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--forge-navy)]">
            Optional refinement
          </span>
          <textarea
            value={identity.refinement ?? ''}
            onChange={(event) =>
              onChange({ ...identity, refinement: event.target.value })
            }
            rows={3}
            maxLength={2000}
            className="mt-2 w-full rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-4 py-3 text-sm text-[var(--forge-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          />
        </label>
      ) : null}

      {config.allowsUserSuppliedIdentity ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--forge-navy)]">
            Another identity in your own words
          </span>
          <input
            type="text"
            value={identity.userSupplied ?? ''}
            onChange={(event) =>
              onChange({ ...identity, userSupplied: event.target.value })
            }
            maxLength={200}
            className="mt-2 w-full rounded-2xl border border-[color-mix(in_srgb,var(--forge-silver)_70%,transparent)] bg-white px-4 py-3 text-sm text-[var(--forge-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          />
        </label>
      ) : null}

      {config.privacy.userControlsPublicDisplay ? (
        <label className="flex items-start gap-3 text-sm text-[var(--forge-navy)]">
          <input
            type="checkbox"
            checked={Boolean(identity.publicDisplayAllowed)}
            onChange={(event) =>
              onChange({
                ...identity,
                publicDisplayAllowed: event.target.checked,
              })
            }
            className="mt-1 h-4 w-4 rounded border-[var(--forge-silver)] text-[var(--forge-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          />
          <span>
            Allow this identity to appear on my public profile later.
            Saving this preference does not display it publicly in this build.
          </span>
        </label>
      ) : null}

      {config.privacy.userControlsPrivateMatchingUse ? (
        <label className="flex items-start gap-3 text-sm text-[var(--forge-navy)]">
          <input
            type="checkbox"
            checked={Boolean(identity.privateMatchingAllowed)}
            onChange={(event) =>
              onChange({
                ...identity,
                privateMatchingAllowed: event.target.checked,
              })
            }
            className="mt-1 h-4 w-4 rounded border-[var(--forge-silver)] text-[var(--forge-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-navy)]"
          />
          <span>
            Allow this identity to be used privately for future matching.
            This is separate from public display.
          </span>
        </label>
      ) : null}
    </div>
  );
}
