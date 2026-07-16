import type {
  Exhibition,
  Profile,
  RejectionReason,
  SignUpInput,
  SubmissionInput,
  Venue,
  Visit,
} from './types';

/**
 * Everything the UI needs from a backend. Two implementations:
 *  - supabase/backend.ts — the real thing (auth, Postgres, storage)
 *  - demo/backend.ts     — local seeded store so the app runs and demos
 *                          before EXPO_PUBLIC_SUPABASE_URL is configured.
 */
export interface Backend {
  readonly isDemo: boolean;

  // auth
  signUp(input: SignUpInput): Promise<Profile>;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;
  restoreSession(): Promise<Profile | null>;

  // catalog (public agenda — approved rows only)
  listVenues(): Promise<Venue[]>;
  listApproved(): Promise<Exhibition[]>;
  getExhibition(id: string): Promise<Exhibition | null>;

  // personal record
  getWatchlist(userId: string): Promise<string[]>;
  addToWatchlist(userId: string, exhibitionId: string): Promise<void>;
  removeFromWatchlist(userId: string, exhibitionId: string): Promise<void>;
  listVisits(userId: string): Promise<Visit[]>;
  saveVisit(visit: Visit): Promise<void>;

  // submissions (always land as status = 'pending')
  submitExhibition(
    input: SubmissionInput,
    submittedBy: string | null,
  ): Promise<Exhibition>;
  listMySubmissions(userId: string): Promise<Exhibition[]>;
  updateSubmission(id: string, patch: Partial<Exhibition>): Promise<void>;

  // admin
  listPending(): Promise<Exhibition[]>;
  approveExhibition(id: string, patch?: Partial<Exhibition>): Promise<void>;
  rejectExhibition(id: string, reason: RejectionReason): Promise<void>;

  // storage — returns a URL/URI the app can render
  uploadImage(localUri: string): Promise<string>;
}
