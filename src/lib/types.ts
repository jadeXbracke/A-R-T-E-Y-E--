export type UserRole = 'user' | 'venue_owner' | 'admin';

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

export type RejectionReason =
  | 'outside_sydney'
  | 'incomplete'
  | 'no_image'
  | 'other';

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  outside_sydney: 'Outside Sydney',
  incomplete: 'Incomplete',
  no_image: 'No image',
  other: 'Other',
};

export interface Profile {
  id: string;
  role: UserRole;
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
  owner_user_id?: string | null;
}

export interface Exhibition {
  id: string;
  venue_id: string;
  title: string;
  artists: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  opening_datetime: string | null; // ISO datetime
  description: string | null;
  image_url: string | null;
  status: ExhibitionStatus;
  rejection_reason: string | null;
  is_featured: boolean;
  city: string;
  submitted_by?: string | null;
  submitter_email?: string | null;
  venue?: Venue;
}

export interface Visit {
  user_id: string;
  exhibition_id: string;
  rating: number; // 1–5
  reflection: string | null;
  visit_date: string; // ISO date
}

export interface SubmissionInput {
  venue_name: string;
  venue_type: VenueType;
  venue_address?: string;
  title: string;
  artists: string;
  start_date: string;
  end_date: string;
  opening_datetime?: string | null;
  description?: string;
  image_url?: string | null;
  submitter_email?: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  profile_type: ProfileType;
  role: 'user' | 'venue_owner';
}
