import { Venue } from './types';

// A short, human-readable type label. Commercial galleries, non-profit spaces
// and artist-run initiatives are distinguished via the category where set.
export function venueTypeLabel(v: Pick<Venue, 'type' | 'category'>): string {
  switch (v.type) {
    case 'museum':
      return 'Museum';
    case 'ari':
      return 'Artist-run initiative';
    case 'gallery':
      if (v.category === 'commercial') return 'Commercial gallery';
      if (v.category === 'institution' || v.category === 'public') return 'Non-profit gallery';
      if (v.category === 'first_nations') return 'First Nations gallery';
      return 'Gallery';
    default:
      return 'Venue';
  }
}

// The three facts for the venue description block: type, when it was founded,
// and whether entry is free or paid. Each is only surfaced when known — unknown
// values are returned so the UI can flag them rather than guess.
export interface VenueFacts {
  typeLabel: string;
  foundedYear: number | null;
  entry: 'free' | 'paid' | null;
  checked: string | null;
}

export function venueFacts(v: Venue): VenueFacts {
  // Entry: an explicit free_entry always wins. Otherwise galleries and
  // artist-run initiatives are free by nature (commercial, public, regional and
  // university galleries in Sydney do not charge admission) — only museums,
  // which vary, are left unknown until verified.
  const entry: 'free' | 'paid' | null =
    v.free_entry != null ? (v.free_entry ? 'free' : 'paid') : v.type !== 'museum' ? 'free' : null;
  return {
    typeLabel: venueTypeLabel(v),
    foundedYear: v.founded_year ?? null,
    entry,
    checked: v.entry_checked ?? null,
  };
}
