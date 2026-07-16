import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Backend } from './backend';
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

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const hasSupabaseConfig = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export class SupabaseBackend implements Backend {
  readonly kind = 'supabase' as const;
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  private async profileFor(userId: string): Promise<UserProfile> {
    const { data, error } = await this.client.from('users').select('*').eq('id', userId).single();
    if (error) throw new Error(error.message);
    return data as UserProfile;
  }

  async restoreSession() {
    const { data } = await this.client.auth.getSession();
    const id = data.session?.user?.id;
    return id ? this.profileFor(id) : null;
  }

  async signUp(args: {
    email: string;
    password: string;
    displayName: string;
    role: Role;
    profileType: ProfileType;
  }) {
    const { data, error } = await this.client.auth.signUp({
      email: args.email.trim(),
      password: args.password,
    });
    if (error) throw new Error(error.message);
    const id = data.user?.id;
    if (!id) throw new Error('Sign-up did not return a user. Check email confirmation settings.');
    const { error: upErr } = await this.client.from('users').upsert({
      id,
      role: args.role === 'admin' ? 'user' : args.role, // admin is granted server-side only
      profile_type: args.profileType,
      display_name: args.displayName.trim(),
      city: 'Sydney',
    });
    if (upErr) throw new Error(upErr.message);
    return this.profileFor(id);
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    return this.profileFor(data.user.id);
  }

  async signOut() {
    await this.client.auth.signOut();
  }

  private async venuesById(ids: string[]): Promise<Venue[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client.from('venues').select('*').in('id', ids);
    if (error) throw new Error(error.message);
    return (data ?? []) as Venue[];
  }

  async listAgenda() {
    const { data, error } = await this.client
      .from('exhibitions')
      .select('*')
      .eq('status', 'approved')
      .eq('city', 'Sydney')
      .order('end_date', { ascending: true });
    if (error) throw new Error(error.message);
    const exhibitions = (data ?? []) as Exhibition[];
    const venues = await this.venuesById([...new Set(exhibitions.map((e) => e.venue_id))]);
    return { exhibitions, venues };
  }

  async getWatchlist(userId: string) {
    const { data, error } = await this.client
      .from('user_watchlist')
      .select('exhibition_id')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.exhibition_id as string);
  }

  async addToWatchlist(userId: string, exhibitionId: string) {
    const { error } = await this.client
      .from('user_watchlist')
      .upsert({ user_id: userId, exhibition_id: exhibitionId });
    if (error) throw new Error(error.message);
  }

  async removeFromWatchlist(userId: string, exhibitionId: string) {
    const { error } = await this.client
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('exhibition_id', exhibitionId);
    if (error) throw new Error(error.message);
  }

  async getVisits(userId: string) {
    const { data, error } = await this.client
      .from('user_visits')
      .select('*')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Visit[];
  }

  async markSeen(visit: Visit) {
    const { error } = await this.client.from('user_visits').upsert(visit);
    if (error) throw new Error(error.message);
    await this.removeFromWatchlist(visit.user_id, visit.exhibition_id);
  }

  private async findOrCreateVenue(input: ExhibitionInput, ownerId: string | null): Promise<string> {
    const name = input.venue_name.trim();
    const { data } = await this.client.from('venues').select('id').ilike('name', name).limit(1);
    if (data && data.length > 0) return data[0].id as string;
    const { data: created, error } = await this.client
      .from('venues')
      .insert({ name, type: input.venue_type, address: '', city: 'Sydney', owner_user_id: ownerId })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return created.id as string;
  }

  private editPayload(input: ExhibitionInput, venueId: string) {
    return {
      venue_id: venueId,
      title: input.title.trim(),
      artists: input.artists.trim(),
      start_date: input.start_date,
      end_date: input.end_date,
      opening_datetime: input.opening_datetime,
      description: input.description.trim(),
      image_url: input.image_url,
      city: 'Sydney',
    };
  }

  async submitExhibition(input: ExhibitionInput, submittedBy: string | null) {
    const venueId = await this.findOrCreateVenue(input, submittedBy);
    const { error } = await this.client.from('exhibitions').insert({
      ...this.editPayload(input, venueId),
      status: 'pending',
      is_featured: false,
      submitted_by: submittedBy,
      submitter_contact: input.submitter_contact ?? null,
    });
    if (error) throw new Error(error.message);
  }

  async listMySubmissions(userId: string) {
    const { data, error } = await this.client
      .from('exhibitions')
      .select('*')
      .eq('submitted_by', userId)
      .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    const exhibitions = (data ?? []) as Exhibition[];
    const venues = await this.venuesById([...new Set(exhibitions.map((e) => e.venue_id))]);
    return { exhibitions, venues };
  }

  async updateSubmission(id: string, input: ExhibitionInput) {
    const venueId = await this.findOrCreateVenue(input, null);
    const { error } = await this.client
      .from('exhibitions')
      .update({ ...this.editPayload(input, venueId), status: 'pending', rejection_reason: null })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async listPending() {
    const { data, error } = await this.client
      .from('exhibitions')
      .select('*')
      .eq('status', 'pending')
      .order('start_date', { ascending: true });
    if (error) throw new Error(error.message);
    const exhibitions = (data ?? []) as Exhibition[];
    const venues = await this.venuesById([...new Set(exhibitions.map((e) => e.venue_id))]);
    return { exhibitions, venues };
  }

  async approve(id: string, edits: ExhibitionInput) {
    const venueId = await this.findOrCreateVenue(edits, null);
    const { error } = await this.client
      .from('exhibitions')
      .update({ ...this.editPayload(edits, venueId), status: 'approved', rejection_reason: null })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async reject(id: string, reason: RejectionReason) {
    const { error } = await this.client
      .from('exhibitions')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async uploadImage(localUri: string) {
    const res = await fetch(localUri);
    const body = await res.arrayBuffer();
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await this.client.storage
      .from('exhibition-images')
      .upload(path, body, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
    if (error) throw new Error(error.message);
    return this.client.storage.from('exhibition-images').getPublicUrl(path).data.publicUrl;
  }
}
