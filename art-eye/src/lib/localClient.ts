import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_EMAIL, SEED_EXHIBITIONS, SEED_VENUES } from '../data/seed';
import type {
  Exhibition,
  ExhibitionInput,
  Profile,
  RejectionReason,
  Venue,
  Visit,
} from '../types';
import type { DataClient, SignUpInput } from './api';

interface LocalDb {
  venues: Venue[];
  exhibitions: Exhibition[];
  profiles: Profile[];
  credentials: Record<string, string>; // email -> password (demo store only)
  watchlist: { user_id: string; exhibition_id: string; created_at: string }[];
  visits: Visit[];
  sessionUserId: string | null;
}

const DB_KEY = 'arteye/local-db/v1';

function freshDb(): LocalDb {
  return {
    venues: [...SEED_VENUES],
    exhibitions: [...SEED_EXHIBITIONS],
    profiles: [],
    credentials: {},
    watchlist: [],
    visits: [],
    sessionUserId: null,
  };
}

let uidCounter = 0;
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter}`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Demo backend: the full app behaviour persisted in AsyncStorage, seeded with
 * the July 2026 Sydney agenda. Mirrors the Supabase schema one-for-one so the
 * UI cannot tell the difference.
 */
export class LocalClient implements DataClient {
  readonly kind = 'local' as const;
  private db: LocalDb | null = null;

  private async load(): Promise<LocalDb> {
    if (this.db) return this.db;
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (raw) {
      try {
        this.db = JSON.parse(raw) as LocalDb;
      } catch {
        this.db = freshDb();
      }
    } else {
      this.db = freshDb();
    }
    return this.db;
  }

  private async save(): Promise<void> {
    if (this.db) await AsyncStorage.setItem(DB_KEY, JSON.stringify(this.db));
  }

  private withVenue(db: LocalDb, e: Exhibition): Exhibition {
    return { ...e, venue: db.venues.find((v) => v.id === e.venue_id) };
  }

  // ---- auth ----

  async restoreSession(): Promise<Profile | null> {
    const db = await this.load();
    if (!db.sessionUserId) return null;
    return db.profiles.find((p) => p.id === db.sessionUserId) ?? null;
  }

  async signUp(input: SignUpInput): Promise<Profile> {
    const db = await this.load();
    const email = input.email.trim().toLowerCase();
    if (db.profiles.some((p) => p.email === email)) {
      throw new Error('An account already exists for that email. Sign in instead.');
    }
    if (input.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const profile: Profile = {
      id: uid('u'),
      email,
      role: email === ADMIN_EMAIL ? 'admin' : input.role,
      profile_type: input.profile_type,
      display_name: input.display_name.trim() || 'Curator',
      city: 'Sydney',
    };
    db.profiles.push(profile);
    db.credentials[email] = input.password;
    if (input.role === 'venue_owner' && input.venue_name?.trim()) {
      const name = input.venue_name.trim();
      const existing = db.venues.find(
        (v) => v.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing && !existing.owner_user_id) {
        existing.owner_user_id = profile.id;
      } else if (!existing) {
        db.venues.push({
          id: uid(`v-${slugify(name)}`),
          name,
          type: 'gallery',
          address: '',
          city: 'Sydney',
          owner_user_id: profile.id,
        });
      }
    }
    db.sessionUserId = profile.id;
    await this.save();
    return profile;
  }

  async signIn(email: string, password: string): Promise<Profile> {
    const db = await this.load();
    const key = email.trim().toLowerCase();
    const profile = db.profiles.find((p) => p.email === key);
    if (!profile || db.credentials[key] !== password) {
      throw new Error('That email and password don’t match our records.');
    }
    db.sessionUserId = profile.id;
    await this.save();
    return profile;
  }

  async signOut(): Promise<void> {
    const db = await this.load();
    db.sessionUserId = null;
    await this.save();
  }

  // ---- agenda ----

  async listApprovedExhibitions(): Promise<Exhibition[]> {
    const db = await this.load();
    return db.exhibitions
      .filter((e) => e.status === 'approved')
      .map((e) => this.withVenue(db, e))
      .sort((a, b) => a.end_date.localeCompare(b.end_date));
  }

  async getExhibition(id: string): Promise<Exhibition | null> {
    const db = await this.load();
    const e = db.exhibitions.find((x) => x.id === id);
    return e ? this.withVenue(db, e) : null;
  }

  // ---- curation ----

  async getWatchlist(userId: string): Promise<string[]> {
    const db = await this.load();
    return db.watchlist
      .filter((w) => w.user_id === userId)
      .map((w) => w.exhibition_id);
  }

  async setWatchlisted(userId: string, exhibitionId: string, on: boolean): Promise<void> {
    const db = await this.load();
    db.watchlist = db.watchlist.filter(
      (w) => !(w.user_id === userId && w.exhibition_id === exhibitionId),
    );
    if (on) {
      db.watchlist.push({
        user_id: userId,
        exhibition_id: exhibitionId,
        created_at: new Date().toISOString(),
      });
    }
    await this.save();
  }

  async getVisits(userId: string): Promise<Visit[]> {
    const db = await this.load();
    return db.visits
      .filter((v) => v.user_id === userId)
      .sort((a, b) => b.visit_date.localeCompare(a.visit_date));
  }

  async saveVisit(
    userId: string,
    exhibitionId: string,
    rating: number,
    reflection: string,
  ): Promise<void> {
    const db = await this.load();
    db.visits = db.visits.filter(
      (v) => !(v.user_id === userId && v.exhibition_id === exhibitionId),
    );
    db.visits.push({
      user_id: userId,
      exhibition_id: exhibitionId,
      rating,
      reflection: reflection.trim(),
      visit_date: new Date().toISOString().slice(0, 10),
    });
    // seeing an exhibition removes it from "want to see"
    db.watchlist = db.watchlist.filter(
      (w) => !(w.user_id === userId && w.exhibition_id === exhibitionId),
    );
    await this.save();
  }

  // ---- submissions ----

  private resolveVenue(db: LocalDb, input: ExhibitionInput, ownerId: string | null): Venue {
    const name = input.venue_name.trim();
    const existing = db.venues.find(
      (v) => v.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing;
    const venue: Venue = {
      id: uid(`v-${slugify(name)}`),
      name,
      type: input.venue_type,
      address: input.venue_address.trim(),
      city: 'Sydney',
      owner_user_id: ownerId,
    };
    db.venues.push(venue);
    return venue;
  }

  async submitExhibition(
    input: ExhibitionInput,
    submittedBy: string | null,
  ): Promise<Exhibition> {
    const db = await this.load();
    const submitter = submittedBy
      ? db.profiles.find((p) => p.id === submittedBy)
      : null;
    const venue = this.resolveVenue(
      db,
      input,
      submitter?.role === 'venue_owner' ? submitter.id : null,
    );
    const exhibition: Exhibition = {
      id: uid('e'),
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
    };
    db.exhibitions.push(exhibition);
    await this.save();
    return this.withVenue(db, exhibition);
  }

  async listMySubmissions(userId: string): Promise<Exhibition[]> {
    const db = await this.load();
    const myVenueIds = db.venues
      .filter((v) => v.owner_user_id === userId)
      .map((v) => v.id);
    return db.exhibitions
      .filter(
        (e) => e.submitted_by === userId || myVenueIds.includes(e.venue_id),
      )
      .map((e) => this.withVenue(db, e))
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
  }

  private applyEdits(e: Exhibition, db: LocalDb, input: Partial<ExhibitionInput>): void {
    if (input.title !== undefined) e.title = input.title.trim();
    if (input.artists !== undefined) e.artists = input.artists.trim();
    if (input.start_date !== undefined) e.start_date = input.start_date;
    if (input.end_date !== undefined) e.end_date = input.end_date;
    if (input.opening_datetime !== undefined) e.opening_datetime = input.opening_datetime;
    if (input.description !== undefined) e.description = input.description.trim();
    if (input.image_url !== undefined) e.image_url = input.image_url;
    if (input.venue_name?.trim()) {
      const venue = this.resolveVenue(db, input as ExhibitionInput, null);
      e.venue_id = venue.id;
    }
  }

  async updateSubmission(id: string, input: ExhibitionInput): Promise<void> {
    const db = await this.load();
    const e = db.exhibitions.find((x) => x.id === id);
    if (!e) throw new Error('Submission not found.');
    this.applyEdits(e, db, input);
    // an edited rejection goes back into the queue
    if (e.status === 'rejected') {
      e.status = 'pending';
      e.rejection_reason = null;
    }
    await this.save();
  }

  // ---- admin ----

  async listPendingExhibitions(): Promise<Exhibition[]> {
    const db = await this.load();
    return db.exhibitions
      .filter((e) => e.status === 'pending')
      .map((e) => this.withVenue(db, e))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }

  async approveExhibition(id: string, edits: Partial<ExhibitionInput>): Promise<void> {
    const db = await this.load();
    const e = db.exhibitions.find((x) => x.id === id);
    if (!e) throw new Error('Exhibition not found.');
    this.applyEdits(e, db, edits);
    e.status = 'approved';
    e.rejection_reason = null;
    await this.save();
  }

  async rejectExhibition(id: string, reason: RejectionReason): Promise<void> {
    const db = await this.load();
    const e = db.exhibitions.find((x) => x.id === id);
    if (!e) throw new Error('Exhibition not found.');
    e.status = 'rejected';
    e.rejection_reason = reason;
    await this.save();
  }
}
