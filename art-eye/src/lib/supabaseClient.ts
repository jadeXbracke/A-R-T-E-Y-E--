import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient as Supabase } from '@supabase/supabase-js';
import type {
  Exhibition,
  ExhibitionInput,
  Profile,
  RejectionReason,
  Visit,
} from '../types';
import type { DataClient, SignUpInput } from './api';

const EXHIBITION_SELECT = '*, venue:venues(*)';

/**
 * Production backend. Schema, row-level security and seed data live in
 * supabase/migrations and supabase/seed.sql.
 */
export class SupabaseClient implements DataClient {
  readonly kind = 'supabase' as const;
  private client: Supabase;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  private async fetchProfile(userId: string, email: string): Promise<Profile> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return { ...data, email } as Profile;
  }

  // ---- auth ----

  async restoreSession(): Promise<Profile | null> {
    const { data } = await this.client.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    try {
      return await this.fetchProfile(user.id, user.email ?? '');
    } catch {
      return null;
    }
  }

  async signUp(input: SignUpInput): Promise<Profile> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: {
          display_name: input.display_name.trim(),
          profile_type: input.profile_type,
          requested_role: input.role,
        },
      },
    });
    if (error) throw new Error(error.message);
    const user = data.user;
    if (!user) throw new Error('Sign-up did not return a user. Check email confirmation settings.');
    // The handle_new_user trigger creates the users row (admin for the seeded
    // admin email); venue linkage happens here.
    if (input.role === 'venue_owner' && input.venue_name?.trim()) {
      await this.client.rpc('claim_or_create_venue', {
        p_venue_name: input.venue_name.trim(),
      });
    }
    return this.fetchProfile(user.id, user.email ?? '');
  }

  async signIn(email: string, password: string): Promise<Profile> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(error.message);
    return this.fetchProfile(data.user.id, data.user.email ?? '');
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  // ---- agenda ----

  async listApprovedExhibitions(): Promise<Exhibition[]> {
    const { data, error } = await this.client
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('status', 'approved')
      .order('end_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  }

  async getExhibition(id: string): Promise<Exhibition | null> {
    const { data, error } = await this.client
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Exhibition) ?? null;
  }

  // ---- curation ----

  async getWatchlist(userId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('user_watchlist')
      .select('exhibition_id')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.exhibition_id as string);
  }

  async setWatchlisted(userId: string, exhibitionId: string, on: boolean): Promise<void> {
    if (on) {
      const { error } = await this.client
        .from('user_watchlist')
        .upsert({ user_id: userId, exhibition_id: exhibitionId });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await this.client
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('exhibition_id', exhibitionId);
      if (error) throw new Error(error.message);
    }
  }

  async getVisits(userId: string): Promise<Visit[]> {
    const { data, error } = await this.client
      .from('user_visits')
      .select('*')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Visit[];
  }

  async saveVisit(
    userId: string,
    exhibitionId: string,
    rating: number,
    reflection: string,
  ): Promise<void> {
    const { error } = await this.client.from('user_visits').upsert({
      user_id: userId,
      exhibition_id: exhibitionId,
      rating,
      reflection: reflection.trim(),
      visit_date: new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    await this.setWatchlisted(userId, exhibitionId, false);
  }

  // ---- submissions ----

  private async uploadImageIfLocal(imageUrl: string | null): Promise<string | null> {
    if (!imageUrl || !imageUrl.startsWith('file:')) return imageUrl;
    const ext = imageUrl.includes('.png') ? 'png' : 'jpg';
    const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const body = await fetch(imageUrl).then((r) => r.arrayBuffer());
    const { error } = await this.client.storage
      .from('exhibition-images')
      .upload(path, body, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg' });
    if (error) throw new Error(error.message);
    return this.client.storage.from('exhibition-images').getPublicUrl(path).data.publicUrl;
  }

  async submitExhibition(
    input: ExhibitionInput,
    submittedBy: string | null,
  ): Promise<Exhibition> {
    const imageUrl = await this.uploadImageIfLocal(input.image_url);
    const { data, error } = await this.client.rpc('submit_exhibition', {
      p_venue_name: input.venue_name.trim(),
      p_venue_type: input.venue_type,
      p_venue_address: input.venue_address.trim(),
      p_title: input.title.trim(),
      p_artists: input.artists.trim(),
      p_start_date: input.start_date,
      p_end_date: input.end_date,
      p_opening_datetime: input.opening_datetime,
      p_description: input.description.trim(),
      p_image_url: imageUrl,
    });
    if (error) throw new Error(error.message);
    const created = await this.getExhibition(data as string);
    if (!created) throw new Error('Submission was created but could not be read back.');
    return created;
  }

  async listMySubmissions(userId: string): Promise<Exhibition[]> {
    const venues = await this.client
      .from('venues')
      .select('id')
      .eq('owner_user_id', userId);
    if (venues.error) throw new Error(venues.error.message);
    const venueIds = (venues.data ?? []).map((v) => v.id as string);
    const clauses = [`submitted_by.eq.${userId}`];
    if (venueIds.length > 0) clauses.push(`venue_id.in.(${venueIds.join(',')})`);
    const { data, error } = await this.client
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .or(clauses.join(','))
      .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  }

  async updateSubmission(id: string, input: ExhibitionInput): Promise<void> {
    const imageUrl = await this.uploadImageIfLocal(input.image_url);
    const { error } = await this.client
      .from('exhibitions')
      .update({
        title: input.title.trim(),
        artists: input.artists.trim(),
        start_date: input.start_date,
        end_date: input.end_date,
        opening_datetime: input.opening_datetime,
        description: input.description.trim(),
        image_url: imageUrl,
        status: 'pending',
        rejection_reason: null,
      })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ---- admin ----

  async listPendingExhibitions(): Promise<Exhibition[]> {
    const { data, error } = await this.client
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('status', 'pending')
      .order('start_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  }

  async approveExhibition(id: string, edits: Partial<ExhibitionInput>): Promise<void> {
    const patch: Record<string, unknown> = {
      status: 'approved',
      rejection_reason: null,
    };
    if (edits.title !== undefined) patch.title = edits.title.trim();
    if (edits.artists !== undefined) patch.artists = edits.artists.trim();
    if (edits.start_date !== undefined) patch.start_date = edits.start_date;
    if (edits.end_date !== undefined) patch.end_date = edits.end_date;
    if (edits.opening_datetime !== undefined) patch.opening_datetime = edits.opening_datetime;
    if (edits.description !== undefined) patch.description = edits.description.trim();
    if (edits.image_url !== undefined) patch.image_url = edits.image_url;
    const { error } = await this.client.from('exhibitions').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async rejectExhibition(id: string, reason: RejectionReason): Promise<void> {
    const { error } = await this.client
      .from('exhibitions')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}
