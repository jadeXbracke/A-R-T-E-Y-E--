import {
  Exhibition,
  ExhibitionPatch,
  Profile,
  ProfileType,
  RejectionReason,
  Role,
  SubmissionInput,
  Venue,
  Visit,
} from '../types';

export interface DataAdapter {
  /** True when backed by Supabase; false in local demo mode. */
  readonly remote: boolean;

  // auth
  restoreSession(): Promise<Profile | null>;
  signUp(
    email: string,
    password: string,
    displayName: string,
    role: Role,
    profileType: ProfileType
  ): Promise<Profile>;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;

  // catalogue
  listVenues(): Promise<Venue[]>;
  listExhibitions(): Promise<Exhibition[]>; // approved, with venue joined
  getExhibition(id: string): Promise<Exhibition | null>;

  // want to see
  watchlistIds(userId: string): Promise<string[]>;
  listWatchlist(userId: string): Promise<Exhibition[]>;
  addWatch(userId: string, exhibitionId: string): Promise<void>;
  removeWatch(userId: string, exhibitionId: string): Promise<void>;

  // seen / visits
  listVisits(userId: string): Promise<Visit[]>;
  getVisit(userId: string, exhibitionId: string): Promise<Visit | null>;
  logVisit(userId: string, exhibitionId: string, rating: number, reflection: string): Promise<void>;

  // submissions
  submitExhibition(input: SubmissionInput, submittedBy: string | null): Promise<Exhibition>;
  listMySubmissions(userId: string): Promise<Exhibition[]>;
  updateSubmission(id: string, patch: ExhibitionPatch): Promise<void>;
  uploadImage(localUri: string): Promise<string>;

  // admin
  listPending(): Promise<Exhibition[]>;
  approveExhibition(id: string, patch?: ExhibitionPatch): Promise<void>;
  rejectExhibition(id: string, reason: RejectionReason): Promise<void>;
}
