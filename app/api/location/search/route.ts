import { NextResponse } from 'next/server';

import { searchLocations } from '@/lib/location/geocode';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchLocations(query, { limit: 8, countryCode: 'US' });
    // Never return raw provider payloads beyond the standardized shape.
    return NextResponse.json({
      results: results.map((row) => ({
        id: row.id,
        city: row.city,
        region: row.region,
        country: row.country,
        countryCode: row.countryCode,
        latitude: row.latitude,
        longitude: row.longitude,
        postalCode: row.postalCode,
        label: row.label,
        provider: row.provider,
      })),
    });
  } catch (error) {
    console.error('location search:', error);
    return NextResponse.json(
      { error: 'Location search is temporarily unavailable.' },
      { status: 502 }
    );
  }
}
