export type Role = 'user' | 'venue_owner' | 'admin';

export type ProfileType =
  | 'collector'
  | 'enthusiast'
  | 'student'
  | 'artist'
  | 'gallery_professional';

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  collector: 'Collector',
  enthusiast: 'Enthusiast',
  student: 'Student',
  artist: 'Artist',
  gallery_professional: 'Gallery Professional',
};

export type VenueType = 'museum' | 'gallery';

export type ExhibitionStatus = 'pending' | 'approved' | 'rejected';

export type RejectionReason = 'outside_sydney' | 'incomplete' | 'no_image' | 'other';

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  outside_sydney: 'Outside Sydney',
  incomplete: 'Incomplete',
  no_image: 'No image',
  other: 'Other',
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
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  opening_datetime: string | null; // ISO
  description: string;
  image_url: string | null;
  status: ExhibitionStatus;
  rejection_reason: RejectionReason | null;
  is_featured: boolean;
  city: string;
  submitted_by: string | null;
  venue?: Venue;
}

export interface WatchlistEntry {
  user_id: string;
  exhibition_id: string;
  created_at: string;
}

export interface Visit {
  id: string;
  user_id: string;
  exhibition_id: string;
  rating: number; // 1–5
  reflection: string;
  visit_date: string; // YYYY-MM-DD
  exhibition?: Exhibition;
}

export interface SubmissionInput {
  venue_id: string | null; // existing venue, or null with new_venue_name
  new_venue_name?: string;
  new_venue_type?: VenueType;
  new_venue_address?: string;
  title: string;
  artists: string;
  start_date: string;
  end_date: string;
  opening_datetime: string | null;
  description: string;
  image_url: string | null; // local uri in demo mode; storage url in supabase mode
  submitter_email?: string; // for public submissions
}

export interface ExhibitionPatch {
  title?: string;
  artists?: string;
  start_date?: string;
  end_date?: string;
  opening_datetime?: string | null;
  description?: string;
  image_url?: string | null;
  is_featured?: boolean;
}
