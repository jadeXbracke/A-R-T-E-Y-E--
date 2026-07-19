export type Role = 'user' | 'venue_owner' | 'admin';

export type ProfileType =
  | 'collector'
  | 'enthusiast'
  | 'student'
  | 'artist'
  | 'gallery_professional';

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  collector: 'COLLECTOR',
  enthusiast: 'ENTHUSIAST',
  student: 'STUDENT',
  artist: 'ARTIST',
  gallery_professional: 'GALLERY PROFESSIONAL',
};

export type VenueType = 'museum' | 'gallery';

export type ExhibitionStatus = 'pending' | 'approved' | 'rejected';

export type RejectionReason =
  | 'outside_sydney'
  | 'incomplete'
  | 'no_image'
  | 'other';

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  outside_sydney: 'OUTSIDE SYDNEY',
  incomplete: 'INCOMPLETE',
  no_image: 'NO IMAGE',
  other: 'OTHER',
};

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
  image_url: string | null; // remote URL, local uri, or "asset:<key>"
  status: ExhibitionStatus;
  rejection_reason: RejectionReason | null;
  is_featured: boolean;
  city: string;
  submitted_by: string | null;
  venue?: Venue;
}

export interface WatchlistItem {
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
  venue_address: string;
  title: string;
  artists: string;
  start_date: string;
  end_date: string;
  opening_datetime: string | null;
  description: string;
  image_url: string | null;
}
