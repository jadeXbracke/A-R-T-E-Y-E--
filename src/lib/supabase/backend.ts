import type { SupabaseClient } from '@supabase/supabase-js';
import { File } from 'expo-file-system';

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

const EXHIBITION_WITH_VENUE = '*, venue:venues(*)';

export class SupabaseBackend implements Backend {
  readonly isDemo = false;

  constructor(private db: SupabaseClient) {}

  private async fetchProfile(userId: string): Promise<Profile> {
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  }

  async signUp(input: SignUpInput): Promise<Profile> {
    const { data, error } = await this.db.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          display_name: input.display_name.trim(),
          profile_type: input.profile_type,
          role: input.role,
        },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Sign-up did not return a user.');
    return this.fetchProfile(data.user.id);
  }

  async signIn(email: string, password: string): Promise<Profile> {
    const { data, error } = await this.db.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    return this.fetchProfile(data.user.id);
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut();
  }

  async restoreSession(): Promise<Profile | null> {
    const { data } = await this.db.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return null;
    try {
      return await this.fetchProfile(userId);
    } catch {
      return null;
    }
  }

  async listVenues(): Promise<Venue[]> {
    const { data, error } = await this.db.from('venues').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data ?? []) as Venue[];
  }

  async listApproved(): Promise<Exhibition[]> {
    const { data, error } = await this.db
      .from('exhibitions')
      .select(EXHIBITION_WITH_VENUE)
      .eq('status', 'approved')
      .order('end_date');
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  }

  async getExhibition(id: string): Promise<Exhibition | null> {
    const { data, error } = await this.db
      .from('exhibitions')
      .select(EXHIBITION_WITH_VENUE)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Exhibition) ?? null;
  }

  async getWatchlist(userId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from('user_watchlist')
      .select('exhibition_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.exhibition_id as string);
  }

  async addToWatchlist(userId: string, exhibitionId: string): Promise<void> {
    const { error } = await this.db
      .from('user_watchlist')
      .upsert({ user_id: userId, exhibition_id: exhibitionId });
    if (error) throw new Error(error.message);
  }

  async removeFromWatchlist(userId: string, exhibitionId: string): Promise<void> {
    const { error } = await this.db
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('exhibition_id', exhibitionId);
    if (error) throw new Error(error.message);
  }

  async listVisits(userId: string): Promise<Visit[]> {
    const { data, error } = await this.db
      .from('user_visits')
      .select('*')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Visit[];
  }

  async saveVisit(visit: Visit): Promise<void> {
    const { error } = await this.db.from('user_visits').upsert(visit);
    if (error) throw new Error(error.message);
    // seeing an exhibition curates it off the want-to-see list
    await this.removeFromWatchlist(visit.user_id, visit.exhibition_id);
  }

  private async findOrCreateVenue(input: SubmissionInput): Promise<string> {
    const { data: existing, error: findError } = await this.db
      .from('venues')
      .select('id')
      .ilike('name', input.venue_name.trim())
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (existing) return existing.id as string;

    const { data, error } = await this.db
      .from('venues')
      .insert({
        name: input.venue_name.trim(),
        type: input.venue_type,
        address: input.venue_address?.trim() || null,
        city: 'Sydney',
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async submitExhibition(
    input: SubmissionInput,
    submittedBy: string | null,
  ): Promise<Exhibition> {
    const venueId = await this.findOrCreateVenue(input);
    const { data, error } = await this.db
      .from('exhibitions')
      .insert({
        venue_id: venueId,
        title: input.title.trim(),
        artists: input.artists.trim(),
        start_date: input.start_date,
        end_date: input.end_date,
        opening_datetime: input.opening_datetime ?? null,
        description: input.description?.trim() || null,
        image_url: input.image_url ?? null,
        status: 'pending',
        is_featured: false,
        city: 'Sydney',
        submitted_by: submittedBy,
        submitter_email: input.submitter_email ?? null,
      })
      .select(EXHIBITION_WITH_VENUE)
      .single();
    if (error) throw new Error(error.message);
    return data as Exhibition;
  }

  async listMySubmissions(userId: string): Promise<Exhibition[]> {
    const { data, error } = await this.db
      .from('exhibitions')
      .select(EXHIBITION_WITH_VENUE)
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  }

  async updateSubmission(id: string, patch: Partial<Exhibition>): Promise<void> {
    const { venue: _venue, ...fields } = patch;
    const { error } = await this.db.from('exhibitions').update(fields).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async listPending(): Promise<Exhibition[]> {
    const { data, error } = await this.db
      .from('exhibitions')
      .select(EXHIBITION_WITH_VENUE)
      .eq('status', 'pending')
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  }

  async approveExhibition(id: string, patch?: Partial<Exhibition>): Promise<void> {
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
    const bytes = await new File(localUri).arrayBuffer();
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await this.db.storage
      .from('exhibition-images')
      .upload(path, bytes, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
    if (error) throw new Error(error.message);
    const { data } = this.db.storage.from('exhibition-images').getPublicUrl(path);
    return data.publicUrl;
  }
}
