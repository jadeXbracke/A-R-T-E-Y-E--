// Live backend. Active when EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are set.
// Schema + RLS live in /supabase; see README for setup.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Api, SignUpInput } from './api-types';
import { Exhibition, ExhibitionDraft, Profile, RejectionReason, Venue, VenueDraft, VenueProposal } from './types';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return client;
}

const EXHIBITION_SELECT = '*, venue:venues(*)';

async function fetchProfile(userId: string, email: string): Promise<Profile> {
  const { data, error } = await supabase().from('profiles').select('*').eq('id', userId).single();
  if (error) throw new Error(error.message);
  return { ...data, email } as Profile;
}

export const supabaseApi: Api = {
  async getSessionProfile() {
    const { data } = await supabase().auth.getSession();
    const session = data.session;
    if (!session) return null;
    return fetchProfile(session.user.id, session.user.email ?? '');
  },

  async signIn(email, password) {
    const { data, error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
    return fetchProfile(data.user.id, data.user.email ?? '');
  },

  async signUp(input: SignUpInput) {
    const { data, error } = await supabase().auth.signUp({
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
    if (!data.user) throw new Error('Check your inbox to confirm your email, then sign in.');
    if (input.role === 'venue_owner' && input.venue) {
      await supabase().from('venues').insert({
        name: input.venue.name.trim(),
        type: input.venue.type,
        address: input.venue.address.trim() || null,
        city: 'Sydney',
        owner_user_id: data.user.id,
      });
    }
    return fetchProfile(data.user.id, data.user.email ?? '');
  },

  async signOut() {
    await supabase().auth.signOut();
  },

  async listApprovedExhibitions() {
    const { data, error } = await supabase()
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('status', 'approved')
      .eq('is_fixture', false) // fixture venues are already filtered by RLS
      .order('start_date');
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  },

  async getExhibition(id) {
    const { data, error } = await supabase()
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Exhibition) ?? null;
  },

  async listWatchlist(userId) {
    const { data, error } = await supabase()
      .from('user_watchlist')
      .select('exhibition_id')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.exhibition_id as string);
  },

  async addToWatchlist(userId, exhibitionId) {
    const { error } = await supabase()
      .from('user_watchlist')
      .upsert({ user_id: userId, exhibition_id: exhibitionId });
    if (error) throw new Error(error.message);
  },

  async removeFromWatchlist(userId, exhibitionId) {
    const { error } = await supabase()
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('exhibition_id', exhibitionId);
    if (error) throw new Error(error.message);
  },

  async listVisits(userId) {
    const { data, error } = await supabase()
      .from('user_visits')
      .select('*')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async saveVisit(visit) {
    const { error } = await supabase().from('user_visits').upsert(visit);
    if (error) throw new Error(error.message);
    await supabaseApi.removeFromWatchlist(visit.user_id, visit.exhibition_id);
  },

  async submitExhibition(draft: ExhibitionDraft, _userId) {
    const sb = supabase();
    const { data: existing } = await sb
      .from('venues')
      .select('id')
      .ilike('name', draft.venue_name.trim())
      .maybeSingle();
    let venueId = existing?.id as string | undefined;
    if (!venueId) {
      const { data: created, error } = await sb
        .from('venues')
        .insert({
          name: draft.venue_name.trim(),
          type: draft.venue_type,
          address: draft.venue_address.trim() || null,
          city: 'Sydney',
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      venueId = created.id;
    }
    const { error } = await sb.from('exhibitions').insert({
      venue_id: venueId,
      title: draft.title.trim(),
      artists: draft.artists.trim(),
      start_date: draft.start_date,
      end_date: draft.end_date,
      opening_datetime: draft.opening_datetime,
      description: draft.description.trim(),
      image_url: draft.image_url,
      status: 'pending',
      city: 'Sydney',
    });
    if (error) throw new Error(error.message);
  },

  async myVenue(userId) {
    const { data, error } = await supabase()
      .from('venues')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  },

  async listMySubmissions(userId) {
    const { data: venues, error: vErr } = await supabase()
      .from('venues')
      .select('id')
      .eq('owner_user_id', userId);
    if (vErr) throw new Error(vErr.message);
    const ids = (venues ?? []).map((v) => v.id);
    if (!ids.length) return [];
    const { data, error } = await supabase()
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .in('venue_id', ids)
      .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  },

  async updateSubmission(id, patch, _userId) {
    // RLS restricts this to exhibitions at venues the caller owns
    const { error } = await supabase()
      .from('exhibitions')
      .update({ ...patch, status: 'pending', rejection_reason: null })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async listPending() {
    const { data, error } = await supabase()
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('status', 'pending')
      .order('start_date');
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  },

  async adminUpdateExhibition(id, patch) {
    const { venue: _v, ...rest } = patch as Exhibition;
    const { error } = await supabase().from('exhibitions').update(rest).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async approveExhibition(id) {
    await supabaseApi.adminUpdateExhibition(id, { status: 'approved', rejection_reason: null });
  },

  async rejectExhibition(id, reason: RejectionReason) {
    await supabaseApi.adminUpdateExhibition(id, { status: 'rejected', rejection_reason: reason });
  },

  // ---- host control (admin only; RLS enforces the same) --------------------
  async listVenues() {
    const { data, error } = await supabase().from('venues').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data ?? []) as Venue[];
  },

  async createVenue(input: VenueDraft) {
    const { data, error } = await supabase()
      .from('venues')
      .insert({
        name: input.name.trim(),
        type: input.type,
        address: input.address?.trim() || null,
        suburb: input.suburb?.trim() || null,
        website: input.website?.trim() || null,
        instagram: input.instagram?.trim() || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        is_fixture: input.is_fixture ?? false,
        image_url: input.image_url ?? null,
        city: 'Sydney',
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Venue;
  },

  async updateVenue(id, patch) {
    const { venue: _v, ...rest } = patch as Venue & { venue?: unknown };
    const { error } = await supabase().from('venues').update(rest).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteVenue(id) {
    // exhibitions.venue_id is ON DELETE CASCADE, so this clears its shows too
    const { error } = await supabase().from('venues').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async listAllExhibitions() {
    const { data, error } = await supabase()
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .order('start_date');
    if (error) throw new Error(error.message);
    return (data ?? []) as Exhibition[];
  },

  async adminCreateExhibition(draft: ExhibitionDraft) {
    const sb = supabase();
    const { data: existing } = await sb
      .from('venues')
      .select('id')
      .ilike('name', draft.venue_name.trim())
      .maybeSingle();
    let venueId = existing?.id as string | undefined;
    if (!venueId) {
      const { data: created, error } = await sb
        .from('venues')
        .insert({
          name: draft.venue_name.trim(),
          type: draft.venue_type,
          address: draft.venue_address.trim() || null,
          city: 'Sydney',
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      venueId = created.id;
    }
    // published straight into the agenda — the host is the editor
    const { error } = await sb.from('exhibitions').insert({
      venue_id: venueId,
      title: draft.title.trim(),
      artists: draft.artists.trim(),
      start_date: draft.start_date,
      end_date: draft.end_date,
      opening_datetime: draft.opening_datetime,
      description: draft.description.trim(),
      image_url: draft.image_url,
      status: 'approved',
      city: 'Sydney',
    });
    if (error) throw new Error(error.message);
  },

  async deleteExhibition(id) {
    const { error } = await supabase().from('exhibitions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ---- owner inbox (RLS: owner only) ---------------------------------------
  async listProposals() {
    const { data, error } = await supabase()
      .from('venue_review_queue')
      .select('*')
      .eq('status', 'pending')
      .order('confidence', { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as VenueProposal[];
  },

  async approveProposal(proposal, payload) {
    const sb = supabase();
    const today = new Date().toISOString().slice(0, 10);
    const stamp = { verified_date: today, verification_source: 'owner' };
    if (proposal.action_type === 'add') {
      const { error } = await sb.from('venues').insert({ ...payload, ...stamp });
      if (error) throw new Error(error.message);
    } else if (proposal.action_type === 'archive') {
      const { error } = await sb.from('venues')
        .update({ status: 'archived', ...stamp })
        .eq('id', proposal.venue_id!);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from('venues')
        .update({ ...payload, ...stamp })
        .eq('id', proposal.venue_id!);
      if (error) throw new Error(error.message);
    }
    const { error } = await sb.from('venue_review_queue')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', proposal.id);
    if (error) throw new Error(error.message);
  },

  async rejectProposal(id, note) {
    const snooze = new Date();
    snooze.setDate(snooze.getDate() + 90);
    const { error } = await supabase().from('venue_review_queue')
      .update({
        status: 'rejected',
        review_note: note.trim() || null,
        snooze_until: snooze.toISOString().slice(0, 10),
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async uploadImage(localUri) {
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
    const { error } = await supabase()
      .storage.from('exhibition-images')
      .upload(path, decode(base64), { contentType: ext === 'png' ? 'image/png' : 'image/jpeg' });
    if (error) throw new Error(error.message);
    const { data } = supabase().storage.from('exhibition-images').getPublicUrl(path);
    return data.publicUrl;
  },
};
