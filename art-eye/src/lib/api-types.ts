import { Comment, CuratedList, Exhibition, ExhibitionDraft, ExhibitionProposal, FeedItem, FollowState, Profile, ProfileType, PublicProfile, RejectionReason, Role, Venue, VenueDraft, VenueProposal, VenueType, Visit } from './types';

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  profile_type: ProfileType;
  role: Exclude<Role, 'admin'>;
  venue?: { name: string; type: VenueType; address: string };
}

export interface Api {
  // auth
  getSessionProfile(): Promise<Profile | null>;
  signIn(email: string, password: string): Promise<Profile>;
  signUp(input: SignUpInput): Promise<Profile>;
  signOut(): Promise<void>;

  // agenda
  listApprovedExhibitions(): Promise<Exhibition[]>;
  getExhibition(id: string): Promise<Exhibition | null>;
  listCuratedLists(): Promise<CuratedList[]>;

  // curation
  listWatchlist(userId: string): Promise<string[]>;
  addToWatchlist(userId: string, exhibitionId: string): Promise<void>;
  removeFromWatchlist(userId: string, exhibitionId: string): Promise<void>;
  listVisits(userId: string): Promise<Visit[]>;
  saveVisit(visit: Visit): Promise<void>;

  // submissions
  submitExhibition(draft: ExhibitionDraft, userId: string | null): Promise<void>;
  myVenue(userId: string): Promise<Venue | null>;
  listMySubmissions(userId: string): Promise<Exhibition[]>;
  updateSubmission(id: string, patch: Partial<Exhibition>, userId: string): Promise<void>;

  // admin
  listPending(): Promise<Exhibition[]>;
  adminUpdateExhibition(id: string, patch: Partial<Exhibition>): Promise<void>;
  approveExhibition(id: string): Promise<void>;
  rejectExhibition(id: string, reason: RejectionReason): Promise<void>;

  // host control — full ownership of what's in the app.
  // Guarded twice: the UI only calls these for role === 'admin', and the
  // database RLS only lets an admin execute them. Both must agree.
  listVenues(): Promise<Venue[]>;
  createVenue(input: VenueDraft): Promise<Venue>;
  updateVenue(id: string, patch: Partial<Venue>): Promise<void>;
  deleteVenue(id: string): Promise<void>; // cascades to the venue's exhibitions
  listAllExhibitions(): Promise<Exhibition[]>;
  adminCreateExhibition(draft: ExhibitionDraft): Promise<void>; // published immediately
  deleteExhibition(id: string): Promise<void>;

  // owner inbox — pipeline proposals. Approve is the ONLY path from a
  // proposal into venues; reject snoozes the identical proposal for 90 days.
  listProposals(): Promise<VenueProposal[]>;
  approveProposal(proposal: VenueProposal, payload: Record<string, unknown>): Promise<void>;
  rejectProposal(id: string, note: string): Promise<void>;

  // shows inbox — exhibitions the discovery pipeline found. Owner-only, same
  // double guard: the UI hides it for everyone but the admin, and the
  // database (RLS + the is_admin() check inside the approval RPC) refuses
  // any other account regardless of what the client asks.
  listExhibitionProposals(): Promise<ExhibitionProposal[]>;
  approveExhibitionProposal(id: string): Promise<void>;
  rejectExhibitionProposal(id: string): Promise<void>;

  // social layer — follow graph, privacy and the friends activity feed
  getPublicProfile(userId: string, viewerId: string | null): Promise<PublicProfile>;
  followUser(viewerId: string, targetId: string): Promise<FollowState>;
  unfollowUser(viewerId: string, targetId: string): Promise<void>;
  listFollowers(userId: string): Promise<Profile[]>;
  listFollowing(userId: string): Promise<Profile[]>;
  listFollowRequests(userId: string): Promise<Profile[]>; // pending requests to approve
  respondFollowRequest(userId: string, requesterId: string, accept: boolean): Promise<void>;
  setProfilePrivacy(userId: string, isPrivate: boolean): Promise<void>;
  discoverPeople(viewerId: string): Promise<Profile[]>; // people the viewer can follow
  friendsFeed(viewerId: string): Promise<FeedItem[]>; // activity from accepted follows
  userActivity(userId: string, viewerId: string | null): Promise<FeedItem[]>;

  // reactions on posts (Letterboxd-style) — a post is (postUserId, exhibitionId)
  getPost(postUserId: string, exhibitionId: string, viewerId: string | null): Promise<FeedItem | null>;
  likePost(likerId: string, postUserId: string, exhibitionId: string): Promise<void>;
  unlikePost(likerId: string, postUserId: string, exhibitionId: string): Promise<void>;
  listComments(postUserId: string, exhibitionId: string): Promise<Comment[]>;
  addComment(authorId: string, postUserId: string, exhibitionId: string, text: string): Promise<Comment>;

  // media
  uploadImage(localUri: string): Promise<string>;
}
