import { Venue } from './types';

// Google Maps directions — tapping an address starts the route straight away.
export function directionsUrl(v: Pick<Venue, 'name' | 'address' | 'latitude' | 'longitude'>) {
  const dest =
    v.latitude != null && v.longitude != null
      ? `${v.latitude},${v.longitude}`
      : `${v.name} ${v.address ?? 'Sydney NSW'}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

// Google Maps place search — opens the venue's location card (name + address).
// When no street address is on file it falls back to name + suburb + city so the
// link still resolves for well-known venues, rather than inventing an address.
export function mapsSearchUrl(v: Pick<Venue, 'name' | 'address' | 'suburb' | 'city'>) {
  const locality = v.address ?? [v.suburb, v.city ?? 'Sydney NSW'].filter(Boolean).join(', ');
  const query = `${v.name}, ${locality}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
