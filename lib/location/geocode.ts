/**
 * Server-side location search via Open-Meteo Geocoding API (no API key).
 * Returns standardized city/region results for Profile Edit autocomplete.
 */

import { normalizeRegionCode } from '@/lib/profile/location-format';

export type LocationSearchResult = {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  postalCode: string | null;
  label: string;
  provider: 'open-meteo' | 'nominatim' | 'manual';
};

type OpenMeteoResult = {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin1_id?: number;
  postcodes?: string[];
};

function buildLabel(city: string, region: string, countryCode: string): string {
  if (city && region) {
    return countryCode === 'US' ? `${city}, ${region}` : `${city}, ${region}, ${countryCode}`;
  }
  return city || region || countryCode;
}

export function mapOpenMeteoResult(row: OpenMeteoResult): LocationSearchResult | null {
  const city = row.name?.trim();
  if (!city) return null;
  if (typeof row.latitude !== 'number' || typeof row.longitude !== 'number') return null;

  const countryCode = (row.country_code ?? '').toUpperCase() || 'US';
  const region =
    normalizeRegionCode(row.admin1) ??
    row.admin1?.trim() ??
    '';
  const postalCode = row.postcodes?.[0]?.trim() || null;
  const id = String(row.id ?? `${city}-${region}-${row.latitude}-${row.longitude}`);

  return {
    id,
    city,
    region,
    country: row.country?.trim() || countryCode,
    countryCode,
    latitude: row.latitude,
    longitude: row.longitude,
    postalCode,
    label: buildLabel(city, region, countryCode),
    provider: 'open-meteo',
  };
}

export async function searchLocations(
  query: string,
  options?: { limit?: number; countryCode?: string }
): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const limit = Math.min(Math.max(options?.limit ?? 8, 1), 15);
  const params = new URLSearchParams({
    name: trimmed,
    count: String(limit),
    language: 'en',
    format: 'json',
  });
  if (options?.countryCode) {
    params.set('countryCode', options.countryCode);
  }

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ForgeDatingApp/1.0 (profile-location-search)',
      },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    throw new Error(`Location search failed (${response.status})`);
  }

  const payload = (await response.json()) as { results?: OpenMeteoResult[] };
  const mapped = (payload.results ?? [])
    .map(mapOpenMeteoResult)
    .filter((row): row is LocationSearchResult => row != null);

  // Prefer US results first for Forge's current audience, then others.
  return mapped.sort((a, b) => {
    if (a.countryCode === 'US' && b.countryCode !== 'US') return -1;
    if (a.countryCode !== 'US' && b.countryCode === 'US') return 1;
    return a.label.localeCompare(b.label);
  });
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationSearchResult | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  // Open-Meteo has no dedicated reverse endpoint; use Nominatim with a proper UA.
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '10',
    addressdetails: '1',
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ForgeDatingApp/1.0 (profile-location-reverse)',
      },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    throw new Error(`Reverse geocode failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    place_id?: number;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      state?: string;
      country?: string;
      country_code?: string;
      postcode?: string;
    };
  };

  const address = payload.address;
  if (!address) return null;

  const city =
    address.city?.trim() ||
    address.town?.trim() ||
    address.village?.trim() ||
    address.municipality?.trim() ||
    '';
  const region = normalizeRegionCode(address.state) ?? address.state?.trim() ?? '';
  const countryCode = (address.country_code ?? '').toUpperCase() || 'US';

  if (!city && !region) return null;

  return {
    id: String(payload.place_id ?? `${latitude},${longitude}`),
    city: city || region,
    region,
    country: address.country?.trim() || countryCode,
    countryCode,
    latitude,
    longitude,
    postalCode: address.postcode?.trim() || null,
    label: buildLabel(city || region, region, countryCode),
    provider: 'nominatim',
  };
}
