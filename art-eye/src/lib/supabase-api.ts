// Live backend. Active when EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are set.
// Schema + RLS live in /supabase; see README for setup.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Api, SignUpInput } from './api-types';
import { ActivityEvent, Conversation, CuratedList, CuratorRole, DirectMessage, Exhibition, ExhibitionDraft, FeedItem, Follow, FollowState, PostComment, PostEngagement, Profile, PublicProfile, RejectionReason, Venue, VenueDraft, VenueProposal, Visit } from './types';
import { mapsSearchUrl } from './maps';

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

// Shape a joined user_visits row (with actor + exhibition + venue) into a FeedItem.
function toFeedItem(row: unknown): FeedItem {
  const r = row as {
    user_id: string;
    exhibition_id: string;
    rating: number;
    reflection: string;
    visit_date: string;
    video_url?: string | null;
    actor?: { display_name?: string } | null;
    exhibition?: { title?: string; venue?: { name?: string } | null } | null;
  };
  return {
    id: `${r.user_id}:${r.exhibition_id}`,
    user_id: r.user_id,
    display_name: r.actor?.display_name ?? 'Someone',
    exhibition_id: r.exhibition_id,
    exhibition_title: r.exhibition?.title ?? 'a show',
    venue_name: r.exhibition?.venue?.name ?? null,
    rating: r.rating,
    reflection: r.reflection,
    visit_date: r.visit_date,
    video_url: r.video_url ?? null,
  };
}

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

  async listCuratedLists() {
    const { data, error } = await supabase()
      .from('guides')
      .select('id, title, intro, curator_name, curator_role, guide_items(exhibition_id, position)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((g) => ({
      id: g.id as string,
      title: g.title as string,
      curator_name: (g.curator_name as string) ?? 'ART EYE',
      curator_role: ((g.curator_role as CuratorRole) ?? 'curator'),
      intro: (g.intro as string) ?? '',
      exhibition_ids: ((g.guide_items as { exhibition_id: string | null; position: number }[]) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((i) => i.exhibition_id)
        .filter((x): x is string => !!x),
    })) as CuratedList[];
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
      video_url: draft.video_url ?? null,
      reel_url: draft.reel_url ?? null,
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
    return (data ?? []).map((v) => ({
      ...v,
      google_maps_url: (v as Venue).google_maps_url ?? mapsSearchUrl(v as Venue),
    })) as Venue[];
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
        video_url: input.video_url ?? null,
        reel_url: input.reel_url ?? null,
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
      video_url: draft.video_url ?? null,
      reel_url: draft.reel_url ?? null,
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

  // ---- social layer -------------------------------------------------------
  async getPublicProfile(userId, viewerId) {
    const sb = supabase();
    const { data: profile, error } = await sb.from('profiles').select('*').eq('id', userId).single();
    if (error) throw new Error(error.message);
    const [{ count: followers }, { count: following }, { count: visits }, rel] = await Promise.all([
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('followee_id', userId).eq('status', 'accepted'),
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId).eq('status', 'accepted'),
      sb.from('user_visits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      viewerId && viewerId !== userId
        ? sb.from('follows').select('status').eq('follower_id', viewerId).eq('followee_id', userId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const status = (rel as { data: { status?: string } | null }).data?.status;
    const state: FollowState = status === 'accepted' ? 'following' : status === 'pending' ? 'requested' : 'none';
    const isOwn = viewerId === userId;
    return {
      ...(profile as Profile),
      followers: followers ?? 0,
      following: following ?? 0,
      visit_count: visits ?? 0,
      follow_state: state,
      can_view_activity: isOwn || !(profile as Profile).is_private || state === 'following',
    } as PublicProfile;
  },

  async followUser(viewerId, targetId) {
    const sb = supabase();
    const { data: target } = await sb.from('profiles').select('is_private').eq('id', targetId).single();
    const status: Follow['status'] = (target as { is_private?: boolean })?.is_private ? 'pending' : 'accepted';
    const { error } = await sb
      .from('follows')
      .upsert({ follower_id: viewerId, followee_id: targetId, status }, { onConflict: 'follower_id,followee_id' });
    if (error) throw new Error(error.message);
    return status === 'accepted' ? 'following' : 'requested';
  },

  async unfollowUser(viewerId, targetId) {
    const { error } = await supabase()
      .from('follows')
      .delete()
      .eq('follower_id', viewerId)
      .eq('followee_id', targetId);
    if (error) throw new Error(error.message);
  },

  async listFollowers(userId) {
    const { data, error } = await supabase()
      .from('follows')
      .select('follower:profiles!follows_follower_id_fkey(*)')
      .eq('followee_id', userId)
      .eq('status', 'accepted');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => (r as unknown as { follower: Profile }).follower);
  },

  async listFollowing(userId) {
    const { data, error } = await supabase()
      .from('follows')
      .select('followee:profiles!follows_followee_id_fkey(*)')
      .eq('follower_id', userId)
      .eq('status', 'accepted');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => (r as unknown as { followee: Profile }).followee);
  },

  async listFollowRequests(userId) {
    const { data, error } = await supabase()
      .from('follows')
      .select('follower:profiles!follows_follower_id_fkey(*)')
      .eq('followee_id', userId)
      .eq('status', 'pending');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => (r as unknown as { follower: Profile }).follower);
  },

  async respondFollowRequest(userId, requesterId, accept) {
    const sb = supabase();
    if (accept) {
      const { error } = await sb
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_id', requesterId)
        .eq('followee_id', userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb
        .from('follows')
        .delete()
        .eq('follower_id', requesterId)
        .eq('followee_id', userId);
      if (error) throw new Error(error.message);
    }
  },

  async setProfilePrivacy(userId, isPrivate) {
    const { error } = await supabase().from('profiles').update({ is_private: isPrivate }).eq('id', userId);
    if (error) throw new Error(error.message);
  },

  async discoverPeople(viewerId) {
    const sb = supabase();
    const { data: mine } = await sb.from('follows').select('followee_id').eq('follower_id', viewerId);
    const exclude = new Set([viewerId, ...((mine ?? []).map((r) => (r as { followee_id: string }).followee_id))]);
    const { data, error } = await sb.from('profiles').select('*').neq('role', 'admin').limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).filter((p) => !exclude.has((p as Profile).id)) as Profile[];
  },

  async friendsFeed(viewerId) {
    const sb = supabase();
    const { data: following } = await sb
      .from('follows')
      .select('followee_id')
      .eq('follower_id', viewerId)
      .eq('status', 'accepted');
    // Your own posts belong in your feed too, Strava-style.
    const ids = [viewerId, ...(following ?? []).map((r) => (r as { followee_id: string }).followee_id)];
    const { data, error } = await sb
      .from('user_visits')
      .select('*, actor:profiles!user_visits_user_id_fkey(display_name), exhibition:exhibitions(title, venue:venues(name))')
      .in('user_id', ids)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toFeedItem);
  },

  async userActivity(userId, _viewerId) {
    // RLS enforces visibility — a hidden profile simply returns no rows.
    const { data, error } = await supabase()
      .from('user_visits')
      .select('*, actor:profiles!user_visits_user_id_fkey(display_name), exhibition:exhibitions(title, venue:venues(name))')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toFeedItem);
  },

  // ---- engagement (likes + comments) ---------------------------------------
  async postEngagement(viewerId, posts) {
    if (posts.length === 0) return {};
    const sb = supabase();
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const exIds = [...new Set(posts.map((p) => p.exhibition_id))];
    // Fetch by the row/column envelope of the page, then keep exact pairs —
    // avoids composite-key OR filters, and a feed page is small anyway.
    const wanted = new Set(posts.map((p) => `${p.user_id}:${p.exhibition_id}`));
    const [likesRes, commentsRes] = await Promise.all([
      sb.from('post_likes').select('post_user_id, exhibition_id, user_id')
        .in('post_user_id', userIds).in('exhibition_id', exIds),
      sb.from('post_comments').select('post_user_id, exhibition_id')
        .in('post_user_id', userIds).in('exhibition_id', exIds),
    ]);
    if (likesRes.error) throw new Error(likesRes.error.message);
    if (commentsRes.error) throw new Error(commentsRes.error.message);
    const out: Record<string, PostEngagement> = {};
    for (const key of wanted) out[key] = { likes: 0, liked_by_me: false, comments: 0 };
    for (const row of likesRes.data ?? []) {
      const r = row as { post_user_id: string; exhibition_id: string; user_id: string };
      const key = `${r.post_user_id}:${r.exhibition_id}`;
      if (!wanted.has(key)) continue;
      out[key].likes += 1;
      if (viewerId && r.user_id === viewerId) out[key].liked_by_me = true;
    }
    for (const row of commentsRes.data ?? []) {
      const r = row as { post_user_id: string; exhibition_id: string };
      const key = `${r.post_user_id}:${r.exhibition_id}`;
      if (wanted.has(key)) out[key].comments += 1;
    }
    return out;
  },

  async toggleLike(viewerId, postUserId, exhibitionId) {
    const sb = supabase();
    const { data: existing, error: readErr } = await sb
      .from('post_likes')
      .select('user_id')
      .eq('post_user_id', postUserId)
      .eq('exhibition_id', exhibitionId)
      .eq('user_id', viewerId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (existing) {
      const { error } = await sb.from('post_likes').delete()
        .eq('post_user_id', postUserId).eq('exhibition_id', exhibitionId).eq('user_id', viewerId);
      if (error) throw new Error(error.message);
      return false;
    }
    const { error } = await sb.from('post_likes')
      .insert({ post_user_id: postUserId, exhibition_id: exhibitionId, user_id: viewerId });
    if (error) throw new Error(error.message);
    return true;
  },

  async listComments(postUserId, exhibitionId) {
    const { data, error } = await supabase()
      .from('post_comments')
      .select('*, commenter:profiles!post_comments_user_id_fkey(display_name)')
      .eq('post_user_id', postUserId)
      .eq('exhibition_id', exhibitionId)
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      const r = row as PostComment & { commenter?: { display_name?: string } | null };
      return {
        id: r.id,
        post_user_id: r.post_user_id,
        exhibition_id: r.exhibition_id,
        user_id: r.user_id,
        display_name: r.commenter?.display_name ?? 'Someone',
        body: r.body,
        created_at: r.created_at,
      };
    });
  },

  async addComment(viewerId, postUserId, exhibitionId, body) {
    const { error } = await supabase().from('post_comments').insert({
      post_user_id: postUserId,
      exhibition_id: exhibitionId,
      user_id: viewerId,
      body: body.trim(),
    });
    if (error) throw new Error(error.message);
  },

  async deleteComment(commentId, _viewerId) {
    // RLS restricts this to the commenter or the post owner
    const { error } = await supabase().from('post_comments').delete().eq('id', commentId);
    if (error) throw new Error(error.message);
  },

  async listActivity(userId) {
    const sb = supabase();
    const [likesRes, commentsRes] = await Promise.all([
      sb.from('post_likes')
        .select('user_id, exhibition_id, created_at, actor:profiles!post_likes_user_id_fkey(display_name), exhibition:exhibitions(title)')
        .eq('post_user_id', userId)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      sb.from('post_comments')
        .select('id, user_id, exhibition_id, body, created_at, actor:profiles!post_comments_user_id_fkey(display_name), exhibition:exhibitions(title)')
        .eq('post_user_id', userId)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    if (likesRes.error) throw new Error(likesRes.error.message);
    if (commentsRes.error) throw new Error(commentsRes.error.message);
    type Joined = {
      id?: string;
      user_id: string;
      exhibition_id: string;
      body?: string;
      created_at: string;
      actor?: { display_name?: string } | null;
      exhibition?: { title?: string } | null;
    };
    const likes: ActivityEvent[] = ((likesRes.data ?? []) as Joined[]).map((r) => ({
      id: `like:${r.user_id}:${r.exhibition_id}`,
      kind: 'like',
      actor_id: r.user_id,
      actor_name: r.actor?.display_name ?? 'Someone',
      exhibition_id: r.exhibition_id,
      exhibition_title: r.exhibition?.title ?? 'a show',
      created_at: r.created_at,
    }));
    const comments: ActivityEvent[] = ((commentsRes.data ?? []) as Joined[]).map((r) => ({
      id: `comment:${r.id}`,
      kind: 'comment',
      actor_id: r.user_id,
      actor_name: r.actor?.display_name ?? 'Someone',
      exhibition_id: r.exhibition_id,
      exhibition_title: r.exhibition?.title ?? 'a show',
      body: r.body,
      created_at: r.created_at,
    }));
    return [...likes, ...comments].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  // ---- direct messages -----------------------------------------------------
  async listConversations(userId) {
    const sb = supabase();
    const { data, error } = await sb
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const byPeer = new Map<string, { last: DirectMessage; unread: number }>();
    for (const row of (data ?? []) as DirectMessage[]) {
      const peerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
      const entry = byPeer.get(peerId) ?? { last: row, unread: 0 };
      if (row.recipient_id === userId && !row.read_at) entry.unread += 1;
      byPeer.set(peerId, entry);
    }
    if (byPeer.size === 0) return [];
    const { data: peers, error: pErr } = await sb
      .from('profiles')
      .select('*')
      .in('id', [...byPeer.keys()]);
    if (pErr) throw new Error(pErr.message);
    const profileById = new Map((peers ?? []).map((p) => [(p as Profile).id, p as Profile]));
    return [...byPeer.entries()]
      .map(([peerId, entry]): Conversation | null => {
        const peer = profileById.get(peerId);
        return peer ? { peer, last: entry.last, unread: entry.unread } : null;
      })
      .filter((c): c is Conversation => c !== null)
      .sort((a, b) => (a.last.created_at < b.last.created_at ? 1 : -1));
  },

  async listMessages(userId, peerId) {
    const { data, error } = await supabase()
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`
      )
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []) as DirectMessage[];
  },

  async sendMessage(senderId, recipientId, body) {
    const { error } = await supabase().from('messages').insert({
      sender_id: senderId,
      recipient_id: recipientId,
      body: body.trim(),
    });
    if (error) throw new Error(error.message);
  },

  async markThreadRead(userId, peerId) {
    const { error } = await supabase()
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('sender_id', peerId)
      .is('read_at', null);
    if (error) throw new Error(error.message);
  },

  async unreadMessageCount(userId) {
    const { count, error } = await supabase()
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async uploadImage(localUri) {
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType =
      ext === 'png'
        ? 'image/png'
        : ext === 'mp4' || ext === 'm4v'
          ? 'video/mp4'
          : ext === 'mov'
            ? 'video/quicktime'
            : 'image/jpeg';
    const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
    const { error } = await supabase()
      .storage.from('exhibition-images')
      .upload(path, decode(base64), { contentType });
    if (error) throw new Error(error.message);
    const { data } = supabase().storage.from('exhibition-images').getPublicUrl(path);
    return data.publicUrl;
  },
};
