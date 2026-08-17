// Live backend. Active when EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are set.
// Schema + RLS live in /supabase; see README for setup.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Api, SignUpInput } from './api-types';
import { Comment, Conversation, CuratedList, CuratorRole, DirectMessage, Exhibition, ExhibitionDraft, ExhibitionProposal, Feedback, FeedItem, Follow, FollowState, ImageCandidate, Notification, NotificationKind, Profile, PublicProfile, RejectionReason, Venue, VenueDraft, VenueProposal, Visit } from './types';
import { mapsSearchUrl } from './maps';
import { todayStr } from './dates';
import { extractMentionIds } from './mentions';

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
          // Web only: lets the emailed password-recovery link sign in.
          detectSessionInUrl: typeof window !== 'undefined',
        },
      }
    );
  }
  return client;
}

const EXHIBITION_SELECT = '*, venue:venues(*)';

// Shape a joined user_visits row (with actor + exhibition + venue) into a FeedItem.
const FEED_ITEM_SELECT =
  '*, actor:profiles!user_visits_user_id_fkey(display_name, avatar_url), exhibition:exhibitions(title, image_url, venue:venues(name, image_url))';

function toFeedItem(row: unknown): FeedItem {
  const r = row as {
    user_id: string;
    exhibition_id: string;
    rating: number;
    reflection: string;
    visit_date: string;
    video_url?: string | null;
    photo_url?: string | null;
    actor?: { display_name?: string; avatar_url?: string | null } | null;
    exhibition?: { title?: string; image_url?: string | null; venue?: { name?: string; image_url?: string | null } | null } | null;
  };
  return {
    id: `${r.user_id}:${r.exhibition_id}`,
    user_id: r.user_id,
    display_name: r.actor?.display_name ?? 'Someone',
    avatar_url: r.actor?.avatar_url ?? null,
    exhibition_id: r.exhibition_id,
    exhibition_title: r.exhibition?.title ?? 'a show',
    exhibition_image_url: r.exhibition?.image_url ?? null,
    venue_name: r.exhibition?.venue?.name ?? null,
    venue_image_url: r.exhibition?.venue?.image_url ?? null,
    rating: r.rating,
    reflection: r.reflection,
    visit_date: r.visit_date,
    video_url: r.video_url ?? null,
    photo_url: r.photo_url ?? null,
    like_count: 0,
    liked_by_me: false,
    comment_count: 0,
  };
}

// Fill like/comment counts (and the viewer's liked state) onto a set of feed items.
async function withReactions(items: FeedItem[], viewerId: string | null): Promise<FeedItem[]> {
  if (items.length === 0) return items;
  const exIds = [...new Set(items.map((i) => i.exhibition_id))];
  const ownerIds = [...new Set(items.map((i) => i.user_id))];
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase().from('post_likes').select('user_id, post_user_id, exhibition_id').in('post_user_id', ownerIds).in('exhibition_id', exIds),
    supabase().from('post_comments').select('post_user_id, exhibition_id').in('post_user_id', ownerIds).in('exhibition_id', exIds),
  ]);
  const key = (u: string, e: string) => `${u}:${e}`;
  const likeRows = (likes ?? []) as { user_id: string; post_user_id: string; exhibition_id: string }[];
  const commentRows = (comments ?? []) as { post_user_id: string; exhibition_id: string }[];
  return items.map((it) => {
    const k = key(it.user_id, it.exhibition_id);
    const postLikes = likeRows.filter((l) => key(l.post_user_id, l.exhibition_id) === k);
    return {
      ...it,
      like_count: postLikes.length,
      liked_by_me: !!viewerId && postLikes.some((l) => l.user_id === viewerId),
      comment_count: commentRows.filter((c) => key(c.post_user_id, c.exhibition_id) === k).length,
    };
  });
}

// Everyone blocked by, or who has blocked, viewerId — for filtering feeds,
// discovery and search. Empty set for a signed-out viewer.
async function blockedIdSet(viewerId: string | null): Promise<Set<string>> {
  if (!viewerId) return new Set();
  const { data } = await supabase()
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${viewerId},blocked_id.eq.${viewerId}`);
  const rows = (data ?? []) as { blocker_id: string; blocked_id: string }[];
  return new Set(rows.map((r) => (r.blocker_id === viewerId ? r.blocked_id : r.blocker_id)));
}

// Fire-and-forget push notification via the send-push Edge Function. Never
// throws — a failed or absent push must never break the action that
// triggered it (sending a message still succeeds even if the push fails).
function notify(userId: string, title: string, body: string, data?: Record<string, unknown>): void {
  supabase()
    .functions.invoke('send-push', { body: { user_id: userId, title, body, data } })
    .catch(() => {});
}

// Durable, in-app counterpart to the push notify() above. Never notifies
// someone about their own action; failures are swallowed the same way —
// a missed notification row must never break the action that triggered it.
function notifyInApp(
  userId: string,
  kind: NotificationKind,
  actorId: string,
  exhibitionId: string | null = null,
  postUserId: string | null = null,
  commentId: string | null = null
): void {
  if (!userId || userId === actorId) return;
  supabase()
    .from('notifications')
    .insert({
      user_id: userId,
      kind,
      actor_id: actorId,
      exhibition_id: exhibitionId,
      post_user_id: postUserId,
      comment_id: commentId,
    })
    .then(
      () => {},
      () => {}
    );
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
    // An existing, already-confirmed email comes back as a user with no
    // identities and no session — Supabase's way of not revealing which
    // emails are taken. Give that its own message instead of a database error.
    if (!data.session && data.user.identities?.length === 0) {
      throw new Error('An account with this email already exists — sign in instead.');
    }
    // Email confirmation is required: there is no session yet, so profiles
    // (readable only when signed in) can't be fetched until the link is
    // clicked. The profile row itself already exists (a database trigger
    // created it), so this is not an error — just not signed in yet.
    if (!data.session) {
      throw new Error('Check your inbox to confirm your email, then sign in.');
    }
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
    // Only shows you can still go and see: finished shows drop out of the
    // whole public app, shows without a known end date stay (dates TBA).
    const { data, error } = await supabase()
      .from('exhibitions')
      .select(EXHIBITION_SELECT)
      .eq('status', 'approved')
      .eq('is_fixture', false) // fixture venues are already filtered by RLS
      .or(`end_date.gte.${todayStr()},end_date.is.null`)
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

  // ---- shows inbox --------------------------------------------------------
  // Everything here runs as the signed-in user, so RLS on
  // exhibition_review_queue ("admin all") decides — any non-admin account
  // gets empty lists and refused writes no matter what the client requests.
  async listExhibitionProposals() {
    const { data, error } = await supabase()
      .from('exhibition_review_queue')
      .select('*, venues(name)')
      .eq('status', 'pending')
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => {
      const { venues, ...rest } = row as Record<string, unknown> & { venues: { name: string } | null };
      return { ...rest, venue_name: venues?.name ?? 'Unknown venue' } as ExhibitionProposal;
    });
  },

  async approveExhibitionProposal(id) {
    // The RPC re-checks is_admin() server-side before inserting the show.
    const { error } = await supabase().rpc('approve_exhibition_proposal', { qid: id });
    if (error) throw new Error(error.message);
  },

  async rejectExhibitionProposal(id) {
    const { error } = await supabase().from('exhibition_review_queue')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async listImageCandidates(exhibitionId) {
    // functions.invoke has no query-string support, so call the function URL.
    const base = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    const url = `${base}/functions/v1/image-candidates?exhibition_id=${encodeURIComponent(exhibitionId)}`;
    const res = await fetch(url, { headers: { apikey: key } });
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'The image-candidates function is not deployed yet.'
          : `Could not read the venue site (${res.status}).`
      );
    }
    const body = (await res.json()) as { ok?: boolean; error?: string; candidates?: ImageCandidate[] };
    if (body?.ok === false) throw new Error(body.error ?? 'Could not read the venue site.');
    return body?.candidates ?? [];
  },

  async setExhibitionImage(exhibitionId, imageUrl) {
    // Plain admin update — RLS decides whether this account may do it.
    const { error } = await supabase()
      .from('exhibitions')
      .update({ image_url: imageUrl })
      .eq('id', exhibitionId);
    if (error) throw new Error(error.message);
  },

  async listVenueImageCandidates(venueId) {
    const base = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    const url = `${base}/functions/v1/image-candidates?venue_id=${encodeURIComponent(venueId)}`;
    const res = await fetch(url, { headers: { apikey: key } });
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'The image-candidates function is not deployed yet.'
          : `Could not read the venue site (${res.status}).`
      );
    }
    const body = (await res.json()) as { ok?: boolean; error?: string; candidates?: ImageCandidate[] };
    if (body?.ok === false) throw new Error(body.error ?? 'Could not read the venue site.');
    return body?.candidates ?? [];
  },

  async setVenueImage(venueId, imageUrl) {
    const { error } = await supabase()
      .from('venues')
      .update({ image_url: imageUrl })
      .eq('id', venueId);
    if (error) throw new Error(error.message);
  },

  async requestPasswordReset(email) {
    const redirectTo = typeof location !== 'undefined'
      ? location.origin + location.pathname
      : undefined;
    const { error } = await supabase().auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) throw new Error(error.message);
  },

  async updatePassword(password) {
    const { error } = await supabase().auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  // ---- social layer -------------------------------------------------------
  async getPublicProfile(userId, viewerId) {
    const sb = supabase();
    const { data: profile, error } = await sb.from('profiles').select('*').eq('id', userId).single();
    if (error) throw new Error(error.message);
    const [{ count: followers }, { count: following }, { count: visits }, rel, blockRow] = await Promise.all([
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('followee_id', userId).eq('status', 'accepted'),
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId).eq('status', 'accepted'),
      sb.from('user_visits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      viewerId && viewerId !== userId
        ? sb.from('follows').select('status').eq('follower_id', viewerId).eq('followee_id', userId).maybeSingle()
        : Promise.resolve({ data: null }),
      viewerId && viewerId !== userId
        ? sb.from('blocks').select('blocker_id').eq('blocker_id', viewerId).eq('blocked_id', userId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const status = (rel as { data: { status?: string } | null }).data?.status;
    const state: FollowState = status === 'accepted' ? 'following' : status === 'pending' ? 'requested' : 'none';
    const isOwn = viewerId === userId;
    const blockedByMe = !!(blockRow as { data: unknown } | null)?.data;
    return {
      ...(profile as Profile),
      followers: followers ?? 0,
      following: following ?? 0,
      visit_count: visits ?? 0,
      follow_state: state,
      can_view_activity: !blockedByMe && (isOwn || !(profile as Profile).is_private || state === 'following'),
      blocked_by_me: blockedByMe,
    } as PublicProfile;
  },

  async followUser(viewerId, targetId) {
    const sb = supabase();
    const [{ data: target }, { data: follower }] = await Promise.all([
      sb.from('profiles').select('is_private').eq('id', targetId).single(),
      sb.from('profiles').select('display_name').eq('id', viewerId).single(),
    ]);
    const status: Follow['status'] = (target as { is_private?: boolean })?.is_private ? 'pending' : 'accepted';
    const { error } = await sb
      .from('follows')
      .upsert({ follower_id: viewerId, followee_id: targetId, status }, { onConflict: 'follower_id,followee_id' });
    if (error) throw new Error(error.message);
    const name = (follower as { display_name?: string } | null)?.display_name ?? 'Someone';
    notifyInApp(targetId, status === 'accepted' ? 'follow' : 'follow_request', viewerId);
    notify(
      targetId,
      status === 'accepted' ? 'New follower' : 'Follow request',
      status === 'accepted' ? `${name} started following you.` : `${name} asked to follow you.`,
      { type: 'follow', user_id: viewerId }
    );
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
      notifyInApp(requesterId, 'follow', userId);
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

  async updateOwnProfile(userId, patch) {
    const { error } = await supabase().from('profiles').update(patch).eq('id', userId);
    if (error) throw new Error(error.message);
  },

  async discoverPeople(viewerId) {
    const sb = supabase();
    const [{ data: mine }, blocked] = await Promise.all([
      sb.from('follows').select('followee_id').eq('follower_id', viewerId),
      blockedIdSet(viewerId),
    ]);
    const exclude = new Set([
      viewerId,
      ...blocked,
      ...((mine ?? []).map((r) => (r as { followee_id: string }).followee_id)),
    ]);
    const { data, error } = await sb.from('profiles').select('*').neq('role', 'admin').limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).filter((p) => !exclude.has((p as Profile).id)) as Profile[];
  },

  // Everyone (except the app owner, yourself and anyone blocked either way),
  // for the people search — the caller filters by name locally, same pattern
  // as the venue/show search.
  async searchPeople(viewerId) {
    const [{ data, error }, blocked] = await Promise.all([
      supabase().from('profiles').select('*').neq('role', 'admin').neq('id', viewerId).limit(200),
      blockedIdSet(viewerId),
    ]);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Profile[]).filter((p) => !blocked.has(p.id));
  },

  async friendsFeed(viewerId) {
    const sb = supabase();
    const [{ data: following }, blocked] = await Promise.all([
      sb.from('follows').select('followee_id').eq('follower_id', viewerId).eq('status', 'accepted'),
      blockedIdSet(viewerId),
    ]);
    const ids = (following ?? [])
      .map((r) => (r as { followee_id: string }).followee_id)
      .filter((id) => !blocked.has(id));
    if (ids.length === 0) return [];
    const { data, error } = await sb
      .from('user_visits')
      .select(FEED_ITEM_SELECT)
      .in('user_id', ids)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return withReactions((data ?? []).map(toFeedItem), viewerId);
  },

  // Every public profile's activity, not just people you follow — how new
  // visitors find people to follow in the first place.
  async discoverFeed(viewerId) {
    const sb = supabase();
    const [{ data: pub }, blocked] = await Promise.all([
      sb.from('profiles').select('id').eq('is_private', false).neq('role', 'admin'),
      blockedIdSet(viewerId),
    ]);
    const ids = (pub ?? [])
      .map((r) => (r as { id: string }).id)
      .filter((id) => !blocked.has(id));
    if (ids.length === 0) return [];
    const { data, error } = await sb
      .from('user_visits')
      .select(FEED_ITEM_SELECT)
      .in('user_id', ids)
      .order('visit_date', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return withReactions((data ?? []).map(toFeedItem), viewerId);
  },

  async trendingPosts(viewerId) {
    const sb = supabase();
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().slice(0, 10);
    const [{ data: pub }, blocked] = await Promise.all([
      sb.from('profiles').select('id').eq('is_private', false).neq('role', 'admin'),
      blockedIdSet(viewerId),
    ]);
    const ids = (pub ?? [])
      .map((r) => (r as { id: string }).id)
      .filter((id) => !blocked.has(id));
    if (ids.length === 0) return [];
    const { data, error } = await sb
      .from('user_visits')
      .select(FEED_ITEM_SELECT)
      .in('user_id', ids)
      .gte('visit_date', sinceStr)
      .order('visit_date', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const items = await withReactions((data ?? []).map(toFeedItem), viewerId);
    return items.filter((i) => i.like_count > 0).sort((a, b) => b.like_count - a.like_count).slice(0, 10);
  },

  async userActivity(userId, viewerId) {
    // RLS enforces visibility — a hidden profile simply returns no rows.
    const { data, error } = await supabase()
      .from('user_visits')
      .select(FEED_ITEM_SELECT)
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
    if (error) throw new Error(error.message);
    return withReactions((data ?? []).map(toFeedItem), viewerId);
  },

  async friendsWhoVisited(exhibitionId, viewerId) {
    const sb = supabase();
    const [{ data: following }, blocked] = await Promise.all([
      sb.from('follows').select('followee_id').eq('follower_id', viewerId).eq('status', 'accepted'),
      blockedIdSet(viewerId),
    ]);
    const ids = (following ?? [])
      .map((r) => (r as { followee_id: string }).followee_id)
      .filter((id) => !blocked.has(id));
    if (ids.length === 0) return [];
    const { data, error } = await sb
      .from('user_visits')
      .select('user_id')
      .eq('exhibition_id', exhibitionId)
      .in('user_id', ids);
    if (error) throw new Error(error.message);
    const visitorIds = [...new Set((data ?? []).map((r) => (r as { user_id: string }).user_id))];
    if (visitorIds.length === 0) return [];
    const { data: people, error: pErr } = await sb.from('profiles').select('*').in('id', visitorIds);
    if (pErr) throw new Error(pErr.message);
    return (people ?? []) as Profile[];
  },

  async getPost(postUserId, exhibitionId, viewerId) {
    const { data, error } = await supabase()
      .from('user_visits')
      .select(FEED_ITEM_SELECT)
      .eq('user_id', postUserId)
      .eq('exhibition_id', exhibitionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return (await withReactions([toFeedItem(data)], viewerId))[0];
  },

  async likePost(likerId, postUserId, exhibitionId) {
    const { error } = await supabase()
      .from('post_likes')
      .upsert({ user_id: likerId, post_user_id: postUserId, exhibition_id: exhibitionId });
    if (error) throw new Error(error.message);
    notifyInApp(postUserId, 'like', likerId, exhibitionId, postUserId);
  },

  async unlikePost(likerId, postUserId, exhibitionId) {
    const { error } = await supabase()
      .from('post_likes')
      .delete()
      .eq('user_id', likerId)
      .eq('post_user_id', postUserId)
      .eq('exhibition_id', exhibitionId);
    if (error) throw new Error(error.message);
  },

  async listComments(postUserId, exhibitionId, viewerId) {
    const { data, error } = await supabase()
      .from('post_comments')
      .select('*, author:profiles!post_comments_author_id_fkey(display_name)')
      .eq('post_user_id', postUserId)
      .eq('exhibition_id', exhibitionId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as {
      id: string; post_user_id: string; exhibition_id: string; author_id: string;
      text: string; created_at: string; parent_comment_id: string | null;
      author?: { display_name?: string } | null;
    }[];
    if (rows.length === 0) return [];
    const { data: likeRows, error: likeErr } = await supabase()
      .from('comment_likes')
      .select('user_id, comment_id')
      .in('comment_id', rows.map((r) => r.id));
    if (likeErr) throw new Error(likeErr.message);
    const likes = (likeRows ?? []) as { user_id: string; comment_id: string }[];
    return rows.map((row) => {
      const commentLikes = likes.filter((l) => l.comment_id === row.id);
      return {
        id: row.id,
        post_user_id: row.post_user_id,
        exhibition_id: row.exhibition_id,
        author_id: row.author_id,
        author_name: row.author?.display_name ?? 'Someone',
        text: row.text,
        created_at: row.created_at,
        parent_comment_id: row.parent_comment_id,
        like_count: commentLikes.length,
        liked_by_me: !!viewerId && commentLikes.some((l) => l.user_id === viewerId),
      };
    });
  },

  async addComment(authorId, postUserId, exhibitionId, text, parentCommentId = null) {
    const { data, error } = await supabase()
      .from('post_comments')
      .insert({
        author_id: authorId,
        post_user_id: postUserId,
        exhibition_id: exhibitionId,
        text: text.trim(),
        parent_comment_id: parentCommentId ?? null,
      })
      .select('*, author:profiles!post_comments_author_id_fkey(display_name)')
      .single();
    if (error) throw new Error(error.message);
    const row = data as unknown as {
      id: string; post_user_id: string; exhibition_id: string; author_id: string;
      text: string; created_at: string; parent_comment_id: string | null;
      author?: { display_name?: string } | null;
    };
    const authorName = row.author?.display_name ?? 'Someone';

    // A plain follow-up lookup, not a self-referencing embed — PostgREST's
    // embedding of a table into itself needs extra disambiguation and isn't
    // worth the fragility here for what's only needed on the reply path.
    let parentAuthorId: string | null = null;
    if (parentCommentId) {
      const { data: parent } = await supabase()
        .from('post_comments')
        .select('author_id')
        .eq('id', parentCommentId)
        .maybeSingle();
      parentAuthorId = (parent as { author_id?: string } | null)?.author_id ?? null;
    }

    if (parentAuthorId && parentAuthorId !== authorId) {
      notifyInApp(parentAuthorId, 'reply', authorId, exhibitionId, postUserId, row.id);
      notify(parentAuthorId, 'New reply', `${authorName} replied to your comment.`, {
        type: 'reply', post_user_id: postUserId, exhibition_id: exhibitionId,
      });
    }
    if (postUserId !== authorId && postUserId !== parentAuthorId) {
      notifyInApp(postUserId, 'comment', authorId, exhibitionId, postUserId, row.id);
      notify(postUserId, 'New comment', `${authorName} commented on your post.`, {
        type: 'comment', post_user_id: postUserId, exhibition_id: exhibitionId,
      });
    }
    for (const mentionedId of extractMentionIds(row.text)) {
      if (mentionedId !== authorId) notifyInApp(mentionedId, 'mention', authorId, exhibitionId, postUserId, row.id);
    }

    return {
      id: row.id,
      post_user_id: row.post_user_id,
      exhibition_id: row.exhibition_id,
      author_id: row.author_id,
      author_name: authorName,
      text: row.text,
      created_at: row.created_at,
      parent_comment_id: row.parent_comment_id,
      like_count: 0,
      liked_by_me: false,
    };
  },

  async likeComment(userId, commentId) {
    const { error } = await supabase()
      .from('comment_likes')
      .upsert({ user_id: userId, comment_id: commentId });
    if (error) throw new Error(error.message);
    const { data: c } = await supabase()
      .from('post_comments')
      .select('author_id, exhibition_id, post_user_id')
      .eq('id', commentId)
      .maybeSingle();
    if (c) {
      const row = c as { author_id: string; exhibition_id: string; post_user_id: string };
      notifyInApp(row.author_id, 'comment_like', userId, row.exhibition_id, row.post_user_id, commentId);
    }
  },

  async unlikeComment(userId, commentId) {
    const { error } = await supabase()
      .from('comment_likes')
      .delete()
      .eq('user_id', userId)
      .eq('comment_id', commentId);
    if (error) throw new Error(error.message);
  },

  // ---- direct messages ----------------------------------------------------
  // Allowed only between mutual follows; RLS enforces the same rule on insert.
  async canMessage(viewerId, targetId) {
    if (!viewerId || viewerId === targetId) return false;
    const sb = supabase();
    const [{ count: ab }, { count: ba }, { count: blocked }] = await Promise.all([
      sb.from('follows').select('*', { count: 'exact', head: true })
        .eq('follower_id', viewerId).eq('followee_id', targetId).eq('status', 'accepted'),
      sb.from('follows').select('*', { count: 'exact', head: true })
        .eq('follower_id', targetId).eq('followee_id', viewerId).eq('status', 'accepted'),
      sb.from('blocks').select('*', { count: 'exact', head: true })
        .or(`and(blocker_id.eq.${viewerId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${viewerId})`),
    ]);
    return (ab ?? 0) > 0 && (ba ?? 0) > 0 && (blocked ?? 0) === 0;
  },

  async listConversations(userId) {
    const sb = supabase();
    const { data, error } = await sb
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as DirectMessage[];
    const byPeer = new Map<string, DirectMessage[]>();
    for (const m of rows) {
      const peerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      const list = byPeer.get(peerId) ?? [];
      list.push(m);
      byPeer.set(peerId, list);
    }
    if (byPeer.size === 0) return [];
    const { data: peers, error: pErr } = await sb
      .from('profiles')
      .select('*')
      .in('id', [...byPeer.keys()]);
    if (pErr) throw new Error(pErr.message);
    const conversations: Conversation[] = [];
    for (const [peerId, msgs] of byPeer) {
      const peer = ((peers ?? []) as Profile[]).find((p) => p.id === peerId);
      if (!peer) continue;
      conversations.push({
        peer,
        last_message: msgs[msgs.length - 1],
        unread: msgs.filter((m) => m.recipient_id === userId && !m.read_at).length,
      });
    }
    return conversations.sort((a, b) =>
      a.last_message.created_at < b.last_message.created_at ? 1 : -1
    );
  },

  async listMessages(userId, peerId) {
    const sb = supabase();
    const { data, error } = await sb
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`
      )
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    // Opening the thread marks the peer's messages as read.
    const { error: rErr } = await sb
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('sender_id', peerId)
      .is('read_at', null);
    if (rErr) throw new Error(rErr.message);
    return (data ?? []) as DirectMessage[];
  },

  async sendMessage(senderId, recipientId, text, imageUrl = null) {
    const body = text.trim();
    if (!body && !imageUrl) throw new Error('Write a message or attach a photo first.');
    const sb = supabase();
    const [{ data, error }, { data: sender }] = await Promise.all([
      sb.from('direct_messages')
        .insert({ sender_id: senderId, recipient_id: recipientId, text: body, image_url: imageUrl ?? null })
        .select('*')
        .single(),
      sb.from('profiles').select('display_name').eq('id', senderId).single(),
    ]);
    if (error) {
      // RLS refuses inserts outside a mutual follow — translate to a human line.
      throw new Error(
        error.message.includes('policy')
          ? 'You can only message people who follow you back.'
          : error.message
      );
    }
    const name = (sender as { display_name?: string } | null)?.display_name ?? 'Someone';
    notifyInApp(recipientId, 'message', senderId);
    notify(recipientId, name, body || 'Sent a photo', { type: 'message', user_id: senderId });
    return data as DirectMessage;
  },

  async unreadMessageCount(userId) {
    const { count, error } = await supabase()
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async listMessageablePeople(userId) {
    const sb = supabase();
    const [{ data: iFollow, error: e1 }, { data: followMe, error: e2 }] = await Promise.all([
      sb.from('follows').select('followee_id').eq('follower_id', userId).eq('status', 'accepted'),
      sb.from('follows').select('follower_id').eq('followee_id', userId).eq('status', 'accepted'),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    const mine = new Set(((iFollow ?? []) as { followee_id: string }[]).map((r) => r.followee_id));
    const blocked = await blockedIdSet(userId);
    const mutual = ((followMe ?? []) as { follower_id: string }[])
      .map((r) => r.follower_id)
      .filter((id) => mine.has(id) && !blocked.has(id));
    if (mutual.length === 0) return [];
    const { data: people, error: e3 } = await sb.from('profiles').select('*').in('id', mutual);
    if (e3) throw new Error(e3.message);
    return ((people ?? []) as Profile[]).sort((a, b) =>
      a.display_name.localeCompare(b.display_name)
    );
  },

  // ---- feedback -----------------------------------------------------------
  async submitFeedback(draft, userId) {
    const body = draft.text.trim();
    if (!body) throw new Error('Write your feedback first.');
    const { error } = await supabase().from('feedback').insert({
      kind: draft.kind,
      subject_id: draft.subject_id ?? null,
      subject_name: draft.subject_name ?? null,
      text: body,
      sender_id: userId ?? null,
    });
    if (error) throw new Error(error.message);
  },

  async listFeedback() {
    const { data, error } = await supabase()
      .from('feedback')
      .select('*, sender:profiles!feedback_sender_id_fkey(display_name)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => {
      const row = r as unknown as Feedback & { sender?: { display_name?: string } | null };
      return {
        id: row.id,
        kind: row.kind,
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        text: row.text,
        sender_id: row.sender_id,
        sender_name: row.sender?.display_name ?? null,
        created_at: row.created_at,
        status: row.status,
      };
    });
  },

  async setFeedbackStatus(id, status) {
    const { error } = await supabase().from('feedback').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ---- blocking -------------------------------------------------------------
  async blockUser(_blockerId, blockedId) {
    // block_user() reads auth.uid() server-side and also drops any existing
    // follow in either direction — see migration 0018.
    const { error } = await supabase().rpc('block_user', { target: blockedId });
    if (error) throw new Error(error.message);
  },

  async unblockUser(blockerId, blockedId) {
    const { error } = await supabase()
      .from('blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);
    if (error) throw new Error(error.message);
  },

  async listBlocked(userId) {
    const { data, error } = await supabase()
      .from('blocks')
      .select('blocked:profiles!blocks_blocked_id_fkey(*)')
      .eq('blocker_id', userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => (r as unknown as { blocked: Profile }).blocked);
  },

  // ---- account deletion (App Store 5.1.1(v)) ---------------------------------
  async deleteOwnAccount(_userId) {
    const { error } = await supabase().rpc('delete_own_account');
    if (error) throw new Error(error.message);
    await supabase().auth.signOut();
  },

  // ---- push notifications ----------------------------------------------------
  async registerPushToken(userId, token) {
    const { error } = await supabase()
      .from('push_tokens')
      .upsert({ user_id: userId, token }, { onConflict: 'user_id,token' });
    if (error) throw new Error(error.message);
  },

  async unregisterPushToken(userId, token) {
    const { error } = await supabase()
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);
    if (error) throw new Error(error.message);
  },

  // ---- in-app notification center ------------------------------------------
  async listNotifications(userId) {
    const { data, error } = await supabase()
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(display_name), exhibition:exhibitions(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => {
      const row = r as unknown as {
        id: string; user_id: string; kind: NotificationKind; actor_id: string | null;
        exhibition_id: string | null; post_user_id: string | null; comment_id: string | null;
        created_at: string; read_at: string | null;
        actor?: { display_name?: string } | null; exhibition?: { title?: string } | null;
      };
      return {
        id: row.id,
        user_id: row.user_id,
        kind: row.kind,
        actor_id: row.actor_id,
        actor_name: row.actor?.display_name ?? 'Someone',
        exhibition_id: row.exhibition_id,
        exhibition_title: row.exhibition?.title ?? null,
        post_user_id: row.post_user_id,
        comment_id: row.comment_id,
        created_at: row.created_at,
        read_at: row.read_at,
      } as Notification;
    });
  },

  async unreadNotificationCount(userId) {
    const { count, error } = await supabase()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async markNotificationsRead(userId) {
    const { error } = await supabase()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) throw new Error(error.message);
  },

  async uploadImage(localUri) {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Web: the picker hands back a blob:/data: uri — read it as a Blob.
    if (localUri.startsWith('blob:') || localUri.startsWith('data:')) {
      const blob = await (await fetch(localUri)).blob();
      const mime = blob.type || 'image/jpeg';
      const ext = mime.includes('png')
        ? 'png'
        : mime.includes('webp')
          ? 'webp'
          : mime.includes('mp4')
            ? 'mp4'
            : mime.includes('quicktime')
              ? 'mov'
              : 'jpg';
      const path = `submissions/${stamp}.${ext}`;
      const { error } = await supabase()
        .storage.from('exhibition-images')
        .upload(path, blob, { contentType: mime });
      if (error) throw new Error(error.message);
      const { data } = supabase().storage.from('exhibition-images').getPublicUrl(path);
      return data.publicUrl;
    }

    // Native: read the file from disk as base64.
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType =
      ext === 'png'
        ? 'image/png'
        : ext === 'mp4' || ext === 'm4v'
          ? 'video/mp4'
          : ext === 'mov'
            ? 'video/quicktime'
            : 'image/jpeg';
    const path = `submissions/${stamp}.${ext}`;
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
    const { error } = await supabase()
      .storage.from('exhibition-images')
      .upload(path, decode(base64), { contentType });
    if (error) throw new Error(error.message);
    const { data } = supabase().storage.from('exhibition-images').getPublicUrl(path);
    return data.publicUrl;
  },
};
