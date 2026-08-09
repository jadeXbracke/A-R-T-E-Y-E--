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

// Art-category vocabulary — styles and movements, the way audiences browse
// (Contemporary, Abstract, Pop Art…), stored in exhibitions.mediums.
export const MEDIUMS: { value: string; label: string }[] = [
  { value: 'contemporary', label: 'CONTEMPORARY' },
  { value: 'modern', label: 'MODERN' },
  { value: 'abstract', label: 'ABSTRACT' },
  { value: 'figurative', label: 'FIGURATIVE' },
  { value: 'conceptual', label: 'CONCEPTUAL' },
  { value: 'pop_art', label: 'POP ART' },
  { value: 'street_art', label: 'STREET ART' },
  { value: 'minimalism', label: 'MINIMALISM' },
  { value: 'surrealism', label: 'SURREALISM' },
  { value: 'digital_art', label: 'DIGITAL ART' },
  { value: 'first_nations', label: 'FIRST NATIONS & INDIGENOUS' },
  { value: 'classical', label: 'CLASSICAL & HISTORICAL' },
];

export function mediumLabel(value: string): string {
  return MEDIUMS.find((m) => m.value === value)?.label ?? value.toUpperCase();
}

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
  is_private?: boolean; // closed profile — activity only visible to accepted followers
  avatar_url?: string | null; // profile picture; monogram fallback when unset
}

// ---- social layer (Strava-style follow + activity feed) ---------------------
export type FollowState = 'none' | 'requested' | 'following';

export interface Follow {
  follower_id: string;
  followee_id: string;
  status: 'accepted' | 'pending'; // pending = awaiting a private profile's approval
  created_at: string;
}

// A profile as seen by a viewer, with social counts and the viewer's relationship.
export interface PublicProfile extends Profile {
  followers: number;
  following: number;
  visit_count: number;
  follow_state: FollowState;
  can_view_activity: boolean; // public, own profile, or an accepted follower
}

// One entry in the activity feed — a friend logging a visit to a show.
export interface FeedItem {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  exhibition_id: string;
  exhibition_title: string;
  venue_name: string | null;
  rating: number;
  reflection: string;
  visit_date: string; // YYYY-MM-DD
  photo_urls?: string[]; // the post's photos — its main visual component
  video_url?: string | null; // short clip attached to the post
}

// Likes + comment count on a post, from the viewer's perspective.
// Keyed by FeedItem.id (`${user_id}:${exhibition_id}`) in engagement maps.
export interface PostEngagement {
  likes: number;
  liked_by_me: boolean;
  comments: number;
}

export interface PostComment {
  id: string;
  post_user_id: string; // the post's author
  exhibition_id: string;
  user_id: string; // the commenter
  display_name: string;
  avatar_url?: string | null;
  body: string;
  created_at: string;
}

// One "something happened to your post" event: a like or a comment by
// someone else, newest first. Powers the activity screen and its badge.
export interface ActivityEvent {
  id: string;
  kind: 'like' | 'comment';
  actor_id: string;
  actor_name: string;
  exhibition_id: string; // the post is (you, this exhibition)
  exhibition_title: string;
  body?: string; // the comment text, for kind === 'comment'
  created_at: string;
}

// ---- direct messages --------------------------------------------------------
export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

// One inbox row: the other party, the latest message, and how many of
// their messages the viewer hasn't read yet.
export interface Conversation {
  peer: Profile;
  last: DirectMessage;
  unread: number;
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
  google_maps_url?: string | null; // Google Maps search link built from name + address
  city: string;
  owner_user_id: string | null;
  is_claimed?: boolean; // an owner account is attached
  is_fixture?: boolean; // test data — kept out of the public feed
  category?: string | null; // institution / public / commercial / ari / first_nations / event / day_trip / auction
  tier?: string | null; // editorial weight: 1, 1b, 2, 2b, 3, 3b, 4
  editorial_note?: string | null;
  free_entry?: boolean | null;
  founded_year?: number | null; // year the venue was established — verified, else null
  entry_checked?: string | null; // YYYY-MM-DD the type/founded/entry facts were verified
  image_url?: string | null; // photo of the gallery/museum space
  video_url?: string | null; // short muted clip of the space — plays as a moving background
  reel_url?: string | null; // link to an Instagram Reel or TikTok the venue posted
  opening_hours?: string | null; // e.g. "Tue–Sat 10:00–17:00" — verified from the venue's website
  hours_checked?: string | null; // YYYY-MM-DD the hours were last verified
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
  image_source?: string | null; // page a pipeline-fetched press image came from
  video_url?: string | null; // short muted clip — plays as a moving background where set
  reel_url?: string | null; // link to an Instagram Reel or TikTok about the show
  mediums?: string[]; // art-medium tags from the MEDIUMS vocabulary
  status: ExhibitionStatus;
  rejection_reason: RejectionReason | null;
  is_featured: boolean;
  is_fixture?: boolean; // test data — kept out of the public feed
  city: string;
  venue?: Venue;
}

// Art fairs — curated, mostly international editorial content (not user
// submitted). Rendered in the Fairs tab the same way venues are listed.
export interface Fair {
  id: string;
  name: string;
  city: string;
  country: string;
  venue_name: string; // the host venue / convention centre
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  dates_estimated?: boolean; // true = edition dates not yet confirmed officially
  description: string;
  website: string;
  google_maps_url?: string | null; // built from venue_name + address
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
  photo_urls?: string[]; // the post's photos — its main visual component
  video_url?: string | null; // short clip the user attached to the post
}

export interface ExhibitionDraft {
  title: string;
  artists: string;
  start_date: string;
  end_date: string;
  opening_datetime: string | null;
  description: string;
  image_url: string | null;
  video_url?: string | null;
  reel_url?: string | null;
  mediums?: string[];
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
  video_url?: string | null; // short muted clip of the space
  reel_url?: string | null; // Instagram Reel or TikTok link
  opening_hours?: string | null;
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
