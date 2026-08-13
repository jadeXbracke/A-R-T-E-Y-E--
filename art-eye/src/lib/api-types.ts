import { Block, Comment, Conversation, CuratedList, DirectMessage, Exhibition, ExhibitionDraft, ExhibitionProposal, Feedback, FeedbackDraft, FeedItem, FollowState, ImageCandidate, Profile, ProfileType, PublicProfile, RejectionReason, Role, Venue, VenueDraft, VenueProposal, VenueType, Visit } from './types';

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

  // photo picking: read candidate photographs off the venue's own pages so
  // the owner chooses the image (setImage is a normal admin write, still
  // guarded by RLS).
  listImageCandidates(exhibitionId: string): Promise<ImageCandidate[]>;
  setExhibitionImage(exhibitionId: string, imageUrl: string | null): Promise<void>;
  listVenueImageCandidates(venueId: string): Promise<ImageCandidate[]>;
  setVenueImage(venueId: string, imageUrl: string | null): Promise<void>;

  // password recovery (live mode only): Supabase mails a sign-in link that
  // returns to the app, after which updatePassword sets the new one.
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;

  // social layer — follow graph, privacy and the friends activity feed
  getPublicProfile(userId: string, viewerId: string | null): Promise<PublicProfile>;
  followUser(viewerId: string, targetId: string): Promise<FollowState>;
  unfollowUser(viewerId: string, targetId: string): Promise<void>;
  listFollowers(userId: string): Promise<Profile[]>;
  listFollowing(userId: string): Promise<Profile[]>;
  listFollowRequests(userId: string): Promise<Profile[]>; // pending requests to approve
  respondFollowRequest(userId: string, requesterId: string, accept: boolean): Promise<void>;
  setProfilePrivacy(userId: string, isPrivate: boolean): Promise<void>;
  updateOwnProfile(userId: string, patch: { display_name?: string; bio?: string | null; avatar_url?: string | null }): Promise<void>;
  discoverPeople(viewerId: string): Promise<Profile[]>; // people the viewer can follow
  searchPeople(viewerId: string): Promise<Profile[]>; // everyone (except self), for name search
  friendsFeed(viewerId: string): Promise<FeedItem[]>; // activity from accepted follows
  discoverFeed(viewerId: string): Promise<FeedItem[]>; // activity from every public profile
  userActivity(userId: string, viewerId: string | null): Promise<FeedItem[]>;

  // reactions on posts (Letterboxd-style) — a post is (postUserId, exhibitionId)
  getPost(postUserId: string, exhibitionId: string, viewerId: string | null): Promise<FeedItem | null>;
  likePost(likerId: string, postUserId: string, exhibitionId: string): Promise<void>;
  unlikePost(likerId: string, postUserId: string, exhibitionId: string): Promise<void>;
  listComments(postUserId: string, exhibitionId: string): Promise<Comment[]>;
  addComment(authorId: string, postUserId: string, exhibitionId: string, text: string): Promise<Comment>;

  // direct messages — only between mutual follows (both accepted). The UI
  // hides the composer otherwise and sendMessage double-checks server-side.
  canMessage(viewerId: string, targetId: string): Promise<boolean>;
  listConversations(userId: string): Promise<Conversation[]>;
  listMessages(userId: string, peerId: string): Promise<DirectMessage[]>; // also marks the peer's messages as read
  sendMessage(senderId: string, recipientId: string, text: string): Promise<DirectMessage>;
  unreadMessageCount(userId: string): Promise<number>;
  listMessageablePeople(userId: string): Promise<Profile[]>; // mutual follows, for starting a thread

  // feedback — anyone (signed in or not) can write to the owner; only the
  // owner reads the inbox and marks items handled. Also used for reports
  // (kind: 'profile' | 'post') — same inbox, no separate moderation queue.
  submitFeedback(draft: FeedbackDraft, userId: string | null): Promise<void>;
  listFeedback(): Promise<Feedback[]>; // admin
  setFeedbackStatus(id: string, status: Feedback['status']): Promise<void>; // admin

  // blocking — hides the other person from feeds, search and messaging in
  // both directions for as long as the block exists.
  blockUser(blockerId: string, blockedId: string): Promise<void>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  listBlocked(userId: string): Promise<Profile[]>;

  // account deletion (App Store 5.1.1(v)): removes the account and every row
  // that references it. Irreversible; the caller signs out right after.
  deleteOwnAccount(userId: string): Promise<void>;

  // push notifications
  registerPushToken(userId: string, token: string): Promise<void>;
  unregisterPushToken(userId: string, token: string): Promise<void>;

  // media
  uploadImage(localUri: string): Promise<string>;
}
