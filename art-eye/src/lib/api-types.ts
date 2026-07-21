import { CuratedList, Exhibition, ExhibitionDraft, Profile, ProfileType, RejectionReason, Role, Venue, VenueDraft, VenueProposal, VenueType, Visit } from './types';

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

  // media
  uploadImage(localUri: string): Promise<string>;
}
