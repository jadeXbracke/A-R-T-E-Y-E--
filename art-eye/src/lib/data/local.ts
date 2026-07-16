import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_EXHIBITIONS, SEED_VENUES } from '../seed';
import { todayStr } from '../dates';
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
import { DataAdapter } from './adapter';

/**
 * Local demo adapter — full app behaviour persisted in AsyncStorage, no backend
 * required. Used automatically when Supabase env vars are not configured, so the
 * app can be demoed straight from a fresh checkout.
 */

const K = {
  users: 'arteye.users',
  session: 'arteye.session',
  venues: 'arteye.venues',
  exhibitions: 'arteye.exhibitions',
  watchlist: 'arteye.watchlist',
  visits: 'arteye.visits',
};

interface StoredUser extends Profile {
  password: string;
}

async function read<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

async function write(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function strip(u: StoredUser): Profile {
  const { password: _pw, ...profile } = u;
  return profile;
}

/** The reviewer/demo account is always an admin. */
const ADMIN_EMAILS = ['jadebrack@gmail.com'];

export class LocalAdapter implements DataAdapter {
  readonly remote = false;

  private async venues(): Promise<Venue[]> {
    return read<Venue[]>(K.venues, SEED_VENUES);
  }

  private async exhibitions(): Promise<Exhibition[]> {
    return read<Exhibition[]>(K.exhibitions, SEED_EXHIBITIONS);
  }

  private async saveExhibitions(rows: Exhibition[]): Promise<void> {
    await write(K.exhibitions, rows);
  }

  private async withVenue(rows: Exhibition[]): Promise<Exhibition[]> {
    const venues = await this.venues();
    const byId = new Map(venues.map((v) => [v.id, v]));
    return rows.map((e) => ({ ...e, venue: byId.get(e.venue_id) }));
  }

  // ---- auth ----

  async restoreSession(): Promise<Profile | null> {
    const sessionId = await read<string | null>(K.session, null);
    if (!sessionId) return null;
    const users = await read<StoredUser[]>(K.users, []);
    const u = users.find((x) => x.id === sessionId);
    return u ? strip(u) : null;
  }

  async signUp(
    email: string,
    password: string,
    displayName: string,
    role: Role,
    profileType: ProfileType
  ): Promise<Profile> {
    const normalized = email.trim().toLowerCase();
    const users = await read<StoredUser[]>(K.users, []);
    if (users.some((u) => u.email === normalized)) {
      throw new Error('An account with this email already exists. Sign in instead.');
    }
    const user: StoredUser = {
      id: uid(),
      email: normalized,
      password,
      role: ADMIN_EMAILS.includes(normalized) ? 'admin' : role,
      profile_type: profileType,
      display_name: displayName.trim(),
      city: 'Sydney',
    };
    users.push(user);
    await write(K.users, users);
    await write(K.session, user.id);
    return strip(user);
  }

  async signIn(email: string, password: string): Promise<Profile> {
    const normalized = email.trim().toLowerCase();
    const users = await read<StoredUser[]>(K.users, []);
    const u = users.find((x) => x.email === normalized);
    if (!u || u.password !== password) throw new Error('Email or password is incorrect.');
    await write(K.session, u.id);
    return strip(u);
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(K.session);
  }

  // ---- catalogue ----

  async listVenues(): Promise<Venue[]> {
    return this.venues();
  }

  async listExhibitions(): Promise<Exhibition[]> {
    const rows = (await this.exhibitions()).filter((e) => e.status === 'approved');
    return this.withVenue(rows);
  }

  async getExhibition(id: string): Promise<Exhibition | null> {
    const rows = await this.withVenue(await this.exhibitions());
    return rows.find((e) => e.id === id) ?? null;
  }

  // ---- want to see ----

  async watchlistIds(userId: string): Promise<string[]> {
    const all = await read<Record<string, string[]>>(K.watchlist, {});
    return all[userId] ?? [];
  }

  async listWatchlist(userId: string): Promise<Exhibition[]> {
    const ids = await this.watchlistIds(userId);
    const rows = await this.withVenue(await this.exhibitions());
    const byId = new Map(rows.map((e) => [e.id, e]));
    return ids.map((id) => byId.get(id)).filter((e): e is Exhibition => !!e);
  }

  async addWatch(userId: string, exhibitionId: string): Promise<void> {
    const all = await read<Record<string, string[]>>(K.watchlist, {});
    const ids = all[userId] ?? [];
    if (!ids.includes(exhibitionId)) all[userId] = [exhibitionId, ...ids];
    await write(K.watchlist, all);
  }

  async removeWatch(userId: string, exhibitionId: string): Promise<void> {
    const all = await read<Record<string, string[]>>(K.watchlist, {});
    all[userId] = (all[userId] ?? []).filter((id) => id !== exhibitionId);
    await write(K.watchlist, all);
  }

  // ---- seen / visits ----

  async listVisits(userId: string): Promise<Visit[]> {
    const all = await read<Visit[]>(K.visits, []);
    const rows = await this.withVenue(await this.exhibitions());
    const byId = new Map(rows.map((e) => [e.id, e]));
    return all
      .filter((v) => v.user_id === userId)
      .map((v) => ({ ...v, exhibition: byId.get(v.exhibition_id) }))
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1));
  }

  async getVisit(userId: string, exhibitionId: string): Promise<Visit | null> {
    const all = await read<Visit[]>(K.visits, []);
    return all.find((v) => v.user_id === userId && v.exhibition_id === exhibitionId) ?? null;
  }

  async logVisit(userId: string, exhibitionId: string, rating: number, reflection: string): Promise<void> {
    const all = await read<Visit[]>(K.visits, []);
    const existing = all.find((v) => v.user_id === userId && v.exhibition_id === exhibitionId);
    if (existing) {
      existing.rating = rating;
      existing.reflection = reflection;
      existing.visit_date = todayStr();
    } else {
      all.push({
        id: uid(),
        user_id: userId,
        exhibition_id: exhibitionId,
        rating,
        reflection,
        visit_date: todayStr(),
      });
    }
    await write(K.visits, all);
    // Seeing an exhibition retires it from "want to see".
    await this.removeWatch(userId, exhibitionId);
  }

  // ---- submissions ----

  async submitExhibition(input: SubmissionInput, submittedBy: string | null): Promise<Exhibition> {
    let venueId = input.venue_id;
    if (!venueId) {
      const venues = await this.venues();
      const venue: Venue = {
        id: uid(),
        name: (input.new_venue_name ?? 'Unknown venue').trim(),
        type: input.new_venue_type ?? 'gallery',
        address: (input.new_venue_address ?? '').trim(),
        city: 'Sydney',
        owner_user_id: submittedBy,
      };
      venues.push(venue);
      await write(K.venues, venues);
      venueId = venue.id;
    }
    const rows = await this.exhibitions();
    const exhibition: Exhibition = {
      id: uid(),
      venue_id: venueId,
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
    rows.push(exhibition);
    await this.saveExhibitions(rows);
    return exhibition;
  }

  async listMySubmissions(userId: string): Promise<Exhibition[]> {
    const rows = await this.withVenue(await this.exhibitions());
    return rows.filter((e) => e.submitted_by === userId || e.venue?.owner_user_id === userId);
  }

  async updateSubmission(id: string, patch: ExhibitionPatch): Promise<void> {
    const rows = await this.exhibitions();
    const i = rows.findIndex((e) => e.id === id);
    if (i === -1) throw new Error('Submission not found.');
    // Edits by the venue go back through review.
    rows[i] = { ...rows[i], ...patch, status: 'pending', rejection_reason: null };
    await this.saveExhibitions(rows);
  }

  async uploadImage(localUri: string): Promise<string> {
    return localUri; // demo mode keeps the device-local uri
  }

  // ---- admin ----

  async listPending(): Promise<Exhibition[]> {
    const rows = await this.withVenue(await this.exhibitions());
    return rows.filter((e) => e.status === 'pending');
  }

  async approveExhibition(id: string, patch?: ExhibitionPatch): Promise<void> {
    const rows = await this.exhibitions();
    const i = rows.findIndex((e) => e.id === id);
    if (i === -1) throw new Error('Exhibition not found.');
    rows[i] = { ...rows[i], ...(patch ?? {}), status: 'approved', rejection_reason: null };
    await this.saveExhibitions(rows);
  }

  async rejectExhibition(id: string, reason: RejectionReason): Promise<void> {
    const rows = await this.exhibitions();
    const i = rows.findIndex((e) => e.id === id);
    if (i === -1) throw new Error('Exhibition not found.');
    rows[i] = { ...rows[i], status: 'rejected', rejection_reason: reason };
    await this.saveExhibitions(rows);
  }
}
