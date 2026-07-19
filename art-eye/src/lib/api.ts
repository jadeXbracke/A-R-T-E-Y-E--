import type {
  Exhibition,
  ExhibitionInput,
  Profile,
  ProfileType,
  RejectionReason,
  Role,
  Visit,
} from '../types';

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  profile_type: ProfileType;
  role: Extract<Role, 'user' | 'venue_owner'>;
  /** Only for venue_owner sign-ups: name of the venue they represent. */
  venue_name?: string;
}

/**
 * The single data seam of the app. Backed by Supabase when
 * EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are set,
 * otherwise by a bundled local demo store so the app runs without a backend.
 */
export interface DataClient {
  readonly kind: 'supabase' | 'local';

  // ---- auth ----
  restoreSession(): Promise<Profile | null>;
  signUp(input: SignUpInput): Promise<Profile>;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;

  // ---- agenda ----
  listApprovedExhibitions(): Promise<Exhibition[]>;
  getExhibition(id: string): Promise<Exhibition | null>;

  // ---- curation ----
  getWatchlist(userId: string): Promise<string[]>;
  setWatchlisted(userId: string, exhibitionId: string, on: boolean): Promise<void>;
  getVisits(userId: string): Promise<Visit[]>;
  saveVisit(
    userId: string,
    exhibitionId: string,
    rating: number,
    reflection: string,
  ): Promise<void>;

  // ---- submissions ----
  /** Creates a pending exhibition (and the venue if it is new). Anonymous when submittedBy is null. */
  submitExhibition(input: ExhibitionInput, submittedBy: string | null): Promise<Exhibition>;
  listMySubmissions(userId: string): Promise<Exhibition[]>;
  updateSubmission(id: string, input: ExhibitionInput): Promise<void>;

  // ---- admin ----
  listPendingExhibitions(): Promise<Exhibition[]>;
  /** Applies field edits (if any) and publishes. */
  approveExhibition(id: string, edits: Partial<ExhibitionInput>): Promise<void>;
  rejectExhibition(id: string, reason: RejectionReason): Promise<void>;
}
