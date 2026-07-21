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

export type VenueType = 'museum' | 'gallery' | 'ari';

export const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: 'gallery', label: 'GALLERY' },
  { value: 'museum', label: 'MUSEUM' },
  { value: 'ari', label: 'ARI' }, // artist-run initiative
];

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
  slug?: string;
  type: VenueType;
  address: string | null;
  suburb?: string | null;
  website?: string | null;
  instagram?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city: string;
  owner_user_id: string | null;
  is_claimed?: boolean; // an owner account is attached
  is_fixture?: boolean; // test data — kept out of the public feed
  category?: string | null; // institution / public / commercial / ari / first_nations / event / day_trip / auction
  tier?: string | null; // editorial weight: 1, 1b, 2, 2b, 3, 3b, 4
  editorial_note?: string | null;
  free_entry?: boolean | null;
  image_url?: string | null; // photo of the gallery/museum space
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
  is_fixture?: boolean; // test data — kept out of the public feed
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

// Host-only: the fields the admin edits when adding or changing a venue.
export interface VenueDraft {
  name: string;
  type: VenueType;
  address: string | null;
  suburb?: string | null;
  website?: string | null;
  instagram?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_fixture?: boolean;
  image_url?: string | null; // photo of the space
}

// ---- curated lists ----------------------------------------------------------
export type CuratorRole = 'artist' | 'gallerist' | 'curator';

// A public, human-curated selection of exhibitions — by an artist, a gallery
// owner, or the editors. Lives in the guides tables in live mode.
export interface CuratedList {
  id: string;
  title: string;
  curator_name: string;
  curator_role: CuratorRole;
  intro: string;
  exhibition_ids: string[];
}

// ---- venue freshness pipeline (owner review) --------------------------------
export type ProposalAction = 'add' | 'archive' | 'update';
export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface EvidenceItem {
  url: string;
  snippet: string;
  checked_at?: string;
}

// A proposed change from the pipeline. Nothing is applied until the owner
// approves it in the Owner Inbox.
export interface VenueProposal {
  id: string;
  venue_id: string | null; // null = new-venue suggestion
  action_type: ProposalAction;
  proposed_payload: Record<string, unknown>;
  evidence: EvidenceItem[];
  confidence: number | null;
  reason: string;
  status: ProposalStatus;
  review_note?: string | null;
  created_at: string;
}

export type AgendaFilter =
  | 'all'
  | 'opening_soon'
  | 'closing_soon'
  | 'museums'
  | 'galleries'
  | 'aris';
