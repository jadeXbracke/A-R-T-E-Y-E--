export type Role = 'user' | 'venue_owner' | 'admin';

export type ProfileType =
  | 'collector'
  | 'enthusiast'
  | 'student'
  | 'artist'
  | 'gallery_professional';

export const PROFILE_TYPE_LABEL: Record<ProfileType, string> = {
  collector: 'Collector',
  enthusiast: 'Enthusiast',
  student: 'Student',
  artist: 'Artist',
  gallery_professional: 'Gallery Professional',
};

export type VenueType = 'museum' | 'gallery';

export type ExhibitionStatus = 'pending' | 'approved' | 'rejected';

export type RejectionReason = 'outside_sydney' | 'incomplete' | 'no_image' | 'other';

export const REJECTION_REASON_LABEL: Record<RejectionReason, string> = {
  outside_sydney: 'Outside Sydney',
  incomplete: 'Incomplete',
  no_image: 'No image',
  other: 'Other',
};

export interface UserProfile {
  id: string;
  role: Role;
  profile_type: ProfileType;
  display_name: string;
  city: string;
  email?: string;
}

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  address: string;
  city: string;
  owner_user_id: string | null;
}

export interface Exhibition {
  id: string;
  venue_id: string;
  title: string;
  artists: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  opening_datetime: string | null; // ISO datetime
  description: string;
  image_url: string | null;
  status: ExhibitionStatus;
  rejection_reason: RejectionReason | null;
  is_featured: boolean;
  city: string;
  submitted_by: string | null; // user id, null for public submissions
  submitter_contact: string | null; // email for public submissions
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
  visit_date: string; // ISO date
}

export interface ExhibitionInput {
  venue_name: string;
  venue_type: VenueType;
  title: string;
  artists: string;
  start_date: string;
  end_date: string;
  opening_datetime: string | null;
  description: string;
  image_url: string | null;
  submitter_contact?: string | null;
}

export type AgendaFilter = 'all' | 'opening_soon' | 'closing_soon' | 'museums' | 'galleries';

export const AGENDA_FILTERS: { key: AgendaFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'opening_soon', label: 'OPENING SOON' },
  { key: 'closing_soon', label: 'CLOSING SOON' },
  { key: 'museums', label: 'MUSEUMS' },
  { key: 'galleries', label: 'GALLERIES' },
];
