/**
 * Public-safe location formatting (City, State only — never postal/coords).
 */

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  'district of columbia': 'DC',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};

export const US_STATE_OPTIONS = Object.entries(US_STATE_NAME_TO_CODE)
  .map(([name, code]) => ({
    code,
    name: name.replace(/\b\w/g, (char) => char.toUpperCase()),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function normalizeRegionCode(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const mapped = US_STATE_NAME_TO_CODE[trimmed.toLowerCase()];
  return mapped ?? trimmed;
}

export function formatPublicLocation(input: {
  city?: string | null;
  region?: string | null;
  fallback?: string | null;
}): string | null {
  const city = input.city?.trim() ?? '';
  const region = normalizeRegionCode(input.region);
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;

  const fallback = input.fallback?.trim();
  if (!fallback) return null;
  return fallback;
}

/**
 * Best-effort parse of legacy "City, State" free text into structured parts.
 */
export function parseLegacyLocationText(raw: string | null | undefined): {
  city: string | null;
  region: string | null;
  country: string | null;
} {
  if (!raw?.trim()) {
    return { city: null, region: null, country: null };
  }

  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { city: null, region: null, country: null };
  }

  if (parts.length === 1) {
    const only = parts[0]!;
    const asRegion = normalizeRegionCode(only);
    if (asRegion && asRegion !== only && /^[A-Z]{2}$/.test(asRegion)) {
      return { city: null, region: asRegion, country: 'US' };
    }
    return { city: only, region: null, country: null };
  }

  const city = parts[0]!;
  const region = normalizeRegionCode(parts[1]!);
  const countryPart = parts[2] ?? null;
  const country =
    countryPart && /united states|usa|u\.s\.a\.?/i.test(countryPart)
      ? 'US'
      : countryPart
        ? countryPart
        : region && /^[A-Z]{2}$/.test(region)
          ? 'US'
          : null;

  return { city, region, country };
}

export type StandardizedLocation = {
  city: string;
  region: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  provider: string | null;
};

export function toPublicLocationFields(location: StandardizedLocation | null): {
  location: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
} {
  if (!location) {
    return {
      location: null,
      location_city: null,
      location_region: null,
      location_country: null,
    };
  }

  const city = location.city.trim();
  const region = normalizeRegionCode(location.region) ?? location.region.trim();
  const country = location.country.trim() || 'US';
  return {
    location: formatPublicLocation({ city, region }),
    location_city: city || null,
    location_region: region || null,
    location_country: country || null,
  };
}
