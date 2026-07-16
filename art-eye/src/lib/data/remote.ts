import { SupabaseClient } from '@supabase/supabase-js';
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

const EXHIBITION_SELECT = '*, venue:venues(*)';

/** Supabase-backed adapter. Enforcement lives in RLS (see supabase/migrations). */
export class RemoteAdapter implements DataAdapter {
  readonly remote = true;

  constructor(private db: SupabaseClient) {}

  private async profileFor(userId: string, email: string): Promise<Profile> {
    const { data, error } = await this.db.from('users').select('*').eq('id', userId).single();
    if (error) throw new Error(error.message);
    return { ...data, email } as Profile;
  }

  // ---- auth ----

  async restoreSession(): Promise<Profile | null> {
    const { data } = await this.db.auth.getSession();
    const session = data.session;
    if (!session) return null;
    return this.profileFor(session.user.id, session.user.email ?? '');
  }

  async signUp(
    email: string,
    password: string,
    displayName: string,
    role: Role,
    profileType: ProfileType
  ): Promise<Profile> {
    const { data, error } = await this.db.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          // 'admin' is never granted from the client; the seed script promotes admins.
          role: role === 'admin' ? 'user' : role,
          profile_type: profileType,
        },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Sign-up did not return a user. Check email confirmation settings.');
    return this.profileFor(data.user.id, email);
  }

  async signIn(email: string, password: string): Promise<Profile> {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return this.profileFor(data.user.id, email);
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut();
  }

  // ---- catalogue ----

  async listVenues(): Promise<Venue[]> {
    const { data, error } = await this.db.from('venues').select('*').order('name');
    if (error) throw new Error(error.message);
    return data as Venue[];
  }

  async listExhibitions(): Promise<Exhibition[]> {
    const { data, error } = await this.db
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('status', 'approved')
      .order('end_date');
    if (error) throw new Error(error.message);
    return data as Exhibition[];
  }

  async getExhibition(id: string): Promise<Exhibition | null> {
    const { data, error } = await this.db
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Exhibition) ?? null;
  }

  // ---- want to see ----

  async watchlistIds(userId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from('user_watchlist')
      .select('exhibition_id')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data.map((r) => r.exhibition_id as string);
  }

  async listWatchlist(userId: string): Promise<Exhibition[]> {
    const { data, error } = await this.db
      .from('user_watchlist')
      .select(`created_at, exhibition:exhibitions(${EXHIBITION_SELECT})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data
      .map((r) => r.exhibition as unknown as Exhibition)
      .filter((e): e is Exhibition => !!e);
  }

  async addWatch(userId: string, exhibitionId: string): Promise<void> {
    const { error } = await this.db
      .from('user_watchlist')
      .upsert({ user_id: userId, exhibition_id: exhibitionId });
    if (error) throw new Error(error.message);
  }

  async removeWatch(userId: string, exhibitionId: string): Promise<void> {
    const { error } = await this.db
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('exhibition_id', exhibitionId);
    if (error) throw new Error(error.message);
  }

  // ---- seen / visits ----

  async listVisits(userId: string): Promise<Visit[]> {
    const { data, error } = await this.db
      .from('user_visits')
      .select(`*, exhibition:exhibitions(${EXHIBITION_SELECT})`)
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data as unknown as Visit[];
  }

  async getVisit(userId: string, exhibitionId: string): Promise<Visit | null> {
    const { data, error } = await this.db
      .from('user_visits')
      .select('*')
      .eq('user_id', userId)
      .eq('exhibition_id', exhibitionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Visit) ?? null;
  }

  async logVisit(userId: string, exhibitionId: string, rating: number, reflection: string): Promise<void> {
    const { error } = await this.db.from('user_visits').upsert(
      {
        user_id: userId,
        exhibition_id: exhibitionId,
        rating,
        reflection,
        visit_date: todayStr(),
      },
      { onConflict: 'user_id,exhibition_id' }
    );
    if (error) throw new Error(error.message);
    await this.removeWatch(userId, exhibitionId);
  }

  // ---- submissions ----

  async submitExhibition(input: SubmissionInput, submittedBy: string | null): Promise<Exhibition> {
    let venueId = input.venue_id;
    if (!venueId) {
      const { data, error } = await this.db
        .from('venues')
        .insert({
          name: (input.new_venue_name ?? 'Unknown venue').trim(),
          type: input.new_venue_type ?? 'gallery',
          address: (input.new_venue_address ?? '').trim(),
          city: 'Sydney',
          owner_user_id: submittedBy,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      venueId = data.id as string;
    }
    const { data, error } = await this.db
      .from('exhibitions')
      .insert({
        venue_id: venueId,
        title: input.title.trim(),
        artists: input.artists.trim(),
        start_date: input.start_date,
        end_date: input.end_date,
        opening_datetime: input.opening_datetime,
        description: input.description.trim(),
        image_url: input.image_url,
        status: 'pending',
        is_featured: false,
        city: 'Sydney',
        submitted_by: submittedBy,
      })
      .select(EXHIBITION_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return data as Exhibition;
  }

  async listMySubmissions(userId: string): Promise<Exhibition[]> {
    const [own, owned] = await Promise.all([
      this.db.from('exhibitions').select(EXHIBITION_SELECT).eq('submitted_by', userId),
      this.db
        .from('exhibitions')
        .select(`${EXHIBITION_SELECT}, owner_venue:venues!inner(owner_user_id)`)
        .eq('owner_venue.owner_user_id', userId),
    ]);
    if (own.error) throw new Error(own.error.message);
    if (owned.error) throw new Error(owned.error.message);
    const map = new Map<string, Exhibition>();
    for (const e of [...(own.data as Exhibition[]), ...(owned.data as unknown as Exhibition[])]) {
      map.set(e.id, e);
    }
    return [...map.values()];
  }

  async updateSubmission(id: string, patch: ExhibitionPatch): Promise<void> {
    const { error } = await this.db
      .from('exhibitions')
      .update({ ...patch, status: 'pending', rejection_reason: null })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async uploadImage(localUri: string): Promise<string> {
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();
    const { error } = await this.db.storage
      .from('exhibition-images')
      .upload(path, arrayBuffer, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg' });
    if (error) throw new Error(error.message);
    const { data } = this.db.storage.from('exhibition-images').getPublicUrl(path);
    return data.publicUrl;
  }

  // ---- admin ----

  async listPending(): Promise<Exhibition[]> {
    const { data, error } = await this.db
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('status', 'pending')
      .order('start_date');
    if (error) throw new Error(error.message);
    return data as Exhibition[];
  }

  async approveExhibition(id: string, patch?: ExhibitionPatch): Promise<void> {
    const { error } = await this.db
      .from('exhibitions')
      .update({ ...(patch ?? {}), status: 'approved', rejection_reason: null })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async rejectExhibition(id: string, reason: RejectionReason): Promise<void> {
    const { error } = await this.db
      .from('exhibitions')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}
