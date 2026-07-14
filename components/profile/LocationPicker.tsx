'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';

import { US_STATE_OPTIONS } from '@/lib/profile/location-format';

export type LocationPickerValue = {
  city: string;
  region: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  placeId: string;
  provider: string;
  label: string;
};

type SearchHit = {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  postalCode: string | null;
  label: string;
  provider: string;
};

type LocationPickerProps = {
  initial: LocationPickerValue;
};

const inputClassName =
  'w-full px-6 py-4 rounded-2xl border border-[#0B2D5C]/30 focus:border-[#0B2D5C] focus:outline-none focus:ring-2 focus:ring-[#0B2D5C]/20 text-lg';

function emptyValue(): LocationPickerValue {
  return {
    city: '',
    region: '',
    country: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    placeId: '',
    provider: '',
    label: '',
  };
}

export default function LocationPicker({ initial }: LocationPickerProps) {
  const listId = useId();
  const [query, setQuery] = useState(initial.label || initial.city || '');
  const [value, setValue] = useState<LocationPickerValue>(initial);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(
    Boolean(initial.city && initial.region && !initial.placeId)
  );
  const [isPending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const applyHit = (hit: SearchHit) => {
    const next: LocationPickerValue = {
      city: hit.city,
      region: hit.region,
      country: hit.countryCode || hit.country || 'US',
      postalCode: hit.postalCode ?? '',
      latitude: String(hit.latitude),
      longitude: String(hit.longitude),
      placeId: hit.id,
      provider: hit.provider,
      label: hit.label,
    };
    setValue(next);
    setQuery(hit.label);
    setHits([]);
    setOpen(false);
    setManualMode(false);
    setError(null);
  };

  const clearLocation = () => {
    setValue(emptyValue());
    setQuery('');
    setHits([]);
    setError(null);
  };

  const runSearch = (term: string) => {
    if (term.trim().length < 2) {
      setHits([]);
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/location/search?q=${encodeURIComponent(term.trim())}`
          );
          if (!response.ok) {
            throw new Error('search failed');
          }
          const payload = (await response.json()) as { results?: SearchHit[] };
          setHits(payload.results ?? []);
          setOpen(true);
          setError(null);
        } catch {
          setHits([]);
          setError('Search unavailable — use City and State below.');
          setManualMode(true);
        }
      })();
    });
  };

  const onQueryChange = (next: string) => {
    setQuery(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(next), 280);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Current location is not available in this browser.');
      setManualMode(true);
      return;
    }

    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const response = await fetch(
              `/api/location/reverse?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
            );
            if (!response.ok) {
              throw new Error('reverse failed');
            }
            const payload = (await response.json()) as { result?: SearchHit | null };
            if (!payload.result) {
              setError('Could not determine your city. Enter it manually.');
              setManualMode(true);
              return;
            }
            applyHit(payload.result);
          } catch {
            setError('Could not use current location. Enter City and State instead.');
            setManualMode(true);
          } finally {
            setLocating(false);
          }
        })();
      },
      () => {
        setLocating(false);
        setError('Location permission was not granted. Enter City and State instead.');
        setManualMode(true);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="location_search" className="block text-sm font-medium text-[#0B2D5C] mb-2">
          Location
        </label>
        <p className="text-sm text-[#666666] mb-2">
          Search for a city, state, or postal code. Only city and state appear on your public
          profile.
        </p>
        <p className="text-xs text-[#888888] mb-3">Optional — you can leave location unanswered.</p>

        <input
          id="location_search"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={() => {
            if (hits.length > 0) setOpen(true);
          }}
          onBlur={() => {
            blurTimerRef.current = setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Start typing a city or postal code"
          className={inputClassName}
          autoComplete="off"
        />

        {open && hits.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="mt-2 max-h-56 overflow-auto rounded-2xl border border-[#0B2D5C]/15 bg-white shadow-sm"
          >
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-5 py-3 text-left text-[#0B2D5C] hover:bg-[#F8F6F2]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyHit(hit)}
                  aria-selected={false}
                >
                  {hit.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="rounded-2xl border border-[#0B2D5C]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0B2D5C] hover:bg-[#F8F6F2] disabled:opacity-60"
          >
            {locating ? 'Locating…' : 'Use current location'}
          </button>
          <button
            type="button"
            onClick={() => setManualMode((current) => !current)}
            className="rounded-2xl border border-[#0B2D5C]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0B2D5C] hover:bg-[#F8F6F2]"
          >
            {manualMode ? 'Hide manual entry' : 'Enter city and state'}
          </button>
          {(value.city || value.region || query) && (
            <button
              type="button"
              onClick={clearLocation}
              className="rounded-2xl px-4 py-2 text-sm font-medium text-[#666666] hover:text-[#D62828]"
            >
              Clear location
            </button>
          )}
        </div>

        {isPending ? <p className="mt-2 text-sm text-[#666666]">Searching…</p> : null}
        {error ? (
          <p className="mt-2 text-sm text-[#A61F1F]" role="status">
            {error}
          </p>
        ) : null}
      </div>

      {manualMode ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="manual_city" className="block text-sm font-medium text-[#0B2D5C] mb-2">
              City
            </label>
            <input
              id="manual_city"
              type="text"
              value={value.city}
              onChange={(event) => {
                const city = event.target.value;
                setValue((current) => ({
                  ...current,
                  city,
                  provider: current.provider || 'manual',
                  placeId: '',
                  label: city && current.region ? `${city}, ${current.region}` : city,
                }));
                setQuery(city && value.region ? `${city}, ${value.region}` : city);
              }}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="manual_region" className="block text-sm font-medium text-[#0B2D5C] mb-2">
              State
            </label>
            <select
              id="manual_region"
              value={value.region}
              onChange={(event) => {
                const region = event.target.value;
                setValue((current) => ({
                  ...current,
                  region,
                  country: current.country || 'US',
                  provider: current.provider || 'manual',
                  placeId: '',
                  label: current.city && region ? `${current.city}, ${region}` : current.city,
                }));
                setQuery(value.city && region ? `${value.city}, ${region}` : value.city);
              }}
              className={inputClassName}
            >
              <option value="">Select state</option>
              {US_STATE_OPTIONS.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name} ({state.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {/* Hidden authoritative fields — public gets city/region only via server save. */}
      <input type="hidden" name="location_city" value={value.city} />
      <input type="hidden" name="location_region" value={value.region} />
      <input type="hidden" name="location_country" value={value.country} />
      <input type="hidden" name="location_postal_code" value={value.postalCode} />
      <input type="hidden" name="location_latitude" value={value.latitude} />
      <input type="hidden" name="location_longitude" value={value.longitude} />
      <input type="hidden" name="location_place_id" value={value.placeId} />
      <input type="hidden" name="location_provider" value={value.provider} />
    </div>
  );
}
