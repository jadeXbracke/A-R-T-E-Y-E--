import { Venue } from './types';

// Google Maps directions — tapping an address starts the route straight away.
export function directionsUrl(v: Pick<Venue, 'name' | 'address' | 'latitude' | 'longitude'>) {
  const dest =
    v.latitude != null && v.longitude != null
      ? `${v.latitude},${v.longitude}`
      : `${v.name} ${v.address ?? 'Sydney NSW'}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}
