import { Exhibition, ExhibitionDraft, Profile, ProfileType, RejectionReason, Role, Venue, Visit } from './types';

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  profile_type: ProfileType;
  role: Exclude<Role, 'admin'>;
  venue?: { name: string; type: 'museum' | 'gallery'; address: string };
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

  // media
  uploadImage(localUri: string): Promise<string>;
}
