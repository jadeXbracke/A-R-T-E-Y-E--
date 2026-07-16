export type Role = 'user' | 'venue_owner' | 'admin';

export type ProfileType =
  | 'collector'
  | 'enthusiast'
  | 'student'
  | 'artist'
  | 'gallery_professional';

export const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: 'collector', label: 'COLLECTOR' },
  { value: 'enthusiast', label: 'ENTHUSIAST' },
  { value: 'student', label: 'STUDENT' },
  { value: 'artist', label: 'ARTIST' },
  { value: 'gallery_professional', label: 'GALLERY PROFESSIONAL' },
];

export type VenueType = 'museum' | 'gallery';

export type ExhibitionStatus = 'pending' | 'approved' | 'rejected';

export type RejectionReason = 'outside_sydney' | 'incomplete' | 'no_image' | 'other';

export const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: 'outside_sydney', label: 'OUTSIDE SYDNEY' },
  { value: 'incomplete', label: 'INCOMPLETE' },
  { value: 'no_image', label: 'NO IMAGE' },
  { value: 'other', label: 'OTHER' },
];

export interface Profile {
  id: string;
  email: string;
  role: Role;
  profile_type: ProfileType;
  display_name: string;
  city: string;
}

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  address: string | null;
  city: string;
  owner_user_id: string | null;
}

export interface Exhibition {
  id: string;
  venue_id: string;
  title: string;
  artists: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  opening_datetime: string | null; // ISO
  description: string;
  image_url: string | null; // remote url, or "asset:<slug>" for bundled placeholders
  status: ExhibitionStatus;
  rejection_reason: RejectionReason | null;
  is_featured: boolean;
  city: string;
  venue?: Venue;
}

export interface WatchlistEntry {
  user_id: string;
  exhibition_id: string;
  created_at: string;
}

export interface Visit {
  user_id: string;
  exhibition_id: string;
  rating: number; // 1–5
  reflection: string;
  visit_date: string; // YYYY-MM-DD
}

export interface ExhibitionDraft {
  title: string;
  artists: string;
  start_date: string;
  end_date: string;
  opening_datetime: string | null;
  description: string;
  image_url: string | null;
  venue_name: string;
  venue_type: VenueType;
  venue_address: string;
}

export type AgendaFilter = 'all' | 'opening_soon' | 'closing_soon' | 'museums' | 'galleries';
