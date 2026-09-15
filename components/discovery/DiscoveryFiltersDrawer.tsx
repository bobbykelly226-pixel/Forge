'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';

import {
  DISCOVERY_CATEGORICAL_FILTER_OPTIONS,
  discoveryThingsIEnjoyOptions,
  type DiscoveryFilterOption,
} from '@/lib/discovery/filter-options';
import {
  EMPTY_DISCOVERY_FILTERS,
  type DiscoveryFilters,
} from '@/lib/discovery/filters';
import type { DiscoveryFeedCardModel } from '@/lib/discovery/presentation';
import DiscoveryMatchingPreferences, {
  type DiscoveryMatchingLocation,
} from '@/components/discovery/DiscoveryMatchingPreferences';
import DiscoveryNonNegotiables from '@/components/discovery/DiscoveryNonNegotiables';
import type { Tables } from '@/lib/supabase/database.types';

type StringArrayKey = {
  [K in keyof DiscoveryFilters]: DiscoveryFilters[K] extends string[] ? K : never;
}[keyof DiscoveryFilters];

function FilterChecklist({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string;
  options: ReadonlyArray<DiscoveryFilterOption>;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  if (options.length === 0) return null;

  return (
    <details
      className={`group overflow-hidden rounded-2xl border bg-white transition ${
        selected.length > 0
          ? 'border-[#0B2D5C]/35 shadow-[0_6px_18px_rgba(11,45,92,0.06)]'
          : 'border-[#0B2D5C]/12'
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#0B2D5C]">{legend}</span>
          <span className="mt-0.5 block text-xs text-[#6B7585]">
            {selected.length > 0
              ? `${selected.length} selected`
              : 'Any option'}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[#0B2D5C] transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <fieldset className="border-t border-[#0B2D5C]/08 px-4 py-4">
        <legend className="sr-only">{legend}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition ${
                  checked
                    ? 'border-[#0B2D5C] bg-[#E8EEF6] text-[#0B2D5C]'
                    : 'border-[#0B2D5C]/12 bg-white text-[#5A6575]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(
                      checked
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value]
                    )
                  }
                  className="h-4 w-4 rounded border-[#0B2D5C]/30 accent-[#0B2D5C]"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </details>
  );
}

export default function DiscoveryFiltersDrawer({
  open,
  profiles,
  filters,
  onChange,
  onClose,
  initialPreferences,
  initialLocation,
}: {
  open: boolean;
  profiles: DiscoveryFeedCardModel[];
  filters: DiscoveryFilters;
  onChange: (filters: DiscoveryFilters) => void;
  onClose: () => void;
  initialPreferences: Tables<'profile_preferences'> | null;
  initialLocation: DiscoveryMatchingLocation;
}) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  const thingsIEnjoyOptions = useMemo(
    () => discoveryThingsIEnjoyOptions(profiles),
    [profiles]
  );

  if (!open) return null;

  const updateArray = (key: StringArrayKey, values: string[]) =>
    onChange({ ...filters, [key]: values });

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(11, 45, 92, 0.28)' }}
        aria-hidden="true"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        tabIndex={-1}
        data-discovery-filters
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-filter-title"
        className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-xl bg-[#E6E6E7] shadow-2xl outline-none sm:max-h-[88dvh] sm:rounded-xl"
      >
        <header data-profile-chrome="header" className="sticky top-0 z-10 flex items-center justify-between border-b border-[#0B2D5C]/08 bg-[#FBF9F6]/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-[#D62828]" aria-hidden="true" />
            <div>
              <h2 id="discovery-filter-title" className="text-xl font-semibold text-[#0B2D5C]">
                Discovery Filters
              </h2>
              <p className="text-xs text-[#6B7585]">
                Choose what matters for the profiles already eligible for you.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#0B2D5C] hover:bg-[#E8EEF6]"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-7 px-5 py-6 sm:px-7">
          <DiscoveryMatchingPreferences
            initialPreferences={initialPreferences}
            initialLocation={initialLocation}
          />

          <DiscoveryNonNegotiables initialValue={initialPreferences?.non_negotiables} />

          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-[#0B2D5C]">More filters</h3>
              <p className="mt-1 text-sm text-black">
                These choices narrow the eligible profiles currently shown to you.
              </p>
            </div>
            <FilterChecklist
              legend="Relationship Alignment"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.alignment}
              selected={filters.alignment}
              onChange={(value) => updateArray('alignment', value)}
            />
            <FilterChecklist
              legend="Relationship goals"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.relationshipGoals}
              selected={filters.relationshipGoals}
              onChange={(value) => updateArray('relationshipGoals', value)}
            />
            <FilterChecklist
              legend="Faith identity"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.faithIdentity}
              selected={filters.faithIdentity}
              onChange={(value) => updateArray('faithIdentity', value)}
            />
            <FilterChecklist
              legend="Importance of faith"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.faithImportance}
              selected={filters.faithImportance}
              onChange={(value) => updateArray('faithImportance', value)}
            />
            <FilterChecklist
              legend="Has children"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.hasChildren}
              selected={filters.hasChildren}
              onChange={(value) => updateArray('hasChildren', value)}
            />
            <FilterChecklist
              legend="Wants children"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.wantsChildren}
              selected={filters.wantsChildren}
              onChange={(value) => updateArray('wantsChildren', value)}
            />
            <FilterChecklist
              legend="Smoking"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.smoking}
              selected={filters.smoking}
              onChange={(value) => updateArray('smoking', value)}
            />
            <FilterChecklist
              legend="Drinking"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.drinking}
              selected={filters.drinking}
              onChange={(value) => updateArray('drinking', value)}
            />
            <FilterChecklist
              legend="Pets"
              options={DISCOVERY_CATEGORICAL_FILTER_OPTIONS.pets}
              selected={filters.pets}
              onChange={(value) => updateArray('pets', value)}
            />
            <FilterChecklist
              legend="Things they enjoy"
              options={thingsIEnjoyOptions}
              selected={filters.thingsIEnjoy}
              onChange={(value) => updateArray('thingsIEnjoy', value)}
            />
          </div>
        </div>

        <footer className="sticky bottom-0 flex gap-3 border-t border-[#0B2D5C]/08 bg-[#FBF9F6]/95 px-5 py-4 backdrop-blur sm:px-7">
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_DISCOVERY_FILTERS })}
            className="flex-1 rounded-2xl border border-[#0B2D5C]/20 bg-white px-4 py-3 text-sm font-semibold text-[#0B2D5C]"
          >
            Clear more filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-[#0B2D5C] px-4 py-3 text-sm font-semibold text-white"
          >
            Show profiles
          </button>
        </footer>
      </section>
    </div>
  );
}
