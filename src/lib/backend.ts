import {
  Exhibition,
  ExhibitionInput,
  ProfileType,
  RejectionReason,
  Role,
  UserProfile,
  Venue,
  Visit,
} from './types';

/**
 * The app talks to a Backend, never to Supabase directly.
 * - SupabaseBackend is used when EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are set.
 * - DemoBackend (seeded, persisted to AsyncStorage) is used otherwise, so the
 *   app runs and demos without any provisioning.
 */
export interface Backend {
  readonly kind: 'supabase' | 'demo';

  restoreSession(): Promise<UserProfile | null>;
  signUp(args: {
    email: string;
    password: string;
    displayName: string;
    role: Role;
    profileType: ProfileType;
  }): Promise<UserProfile>;
  signIn(email: string, password: string): Promise<UserProfile>;
  signOut(): Promise<void>;

  /** Approved, Sydney, current-or-upcoming exhibitions plus their venues. */
  listAgenda(): Promise<{ exhibitions: Exhibition[]; venues: Venue[] }>;

  getWatchlist(userId: string): Promise<string[]>;
  addToWatchlist(userId: string, exhibitionId: string): Promise<void>;
  removeFromWatchlist(userId: string, exhibitionId: string): Promise<void>;

  getVisits(userId: string): Promise<Visit[]>;
  markSeen(visit: Visit): Promise<void>;

  /** Creates a pending exhibition. submittedBy is null for the public form. */
  submitExhibition(input: ExhibitionInput, submittedBy: string | null): Promise<void>;
  listMySubmissions(userId: string): Promise<{ exhibitions: Exhibition[]; venues: Venue[] }>;
  updateSubmission(id: string, input: ExhibitionInput): Promise<void>;

  listPending(): Promise<{ exhibitions: Exhibition[]; venues: Venue[] }>;
  approve(id: string, edits: ExhibitionInput): Promise<void>;
  reject(id: string, reason: RejectionReason): Promise<void>;

  /** Returns a storable URL for a locally picked image. */
  uploadImage(localUri: string): Promise<string>;
}
