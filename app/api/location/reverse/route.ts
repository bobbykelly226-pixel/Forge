import { NextResponse } from 'next/server';

import { reverseGeocode } from '@/lib/location/geocode';
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
  const lat = Number.parseFloat(searchParams.get('lat') ?? '');
  const lng = Number.parseFloat(searchParams.get('lng') ?? '');

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });
  }

  // Bound to plausible Earth ranges — reject spoofed nonsense.
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });
  }

  try {
    const result = await reverseGeocode(lat, lng);
    if (!result) {
      return NextResponse.json({ result: null });
    }

    return NextResponse.json({
      result: {
        id: result.id,
        city: result.city,
        region: result.region,
        country: result.country,
        countryCode: result.countryCode,
        latitude: result.latitude,
        longitude: result.longitude,
        postalCode: result.postalCode,
        label: result.label,
        provider: result.provider,
      },
    });
  } catch (error) {
    console.error('location reverse:', error);
    return NextResponse.json(
      { error: 'Could not resolve your current location.' },
      { status: 502 }
    );
  }
}
