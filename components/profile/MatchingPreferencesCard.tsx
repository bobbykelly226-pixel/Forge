'use client';

import { useState, useTransition } from 'react';

import { saveOnboardingMatchingPreferences } from '@/app/actions/onboarding';
import {
  SEX_OPTIONS,
  INTERESTED_IN_OPTIONS,
  MAX_DISTANCE_MILES,
  MAX_MATCH_AGE,
  MIN_DISTANCE_MILES,
  MIN_MATCH_AGE,
  matchingPreferencesAreComplete,
} from '@/lib/profile/matching-preferences';
import type { Tables } from '@/lib/supabase/database.types';

export default function MatchingPreferencesCard({
  initialPreferences,
  hasPrivateCoordinates,
}: {
  initialPreferences: Tables<'profile_preferences'> | null;
  hasPrivateCoordinates: boolean;
}) {
  const [genderIdentity, setGenderIdentity] = useState(initialPreferences?.gender_identity ?? '');
  const [interestedIn, setInterestedIn] = useState(initialPreferences?.interested_in ?? []);
  const [minimumAge, setMinimumAge] = useState(initialPreferences?.preferred_age_min ?? 25);
  const [maximumAge, setMaximumAge] = useState(initialPreferences?.preferred_age_max ?? 55);
  const [distance, setDistance] = useState(initialPreferences?.max_distance_miles ?? 50);
  const [editing, setEditing] = useState(!matchingPreferencesAreComplete(initialPreferences));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await saveOnboardingMatchingPreferences({
        genderIdentity,
        interestedIn,
        preferredAgeMin: minimumAge,
        preferredAgeMax: maximumAge,
        maxDistanceMiles: distance,
      });
      setMessage(result.message);
      if (result.success) setEditing(false);
    });
  };

  const toggleInterest = (value: string) => {
    setInterestedIn([value]);
  };

  return (
    <section className="rounded-[1.75rem] border border-[#0B2D5C]/08 bg-white/90 p-6 shadow-[0_12px_40px_rgba(11,45,92,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0B2D5C]">Matching preferences</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#5A6575]">
            Private settings used reciprocally for Discovery.
          </p>
        </div>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-[#0B2D5C]">
            Edit
          </button>
        ) : null}
      </div>

      {!hasPrivateCoordinates ? (
        <p className="mt-4 rounded-2xl bg-[#FFF4E5] px-4 py-3 text-sm text-[#7A4A00]">
          Add or reselect your location below so Forge can calculate distance privately.
        </p>
      ) : null}

      {editing ? (
        <div className="mt-5 space-y-5">
          <label className="block text-sm font-semibold text-[#0B2D5C]">
            I am
            <select
              value={genderIdentity}
              onChange={(event) => setGenderIdentity(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/20 bg-white px-4 py-3"
            >
              <option value="">Choose one</option>
              {SEX_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-[#0B2D5C]">I am interested in</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTED_IN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={interestedIn.includes(option.value)}
                  onClick={() => toggleInterest(option.value)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium ${
                    interestedIn.includes(option.value)
                      ? 'border-[#0B2D5C] bg-[#0B2D5C] text-white'
                      : 'border-[#0B2D5C]/20 text-[#0B2D5C]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-[#0B2D5C]">
              Minimum age
              <input type="number" min={MIN_MATCH_AGE} max={MAX_MATCH_AGE} value={minimumAge} onChange={(event) => setMinimumAge(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/20 px-4 py-3" />
            </label>
            <label className="text-sm font-semibold text-[#0B2D5C]">
              Maximum age
              <input type="number" min={MIN_MATCH_AGE} max={MAX_MATCH_AGE} value={maximumAge} onChange={(event) => setMaximumAge(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-[#0B2D5C]/20 px-4 py-3" />
            </label>
          </div>

          <label className="block text-sm font-semibold text-[#0B2D5C]">
            Maximum distance: {distance} miles
            <input type="range" min={MIN_DISTANCE_MILES} max={MAX_DISTANCE_MILES} step="5" value={distance} onChange={(event) => setDistance(Number(event.target.value))} className="mt-3 w-full accent-[#D62828]" />
          </label>

          {message ? <p className="text-sm text-[#5A6575]" role="status">{message}</p> : null}
          <button type="button" disabled={isPending} onClick={save} className="w-full rounded-2xl bg-[#D62828] px-5 py-3 font-semibold text-white disabled:opacity-60">
            {isPending ? 'Saving…' : 'Save matching preferences'}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-[#0B2D5C]">
          Ages {minimumAge}–{maximumAge} · Within {distance} miles
        </p>
      )}
    </section>
  );
}
