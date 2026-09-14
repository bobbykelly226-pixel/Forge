'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { saveDiscoveryMatchingPreferences } from '@/app/actions/discovery-preferences';
import LocationPicker, {
  type LocationPickerValue,
} from '@/components/profile/LocationPicker';
import {
  INTERESTED_IN_OPTIONS,
  MAX_DISTANCE_MILES,
  MAX_MATCH_AGE,
  MIN_DISTANCE_MILES,
  MIN_MATCH_AGE,
  getInterestedInSelections,
  toggleInterestedInSelection,
  type InterestedInChoice,
} from '@/lib/profile/matching-preferences';
import type { Tables } from '@/lib/supabase/database.types';

const MATCH_AGES = Array.from(
  { length: MAX_MATCH_AGE - MIN_MATCH_AGE + 1 },
  (_, index) => MIN_MATCH_AGE + index
);

export type DiscoveryMatchingLocation = LocationPickerValue;

export default function DiscoveryMatchingPreferences({
  initialPreferences,
  initialLocation,
}: {
  initialPreferences: Tables<'profile_preferences'> | null;
  initialLocation: DiscoveryMatchingLocation;
}) {
  const router = useRouter();
  const [interestedIn, setInterestedIn] = useState(() =>
    getInterestedInSelections(initialPreferences?.interested_in)
  );
  const [minimumAge, setMinimumAge] = useState(
    initialPreferences?.preferred_age_min ?? 25
  );
  const [maximumAge, setMaximumAge] = useState(
    initialPreferences?.preferred_age_max ?? 55
  );
  const [distance, setDistance] = useState(
    initialPreferences?.max_distance_miles ?? 50
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleInterest = (value: InterestedInChoice) => {
    setInterestedIn((current) => toggleInterestedInSelection(current, value));
    setMessage(null);
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveDiscoveryMatchingPreferences(formData);
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  };

  return (
    <form
      onSubmit={save}
      className="space-y-5 rounded-[6px] border border-[#0B2D5C] bg-[#E6E6E7] p-5"
    >
      <div>
        <h3 className="text-lg font-semibold text-[#0B2D5C]">Who you want to meet</h3>
        <p className="mt-1 text-sm leading-relaxed text-black">
          These private settings shape which profiles are eligible for you.
        </p>
      </div>

      <input
        type="hidden"
        name="gender_identity"
        value={initialPreferences?.gender_identity ?? ''}
      />
      {interestedIn.map((value) => (
        <input key={value} type="hidden" name="interested_in" value={value} />
      ))}

      <fieldset>
        <legend className="text-sm font-semibold text-[#0B2D5C]">I’m interested in</legend>
        <p className="mt-1 text-sm text-black">Choose one or both.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {INTERESTED_IN_OPTIONS.map((option) => {
            const selected = interestedIn.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                disabled={isPending}
                onClick={() => toggleInterest(option.value)}
                className={`min-h-12 rounded-[6px] border px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                  selected
                    ? 'border-[#0B2D5C] bg-[#0B2D5C] text-white'
                    : 'border-[#0B2D5C]/25 bg-[#F7F7F7] text-[#0B2D5C]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-[#0B2D5C]">Age range</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-[#0B2D5C]">
            Minimum
            <select
              name="preferred_age_min"
              value={minimumAge}
              disabled={isPending}
              onChange={(event) => {
                setMinimumAge(Number(event.target.value));
                setMessage(null);
              }}
              className="mt-2 min-h-12 w-full rounded-[6px] border border-[#0B2D5C]/25 bg-[#F7F7F7] px-3 py-3 text-base"
            >
              {MATCH_AGES.map((age) => <option key={age} value={age}>{age}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-[#0B2D5C]">
            Maximum
            <select
              name="preferred_age_max"
              value={maximumAge}
              disabled={isPending}
              onChange={(event) => {
                setMaximumAge(Number(event.target.value));
                setMessage(null);
              }}
              className="mt-2 min-h-12 w-full rounded-[6px] border border-[#0B2D5C]/25 bg-[#F7F7F7] px-3 py-3 text-base"
            >
              {MATCH_AGES.map((age) => <option key={age} value={age}>{age}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <label className="block text-sm font-semibold text-[#0B2D5C]">
        Maximum distance: {distance} miles
        <input
          type="range"
          name="max_distance_miles"
          min={MIN_DISTANCE_MILES}
          max={MAX_DISTANCE_MILES}
          step="5"
          value={distance}
          disabled={isPending}
          onChange={(event) => {
            setDistance(Number(event.target.value));
            setMessage(null);
          }}
          className="mt-3 w-full accent-[#C92027]"
        />
      </label>

      <LocationPicker
        initial={initialLocation}
        label="My matching location"
        description="Used privately to calculate distance. Only your city and state appear publicly."
        optional={false}
        allowManual={false}
      />

      {message ? (
        <p
          role="status"
          className={`text-sm ${message === 'Matching preferences saved.' ? 'text-green-800' : 'text-[#A61F1F]'}`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 w-full rounded-[6px] bg-[#0B2D5C] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2540] disabled:opacity-60"
      >
        {isPending ? 'Saving…' : 'Save matching preferences'}
      </button>
    </form>
  );
}
