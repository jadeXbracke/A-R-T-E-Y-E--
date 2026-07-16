import { Backend } from './backend';
import { SEED_EXHIBITIONS, SEED_VENUES } from './seed';
import {
  Exhibition,
  ExhibitionInput,
  RejectionReason,
  UserProfile,
  Venue,
  Visit,
  WatchlistEntry,
} from './types';

const STORE_KEY = 'arteye-demo-v1';

/** Pre-seeded accounts sign in with any password — demo convenience only. */
const ADMIN_EMAIL = 'jadebrack@gmail.com';

interface DemoUser extends UserProfile {
  password: string | null;
}

interface DemoState {
  users: DemoUser[];
  venues: Venue[];
  exhibitions: Exhibition[];
  watchlist: WatchlistEntry[];
  visits: Visit[];
  sessionUserId: string | null;
}

function freshState(): DemoState {
  return {
    users: [
      {
        id: 'u-admin',
        role: 'admin',
        profile_type: 'enthusiast',
        display_name: 'Jade Bracke',
        city: 'Sydney',
        email: ADMIN_EMAIL,
        password: null,
      },
    ],
    venues: [...SEED_VENUES],
    exhibitions: [...SEED_EXHIBITIONS],
    watchlist: [],
    visits: [],
    sessionUserId: null,
  };
}

let uid = 0;
const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`;

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export class DemoBackend implements Backend {
  readonly kind = 'demo' as const;
  private state: DemoState | null = null;

  /** storage is injectable so the data layer can be tested off-device */
  constructor(private storage?: KeyValueStorage) {}

  private async kv(): Promise<KeyValueStorage> {
    if (!this.storage) {
      this.storage = (await import('@react-native-async-storage/async-storage')).default;
    }
    return this.storage;
  }

  private async load(): Promise<DemoState> {
    if (this.state) return this.state;
    try {
      const raw = await (await this.kv()).getItem(STORE_KEY);
      this.state = raw ? (JSON.parse(raw) as DemoState) : freshState();
    } catch {
      this.state = freshState();
    }
    return this.state;
  }

  private async save(): Promise<void> {
    if (!this.state) return;
    try {
      await (await this.kv()).setItem(STORE_KEY, JSON.stringify(this.state));
    } catch {
      // demo persistence is best-effort
    }
  }

  private strip(u: DemoUser): UserProfile {
    const { password: _pw, ...profile } = u;
    return profile;
  }

  async restoreSession(): Promise<UserProfile | null> {
    const s = await this.load();
    const u = s.users.find((x) => x.id === s.sessionUserId);
    return u ? this.strip(u) : null;
  }

  async signUp(args: {
    email: string;
    password: string;
    displayName: string;
    role: 'user' | 'venue_owner' | 'admin';
    profileType: UserProfile['profile_type'];
  }): Promise<UserProfile> {
    const s = await this.load();
    const email = args.email.trim().toLowerCase();
    if (s.users.some((u) => u.email === email)) {
      throw new Error('An account with this email already exists. Sign in instead.');
    }
    const user: DemoUser = {
      id: newId('u'),
      role: email === ADMIN_EMAIL ? 'admin' : args.role,
      profile_type: args.profileType,
      display_name: args.displayName.trim(),
      city: 'Sydney',
      email,
      password: args.password,
    };
    s.users.push(user);
    s.sessionUserId = user.id;
    await this.save();
    return this.strip(user);
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    const s = await this.load();
    const u = s.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u || (u.password !== null && u.password !== password)) {
      throw new Error('No account matches that email and password.');
    }
    s.sessionUserId = u.id;
    await this.save();
    return this.strip(u);
  }

  async signOut(): Promise<void> {
    const s = await this.load();
    s.sessionUserId = null;
    await this.save();
  }

  async listAgenda() {
    const s = await this.load();
    const exhibitions = s.exhibitions
      .filter((e) => e.status === 'approved' && e.city === 'Sydney')
      .sort((a, b) => a.end_date.localeCompare(b.end_date));
    return { exhibitions, venues: s.venues };
  }

  async getWatchlist(userId: string) {
    const s = await this.load();
    return s.watchlist.filter((w) => w.user_id === userId).map((w) => w.exhibition_id);
  }

  async addToWatchlist(userId: string, exhibitionId: string) {
    const s = await this.load();
    if (!s.watchlist.some((w) => w.user_id === userId && w.exhibition_id === exhibitionId)) {
      s.watchlist.push({ user_id: userId, exhibition_id: exhibitionId, created_at: new Date().toISOString() });
      await this.save();
    }
  }

  async removeFromWatchlist(userId: string, exhibitionId: string) {
    const s = await this.load();
    s.watchlist = s.watchlist.filter(
      (w) => !(w.user_id === userId && w.exhibition_id === exhibitionId)
    );
    await this.save();
  }

  async getVisits(userId: string) {
    const s = await this.load();
    return s.visits
      .filter((v) => v.user_id === userId)
      .sort((a, b) => b.visit_date.localeCompare(a.visit_date));
  }

  async markSeen(visit: Visit) {
    const s = await this.load();
    s.visits = s.visits.filter(
      (v) => !(v.user_id === visit.user_id && v.exhibition_id === visit.exhibition_id)
    );
    s.visits.push(visit);
    // seeing an exhibition retires it from "Want to see"
    s.watchlist = s.watchlist.filter(
      (w) => !(w.user_id === visit.user_id && w.exhibition_id === visit.exhibition_id)
    );
    await this.save();
  }

  private findOrCreateVenue(s: DemoState, input: ExhibitionInput, ownerId: string | null): Venue {
    const name = input.venue_name.trim();
    const existing = s.venues.find((v) => v.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const venue: Venue = {
      id: newId('v'),
      name,
      type: input.venue_type,
      address: '',
      city: 'Sydney',
      owner_user_id: ownerId,
    };
    s.venues.push(venue);
    return venue;
  }

  async submitExhibition(input: ExhibitionInput, submittedBy: string | null) {
    const s = await this.load();
    const venue = this.findOrCreateVenue(s, input, submittedBy);
    s.exhibitions.push({
      id: newId('e'),
      venue_id: venue.id,
      title: input.title.trim(),
      artists: input.artists.trim(),
      start_date: input.start_date,
      end_date: input.end_date,
      opening_datetime: input.opening_datetime,
      description: input.description.trim(),
      image_url: input.image_url,
      status: 'pending',
      rejection_reason: null,
      is_featured: false,
      city: 'Sydney',
      submitted_by: submittedBy,
      submitter_contact: input.submitter_contact ?? null,
    });
    await this.save();
  }

  async listMySubmissions(userId: string) {
    const s = await this.load();
    const exhibitions = s.exhibitions
      .filter((e) => e.submitted_by === userId)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    return { exhibitions, venues: s.venues };
  }

  private applyEdits(s: DemoState, e: Exhibition, input: ExhibitionInput, ownerId: string | null) {
    const venue = this.findOrCreateVenue(s, input, ownerId);
    e.venue_id = venue.id;
    e.title = input.title.trim();
    e.artists = input.artists.trim();
    e.start_date = input.start_date;
    e.end_date = input.end_date;
    e.opening_datetime = input.opening_datetime;
    e.description = input.description.trim();
    e.image_url = input.image_url;
  }

  async updateSubmission(id: string, input: ExhibitionInput) {
    const s = await this.load();
    const e = s.exhibitions.find((x) => x.id === id);
    if (!e) throw new Error('Submission not found.');
    this.applyEdits(s, e, input, e.submitted_by);
    // edits to a rejected submission resubmit it for review
    if (e.status === 'rejected') {
      e.status = 'pending';
      e.rejection_reason = null;
    }
    await this.save();
  }

  async listPending() {
    const s = await this.load();
    const exhibitions = s.exhibitions
      .filter((e) => e.status === 'pending')
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    return { exhibitions, venues: s.venues };
  }

  async approve(id: string, edits: ExhibitionInput) {
    const s = await this.load();
    const e = s.exhibitions.find((x) => x.id === id);
    if (!e) throw new Error('Exhibition not found.');
    this.applyEdits(s, e, edits, e.submitted_by);
    e.status = 'approved';
    e.rejection_reason = null;
    await this.save();
  }

  async reject(id: string, reason: RejectionReason) {
    const s = await this.load();
    const e = s.exhibitions.find((x) => x.id === id);
    if (!e) throw new Error('Exhibition not found.');
    e.status = 'rejected';
    e.rejection_reason = reason;
    await this.save();
  }

  async uploadImage(localUri: string) {
    return localUri; // demo mode keeps the local file URI
  }
}
