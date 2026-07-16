import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Backend } from '../backend';
import type {
  Exhibition,
  Profile,
  RejectionReason,
  SignUpInput,
  SubmissionInput,
  Venue,
  Visit,
} from '../types';
import { SEED_EXHIBITIONS, SEED_VENUES } from './seed';

const KEY = 'arteye.demo.v1';
const ADMIN_EMAIL = 'jadebrack@gmail.com';

interface DemoAccount extends Profile {
  email: string;
  password: string;
}

interface DemoState {
  accounts: DemoAccount[];
  sessionUserId: string | null;
  venues: Venue[];
  exhibitions: Exhibition[];
  watchlist: { user_id: string; exhibition_id: string; created_at: string }[];
  visits: Visit[];
  nextId: number;
}

function freshState(): DemoState {
  return {
    accounts: [],
    sessionUserId: null,
    venues: [...SEED_VENUES],
    exhibitions: SEED_EXHIBITIONS.map((e) => ({ ...e })),
    watchlist: [],
    visits: [],
    nextId: 1,
  };
}

export class DemoBackend implements Backend {
  readonly isDemo = true;
  private state: DemoState | null = null;

  private async load(): Promise<DemoState> {
    if (this.state) return this.state;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      this.state = raw ? (JSON.parse(raw) as DemoState) : freshState();
    } catch {
      this.state = freshState();
    }
    return this.state;
  }

  private async save() {
    if (this.state) {
      await AsyncStorage.setItem(KEY, JSON.stringify(this.state));
    }
  }

  private newId(s: DemoState, prefix: string) {
    return `${prefix}-demo-${s.nextId++}`;
  }

  private toProfile(a: DemoAccount): Profile {
    const { email: _e, password: _p, ...profile } = a;
    return profile;
  }

  private withVenue(s: DemoState, e: Exhibition): Exhibition {
    return { ...e, venue: s.venues.find((v) => v.id === e.venue_id) };
  }

  async signUp(input: SignUpInput): Promise<Profile> {
    const s = await this.load();
    const email = input.email.trim().toLowerCase();
    if (s.accounts.some((a) => a.email === email)) {
      throw new Error('An account with this email already exists.');
    }
    const account: DemoAccount = {
      id: this.newId(s, 'user'),
      email,
      password: input.password,
      role: email === ADMIN_EMAIL ? 'admin' : input.role,
      profile_type: input.profile_type,
      display_name: input.display_name.trim(),
      city: 'Sydney',
    };
    s.accounts.push(account);
    s.sessionUserId = account.id;
    await this.save();
    return this.toProfile(account);
  }

  async signIn(email: string, password: string): Promise<Profile> {
    const s = await this.load();
    const account = s.accounts.find(
      (a) => a.email === email.trim().toLowerCase(),
    );
    if (!account || account.password !== password) {
      throw new Error('Email or password is incorrect.');
    }
    s.sessionUserId = account.id;
    await this.save();
    return this.toProfile(account);
  }

  async signOut(): Promise<void> {
    const s = await this.load();
    s.sessionUserId = null;
    await this.save();
  }

  async restoreSession(): Promise<Profile | null> {
    const s = await this.load();
    const account = s.accounts.find((a) => a.id === s.sessionUserId);
    return account ? this.toProfile(account) : null;
  }

  async listVenues(): Promise<Venue[]> {
    const s = await this.load();
    return [...s.venues];
  }

  async listApproved(): Promise<Exhibition[]> {
    const s = await this.load();
    return s.exhibitions
      .filter((e) => e.status === 'approved')
      .map((e) => this.withVenue(s, e));
  }

  async getExhibition(id: string): Promise<Exhibition | null> {
    const s = await this.load();
    const e = s.exhibitions.find((x) => x.id === id);
    return e ? this.withVenue(s, e) : null;
  }

  async getWatchlist(userId: string): Promise<string[]> {
    const s = await this.load();
    return s.watchlist
      .filter((w) => w.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((w) => w.exhibition_id);
  }

  async addToWatchlist(userId: string, exhibitionId: string): Promise<void> {
    const s = await this.load();
    if (
      !s.watchlist.some(
        (w) => w.user_id === userId && w.exhibition_id === exhibitionId,
      )
    ) {
      s.watchlist.push({
        user_id: userId,
        exhibition_id: exhibitionId,
        created_at: new Date().toISOString(),
      });
      await this.save();
    }
  }

  async removeFromWatchlist(
    userId: string,
    exhibitionId: string,
  ): Promise<void> {
    const s = await this.load();
    s.watchlist = s.watchlist.filter(
      (w) => !(w.user_id === userId && w.exhibition_id === exhibitionId),
    );
    await this.save();
  }

  async listVisits(userId: string): Promise<Visit[]> {
    const s = await this.load();
    return s.visits
      .filter((v) => v.user_id === userId)
      .sort((a, b) => b.visit_date.localeCompare(a.visit_date));
  }

  async saveVisit(visit: Visit): Promise<void> {
    const s = await this.load();
    s.visits = s.visits.filter(
      (v) =>
        !(
          v.user_id === visit.user_id &&
          v.exhibition_id === visit.exhibition_id
        ),
    );
    s.visits.push(visit);
    // seeing an exhibition curates it off the want-to-see list
    s.watchlist = s.watchlist.filter(
      (w) =>
        !(
          w.user_id === visit.user_id &&
          w.exhibition_id === visit.exhibition_id
        ),
    );
    await this.save();
  }

  private findOrCreateVenue(s: DemoState, input: SubmissionInput): Venue {
    const existing = s.venues.find(
      (v) => v.name.trim().toLowerCase() === input.venue_name.trim().toLowerCase(),
    );
    if (existing) return existing;
    const venue: Venue = {
      id: this.newId(s, 'venue'),
      name: input.venue_name.trim(),
      type: input.venue_type,
      address: input.venue_address?.trim() || null,
      city: 'Sydney',
    };
    s.venues.push(venue);
    return venue;
  }

  async submitExhibition(
    input: SubmissionInput,
    submittedBy: string | null,
  ): Promise<Exhibition> {
    const s = await this.load();
    const venue = this.findOrCreateVenue(s, input);
    const exhibition: Exhibition = {
      id: this.newId(s, 'exh'),
      venue_id: venue.id,
      title: input.title.trim(),
      artists: input.artists.trim(),
      start_date: input.start_date,
      end_date: input.end_date,
      opening_datetime: input.opening_datetime ?? null,
      description: input.description?.trim() || null,
      image_url: input.image_url ?? null,
      status: 'pending',
      rejection_reason: null,
      is_featured: false,
      city: 'Sydney',
      submitted_by: submittedBy,
      submitter_email: input.submitter_email ?? null,
    };
    s.exhibitions.push(exhibition);
    await this.save();
    return this.withVenue(s, exhibition);
  }

  async listMySubmissions(userId: string): Promise<Exhibition[]> {
    const s = await this.load();
    return s.exhibitions
      .filter((e) => e.submitted_by === userId)
      .map((e) => this.withVenue(s, e));
  }

  async updateSubmission(
    id: string,
    patch: Partial<Exhibition>,
  ): Promise<void> {
    const s = await this.load();
    const i = s.exhibitions.findIndex((e) => e.id === id);
    if (i >= 0) {
      s.exhibitions[i] = { ...s.exhibitions[i], ...patch, venue: undefined };
      await this.save();
    }
  }

  async listPending(): Promise<Exhibition[]> {
    const s = await this.load();
    return s.exhibitions
      .filter((e) => e.status === 'pending')
      .map((e) => this.withVenue(s, e));
  }

  async approveExhibition(
    id: string,
    patch?: Partial<Exhibition>,
  ): Promise<void> {
    await this.updateSubmission(id, {
      ...patch,
      status: 'approved',
      rejection_reason: null,
    });
  }

  async rejectExhibition(id: string, reason: RejectionReason): Promise<void> {
    await this.updateSubmission(id, {
      status: 'rejected',
      rejection_reason: reason,
    });
  }

  async uploadImage(localUri: string): Promise<string> {
    // Demo mode keeps the local file URI; the real backend uploads to storage.
    return localUri;
  }
}
