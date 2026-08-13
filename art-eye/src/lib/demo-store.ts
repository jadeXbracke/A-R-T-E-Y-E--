// Local demo backend. Active when no Supabase env vars are configured —
// full app flows (auth, curation, submissions, admin approval) work against
// an AsyncStorage-persisted store seeded with the July 2026 Sydney agenda.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api, SignUpInput } from './api-types';
import { SEED_EXHIBITIONS, SEED_VENUES } from './seed';
import {
  Block,
  Comment,
  Conversation,
  CuratedList,
  DirectMessage,
  Feedback,
  Exhibition,
  ExhibitionDraft,
  FeedItem,
  Follow,
  FollowState,
  Like,
  Profile,
  PublicProfile,
  RejectionReason,
  Venue,
  VenueDraft,
  VenueProposal,
  Visit,
  WatchlistEntry,
} from './types';

// Editors' pick list over real current shows. In live mode these come from the
// public guides tables (migration 0007).
const SEED_CURATED: CuratedList[] = [
  {
    id: 'g-editors',
    title: 'Five shows to see this week',
    curator_name: 'ART EYE Editors',
    curator_role: 'curator',
    intro: 'The week distilled — the rooms worth crossing the city for right now.',
    exhibition_ids: ['e-black-myth', 'e-archibald', 'e-salon-des-refuses', 'e-tamara-dean', 'e-primavera'],
  },
];
import { todayStr } from './dates';
import { mapsSearchUrl } from './maps';

interface DemoUser extends Profile {
  password: string;
}

interface DemoState {
  users: DemoUser[];
  venues: Venue[];
  exhibitions: Exhibition[];
  watchlist: WatchlistEntry[];
  visits: Visit[];
  follows: Follow[];
  likes: Like[];
  comments: Comment[];
  messages: DirectMessage[];
  feedback: Feedback[];
  blocks: Block[];
  pushTokens: { user_id: string; token: string }[];
  proposals: VenueProposal[];
  sessionUserId: string | null;
}

// Bump the suffix when the seed changes — installed devices then reload it.
const KEY = 'arteye.demo.v19';

// No sample/test data in the seed — the inbox fills from the live pipeline.
const SEED_PROPOSALS: VenueProposal[] = [];

function seedState(): DemoState {
  const venues = SEED_VENUES.map((v) => ({
    ...v,
    google_maps_url: v.google_maps_url ?? mapsSearchUrl(v),
  }));
  const roslyn = venues.find((v) => v.id === 'v-roslynoxley9')!;
  roslyn.owner_user_id = 'u-venue';
  return {
    users: [
      {
        id: 'u-admin',
        email: 'jadebrack@gmail.com',
        password: 'arteye',
        role: 'admin',
        profile_type: 'enthusiast',
        display_name: 'Jade Bracke',
        city: 'Sydney',
      },
      {
        id: 'u-venue',
        email: 'gallery@arteye.demo',
        password: 'arteye',
        role: 'venue_owner',
        profile_type: 'gallery_professional',
        display_name: 'Roslyn Oxley9',
        city: 'Sydney',
      },
    ],
    venues,
    exhibitions: SEED_EXHIBITIONS.map((e) => ({ ...e })),
    // No seeded social activity — the feed fills as real users sign up, follow
    // each other and log visits. Nothing here is invented.
    watchlist: [],
    visits: [],
    follows: [],
    likes: [],
    comments: [],
    messages: [],
    feedback: [],
    blocks: [],
    pushTokens: [],
    proposals: SEED_PROPOSALS.map((p) => ({ ...p })),
    sessionUserId: null,
  };
}

let cache: DemoState | null = null;

async function load(): Promise<DemoState> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DemoState;
      // Stores persisted before newer features lack these arrays.
      cache.messages = cache.messages ?? [];
      cache.feedback = cache.feedback ?? [];
      cache.blocks = cache.blocks ?? [];
      cache.pushTokens = cache.pushTokens ?? [];
      return cache;
    }
  } catch {
    // fall through to a fresh seed
  }
  cache = seedState();
  await persist();
  return cache;
}

async function persist(): Promise<void> {
  if (cache) await AsyncStorage.setItem(KEY, JSON.stringify(cache));
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function stripUser(u: DemoUser): Profile {
  const { password: _pw, ...profile } = u;
  return profile;
}

function withVenue(e: Exhibition, venues: Venue[]): Exhibition {
  return { ...e, venue: venues.find((v) => v.id === e.venue_id) };
}

// A block in either direction hides both people from each other everywhere.
function isBlocked(s: DemoState, a: string, b: string): boolean {
  return s.blocks.some(
    (x) => (x.blocker_id === a && x.blocked_id === b) || (x.blocker_id === b && x.blocked_id === a)
  );
}

// Messaging is allowed only between mutual follows: both directions accepted.
function followsEachOther(s: DemoState, a: string, b: string): boolean {
  const oneWay = (from: string, to: string) =>
    s.follows.some((f) => f.follower_id === from && f.followee_id === to && f.status === 'accepted');
  return oneWay(a, b) && oneWay(b, a);
}

// The viewer's relationship to a target user, from the follow graph.
function followStateFor(s: DemoState, viewerId: string | null, targetId: string): FollowState {
  if (!viewerId || viewerId === targetId) return 'none';
  const f = s.follows.find((x) => x.follower_id === viewerId && x.followee_id === targetId);
  if (!f) return 'none';
  return f.status === 'accepted' ? 'following' : 'requested';
}

// Turn a Visit into a feed item by joining the actor, exhibition, venue and
// this post's like/comment reactions (from the viewer's perspective).
function feedItemFrom(s: DemoState, v: Visit, viewerId: string | null): FeedItem | null {
  const user = s.users.find((u) => u.id === v.user_id);
  const ex = s.exhibitions.find((e) => e.id === v.exhibition_id);
  if (!user || !ex) return null;
  const venue = s.venues.find((vn) => vn.id === ex.venue_id);
  const postLikes = s.likes.filter(
    (l) => l.post_user_id === v.user_id && l.exhibition_id === v.exhibition_id
  );
  return {
    id: `${v.user_id}:${v.exhibition_id}`,
    user_id: v.user_id,
    display_name: user.display_name,
    exhibition_id: ex.id,
    exhibition_title: ex.title,
    venue_name: venue?.name ?? null,
    rating: v.rating,
    reflection: v.reflection,
    visit_date: v.visit_date,
    video_url: v.video_url ?? null,
    like_count: postLikes.length,
    liked_by_me: !!viewerId && postLikes.some((l) => l.user_id === viewerId),
    comment_count: s.comments.filter(
      (c) => c.post_user_id === v.user_id && c.exhibition_id === v.exhibition_id
    ).length,
  };
}

export const demoApi: Api = {
  async getSessionProfile() {
    const s = await load();
    const u = s.users.find((x) => x.id === s.sessionUserId);
    return u ? stripUser(u) : null;
  },

  async signIn(email, password) {
    const s = await load();
    const u = s.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.password !== password) throw new Error('Email or password not recognised.');
    s.sessionUserId = u.id;
    await persist();
    return stripUser(u);
  },

  async signUp(input: SignUpInput) {
    const s = await load();
    const email = input.email.trim().toLowerCase();
    if (s.users.some((x) => x.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists.');
    }
    const user: DemoUser = {
      id: uid('u'),
      email,
      password: input.password,
      role: input.role,
      profile_type: input.profile_type,
      display_name: input.display_name.trim(),
      city: 'Sydney',
    };
    s.users.push(user);
    if (input.role === 'venue_owner' && input.venue) {
      s.venues.push({
        id: uid('v'),
        name: input.venue.name.trim(),
        type: input.venue.type,
        address: input.venue.address.trim() || null,
        city: 'Sydney',
        owner_user_id: user.id,
      });
    }
    s.sessionUserId = user.id;
    await persist();
    return stripUser(user);
  },

  async signOut() {
    const s = await load();
    s.sessionUserId = null;
    await persist();
  },

  async listApprovedExhibitions() {
    const s = await load();
    const fixtureVenues = new Set(s.venues.filter((v) => v.is_fixture).map((v) => v.id));
    const t = todayStr();
    return s.exhibitions
      .filter((e) => e.status === 'approved' && !e.is_fixture && !fixtureVenues.has(e.venue_id))
      .filter((e) => (e.end_date ?? '9999') >= t) // finished shows drop out
      .map((e) => withVenue(e, s.venues));
  },

  async getExhibition(id) {
    const s = await load();
    const e = s.exhibitions.find((x) => x.id === id);
    return e ? withVenue(e, s.venues) : null;
  },

  async listCuratedLists() {
    return SEED_CURATED.map((g) => ({ ...g }));
  },

  async listWatchlist(userId) {
    const s = await load();
    return s.watchlist.filter((w) => w.user_id === userId).map((w) => w.exhibition_id);
  },

  async addToWatchlist(userId, exhibitionId) {
    const s = await load();
    if (!s.watchlist.some((w) => w.user_id === userId && w.exhibition_id === exhibitionId)) {
      s.watchlist.push({ user_id: userId, exhibition_id: exhibitionId, created_at: new Date().toISOString() });
      await persist();
    }
  },

  async removeFromWatchlist(userId, exhibitionId) {
    const s = await load();
    s.watchlist = s.watchlist.filter((w) => !(w.user_id === userId && w.exhibition_id === exhibitionId));
    await persist();
  },

  async listVisits(userId) {
    const s = await load();
    return s.visits
      .filter((v) => v.user_id === userId)
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1));
  },

  async saveVisit(visit) {
    const s = await load();
    s.visits = s.visits.filter(
      (v) => !(v.user_id === visit.user_id && v.exhibition_id === visit.exhibition_id)
    );
    s.visits.push(visit);
    // seeing an exhibition retires it from the watchlist
    s.watchlist = s.watchlist.filter(
      (w) => !(w.user_id === visit.user_id && w.exhibition_id === visit.exhibition_id)
    );
    await persist();
  },

  // ---- social layer -------------------------------------------------------
  async getPublicProfile(userId, viewerId) {
    const s = await load();
    const u = s.users.find((x) => x.id === userId);
    if (!u) throw new Error('Profile not found.');
    const state = followStateFor(s, viewerId, userId);
    const isOwn = viewerId === userId;
    const blocked = !!viewerId && isBlocked(s, viewerId, userId);
    return {
      ...stripUser(u),
      followers: s.follows.filter((f) => f.followee_id === userId && f.status === 'accepted').length,
      following: s.follows.filter((f) => f.follower_id === userId && f.status === 'accepted').length,
      visit_count: s.visits.filter((v) => v.user_id === userId).length,
      follow_state: state,
      can_view_activity: !blocked && (isOwn || !u.is_private || state === 'following'),
      blocked_by_me: !!viewerId && s.blocks.some((b) => b.blocker_id === viewerId && b.blocked_id === userId),
    } as PublicProfile;
  },

  async followUser(viewerId, targetId) {
    const s = await load();
    if (viewerId === targetId) return 'none';
    const target = s.users.find((x) => x.id === targetId);
    if (!target) throw new Error('Profile not found.');
    const existing = s.follows.find(
      (f) => f.follower_id === viewerId && f.followee_id === targetId
    );
    if (existing) return existing.status === 'accepted' ? 'following' : 'requested';
    // Private profiles gate on approval; public profiles follow immediately.
    const status: Follow['status'] = target.is_private ? 'pending' : 'accepted';
    s.follows.push({
      follower_id: viewerId,
      followee_id: targetId,
      status,
      created_at: new Date().toISOString(),
    });
    await persist();
    return status === 'accepted' ? 'following' : 'requested';
  },

  async unfollowUser(viewerId, targetId) {
    const s = await load();
    s.follows = s.follows.filter(
      (f) => !(f.follower_id === viewerId && f.followee_id === targetId)
    );
    await persist();
  },

  async listFollowers(userId) {
    const s = await load();
    const ids = s.follows
      .filter((f) => f.followee_id === userId && f.status === 'accepted')
      .map((f) => f.follower_id);
    return s.users.filter((u) => ids.includes(u.id)).map(stripUser);
  },

  async listFollowing(userId) {
    const s = await load();
    const ids = s.follows
      .filter((f) => f.follower_id === userId && f.status === 'accepted')
      .map((f) => f.followee_id);
    return s.users.filter((u) => ids.includes(u.id)).map(stripUser);
  },

  async listFollowRequests(userId) {
    const s = await load();
    const ids = s.follows
      .filter((f) => f.followee_id === userId && f.status === 'pending')
      .map((f) => f.follower_id);
    return s.users.filter((u) => ids.includes(u.id)).map(stripUser);
  },

  async respondFollowRequest(userId, requesterId, accept) {
    const s = await load();
    const f = s.follows.find(
      (x) => x.follower_id === requesterId && x.followee_id === userId && x.status === 'pending'
    );
    if (!f) return;
    if (accept) f.status = 'accepted';
    else s.follows = s.follows.filter((x) => x !== f);
    await persist();
  },

  async setProfilePrivacy(userId, isPrivate) {
    const s = await load();
    const u = s.users.find((x) => x.id === userId);
    if (!u) throw new Error('Profile not found.');
    u.is_private = isPrivate;
    await persist();
  },

  async updateOwnProfile(userId, patch) {
    const s = await load();
    const u = s.users.find((x) => x.id === userId);
    if (!u) throw new Error('Profile not found.');
    Object.assign(u, patch);
    await persist();
  },

  async discoverPeople(viewerId) {
    const s = await load();
    // everyone the viewer isn't already connected to, excluding themselves
    const connected = new Set(
      s.follows.filter((f) => f.follower_id === viewerId).map((f) => f.followee_id)
    );
    return s.users
      .filter(
        (u) =>
          u.id !== viewerId &&
          !connected.has(u.id) &&
          u.role !== 'admin' &&
          !isBlocked(s, viewerId, u.id)
      )
      .map(stripUser);
  },

  async searchPeople(viewerId) {
    const s = await load();
    return s.users
      .filter((u) => u.id !== viewerId && u.role !== 'admin' && !isBlocked(s, viewerId, u.id))
      .map(stripUser);
  },

  async friendsFeed(viewerId) {
    const s = await load();
    const following = new Set(
      s.follows
        .filter((f) => f.follower_id === viewerId && f.status === 'accepted')
        .map((f) => f.followee_id)
    );
    return s.visits
      .filter((v) => following.has(v.user_id) && !isBlocked(s, viewerId, v.user_id))
      .map((v) => feedItemFrom(s, v, viewerId))
      .filter((x): x is FeedItem => x !== null)
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1));
  },

  async discoverFeed(viewerId) {
    const s = await load();
    const publicIds = new Set(
      s.users.filter((u) => !u.is_private && u.role !== 'admin').map((u) => u.id)
    );
    return s.visits
      .filter((v) => publicIds.has(v.user_id) && !isBlocked(s, viewerId, v.user_id))
      .map((v) => feedItemFrom(s, v, viewerId))
      .filter((x): x is FeedItem => x !== null)
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1));
  },

  async userActivity(userId, viewerId) {
    const s = await load();
    const u = s.users.find((x) => x.id === userId);
    if (!u) return [];
    const state = followStateFor(s, viewerId, userId);
    const blocked = !!viewerId && isBlocked(s, viewerId, userId);
    const canView = !blocked && (viewerId === userId || !u.is_private || state === 'following');
    if (!canView) return [];
    return s.visits
      .filter((v) => v.user_id === userId)
      .map((v) => feedItemFrom(s, v, viewerId))
      .filter((x): x is FeedItem => x !== null)
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1));
  },

  async getPost(postUserId, exhibitionId, viewerId) {
    const s = await load();
    const v = s.visits.find(
      (x) => x.user_id === postUserId && x.exhibition_id === exhibitionId
    );
    return v ? feedItemFrom(s, v, viewerId) : null;
  },

  async likePost(likerId, postUserId, exhibitionId) {
    const s = await load();
    const exists = s.likes.some(
      (l) => l.user_id === likerId && l.post_user_id === postUserId && l.exhibition_id === exhibitionId
    );
    if (!exists) {
      s.likes.push({ user_id: likerId, post_user_id: postUserId, exhibition_id: exhibitionId, created_at: new Date().toISOString() });
      await persist();
    }
  },

  async unlikePost(likerId, postUserId, exhibitionId) {
    const s = await load();
    s.likes = s.likes.filter(
      (l) => !(l.user_id === likerId && l.post_user_id === postUserId && l.exhibition_id === exhibitionId)
    );
    await persist();
  },

  async listComments(postUserId, exhibitionId) {
    const s = await load();
    return s.comments
      .filter((c) => c.post_user_id === postUserId && c.exhibition_id === exhibitionId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  },

  async addComment(authorId, postUserId, exhibitionId, text) {
    const s = await load();
    const author = s.users.find((u) => u.id === authorId);
    const comment: Comment = {
      id: uid('c'),
      post_user_id: postUserId,
      exhibition_id: exhibitionId,
      author_id: authorId,
      author_name: author?.display_name ?? 'Someone',
      text: text.trim(),
      created_at: new Date().toISOString(),
    };
    s.comments.push(comment);
    await persist();
    return comment;
  },

  // ---- direct messages ----------------------------------------------------
  async canMessage(viewerId, targetId) {
    if (!viewerId || viewerId === targetId) return false;
    const s = await load();
    return followsEachOther(s, viewerId, targetId) && !isBlocked(s, viewerId, targetId);
  },

  async listConversations(userId) {
    const s = await load();
    const byPeer = new Map<string, DirectMessage[]>();
    for (const m of s.messages) {
      const peerId =
        m.sender_id === userId ? m.recipient_id : m.recipient_id === userId ? m.sender_id : null;
      if (!peerId) continue;
      const list = byPeer.get(peerId) ?? [];
      list.push(m);
      byPeer.set(peerId, list);
    }
    const conversations: Conversation[] = [];
    for (const [peerId, msgs] of byPeer) {
      const peer = s.users.find((u) => u.id === peerId);
      if (!peer || isBlocked(s, userId, peerId)) continue;
      msgs.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      conversations.push({
        peer: stripUser(peer),
        last_message: msgs[msgs.length - 1],
        unread: msgs.filter((m) => m.recipient_id === userId && !m.read_at).length,
      });
    }
    return conversations.sort((a, b) =>
      a.last_message.created_at < b.last_message.created_at ? 1 : -1
    );
  },

  async listMessages(userId, peerId) {
    const s = await load();
    if (isBlocked(s, userId, peerId)) return [];
    const thread = s.messages
      .filter(
        (m) =>
          (m.sender_id === userId && m.recipient_id === peerId) ||
          (m.sender_id === peerId && m.recipient_id === userId)
      )
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    // Opening the thread marks the peer's messages as read.
    let touched = false;
    for (const m of thread) {
      if (m.recipient_id === userId && !m.read_at) {
        m.read_at = new Date().toISOString();
        touched = true;
      }
    }
    if (touched) await persist();
    return thread.map((m) => ({ ...m }));
  },

  async sendMessage(senderId, recipientId, text) {
    const s = await load();
    const body = text.trim();
    if (!body) throw new Error('Write a message first.');
    if (!followsEachOther(s, senderId, recipientId) || isBlocked(s, senderId, recipientId)) {
      throw new Error('You can only message people who follow you back.');
    }
    const message: DirectMessage = {
      id: uid('m'),
      sender_id: senderId,
      recipient_id: recipientId,
      text: body,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    s.messages.push(message);
    await persist();
    return { ...message };
  },

  async unreadMessageCount(userId) {
    const s = await load();
    return s.messages.filter((m) => m.recipient_id === userId && !m.read_at).length;
  },

  async listMessageablePeople(userId) {
    const s = await load();
    return s.users
      .filter(
        (u) => u.id !== userId && followsEachOther(s, userId, u.id) && !isBlocked(s, userId, u.id)
      )
      .map(stripUser)
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  },

  // ---- feedback -----------------------------------------------------------
  async submitFeedback(draft, userId) {
    const s = await load();
    const body = draft.text.trim();
    if (!body) throw new Error('Write your feedback first.');
    const sender = userId ? s.users.find((u) => u.id === userId) : undefined;
    s.feedback.push({
      id: uid('fb'),
      kind: draft.kind,
      subject_id: draft.subject_id ?? null,
      subject_name: draft.subject_name ?? null,
      text: body,
      sender_id: sender?.id ?? null,
      sender_name: sender?.display_name ?? null,
      created_at: new Date().toISOString(),
      status: 'new',
    });
    await persist();
  },

  async listFeedback() {
    const s = await load();
    return [...s.feedback]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((f) => ({ ...f }));
  },

  async setFeedbackStatus(id, status) {
    const s = await load();
    const f = s.feedback.find((x) => x.id === id);
    if (!f) throw new Error('Feedback not found.');
    f.status = status;
    await persist();
  },

  // ---- blocking ------------------------------------------------------------
  async blockUser(blockerId, blockedId) {
    const s = await load();
    if (blockerId === blockedId) return;
    if (!s.blocks.some((b) => b.blocker_id === blockerId && b.blocked_id === blockedId)) {
      s.blocks.push({ blocker_id: blockerId, blocked_id: blockedId, created_at: new Date().toISOString() });
    }
    // A block ends any existing follow relationship in either direction.
    s.follows = s.follows.filter(
      (f) =>
        !((f.follower_id === blockerId && f.followee_id === blockedId) ||
          (f.follower_id === blockedId && f.followee_id === blockerId))
    );
    await persist();
  },

  async unblockUser(blockerId, blockedId) {
    const s = await load();
    s.blocks = s.blocks.filter(
      (b) => !(b.blocker_id === blockerId && b.blocked_id === blockedId)
    );
    await persist();
  },

  async listBlocked(userId) {
    const s = await load();
    const ids = s.blocks.filter((b) => b.blocker_id === userId).map((b) => b.blocked_id);
    return s.users.filter((u) => ids.includes(u.id)).map(stripUser);
  },

  // ---- account deletion (App Store 5.1.1(v)) -------------------------------
  async deleteOwnAccount(userId) {
    const s = await load();
    s.users = s.users.filter((u) => u.id !== userId);
    s.watchlist = s.watchlist.filter((w) => w.user_id !== userId);
    s.visits = s.visits.filter((v) => v.user_id !== userId);
    s.follows = s.follows.filter((f) => f.follower_id !== userId && f.followee_id !== userId);
    s.likes = s.likes.filter((l) => l.user_id !== userId && l.post_user_id !== userId);
    s.comments = s.comments.filter((c) => c.author_id !== userId && c.post_user_id !== userId);
    s.messages = s.messages.filter((m) => m.sender_id !== userId && m.recipient_id !== userId);
    s.blocks = s.blocks.filter((b) => b.blocker_id !== userId && b.blocked_id !== userId);
    s.pushTokens = s.pushTokens.filter((t) => t.user_id !== userId);
    // Feedback the account sent is kept (matches the live-mode behaviour,
    // where sender_id is set null rather than the row deleted) but anonymised.
    for (const f of s.feedback) {
      if (f.sender_id === userId) {
        f.sender_id = null;
        f.sender_name = null;
      }
    }
    // Venues this account owned become unclaimed rather than orphaned.
    for (const v of s.venues) {
      if (v.owner_user_id === userId) v.owner_user_id = null;
    }
    if (s.sessionUserId === userId) s.sessionUserId = null;
    await persist();
  },

  // ---- push notifications ---------------------------------------------------
  // Demo mode has no server to trigger a real push from, but registration is
  // still exercised so the permission flow and UI can be tried end to end.
  async registerPushToken(userId, token) {
    const s = await load();
    if (!s.pushTokens.some((t) => t.user_id === userId && t.token === token)) {
      s.pushTokens.push({ user_id: userId, token });
      await persist();
    }
  },

  async unregisterPushToken(userId, token) {
    const s = await load();
    s.pushTokens = s.pushTokens.filter((t) => !(t.user_id === userId && t.token === token));
    await persist();
  },

  async submitExhibition(draft: ExhibitionDraft, userId) {
    const s = await load();
    let venue = s.venues.find(
      (v) => v.name.trim().toLowerCase() === draft.venue_name.trim().toLowerCase()
    );
    if (!venue) {
      venue = {
        id: uid('v'),
        name: draft.venue_name.trim(),
        type: draft.venue_type,
        address: draft.venue_address.trim() || null,
        city: 'Sydney',
        owner_user_id: null,
      };
      s.venues.push(venue);
    }
    s.exhibitions.push({
      id: uid('e'),
      venue_id: venue.id,
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
      rejection_reason: null,
      is_featured: false,
      city: 'Sydney',
    });
    await persist();
  },

  async myVenue(userId) {
    const s = await load();
    return s.venues.find((v) => v.owner_user_id === userId) ?? null;
  },

  async listMySubmissions(userId) {
    const s = await load();
    const mine = s.venues.filter((v) => v.owner_user_id === userId).map((v) => v.id);
    return s.exhibitions
      .filter((e) => mine.includes(e.venue_id))
      .map((e) => withVenue(e, s.venues))
      .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  },

  async updateSubmission(id, patch, userId) {
    const s = await load();
    const e = s.exhibitions.find((x) => x.id === id);
    if (!e) throw new Error('Submission not found.');
    const venue = s.venues.find((v) => v.id === e.venue_id);
    if (venue?.owner_user_id !== userId) throw new Error('You can only edit your own submissions.');
    Object.assign(e, patch, { status: 'pending', rejection_reason: null }); // edits re-enter review
    await persist();
  },

  async listPending() {
    const s = await load();
    return s.exhibitions
      .filter((e) => e.status === 'pending')
      .map((e) => withVenue(e, s.venues));
  },

  async adminUpdateExhibition(id, patch) {
    const s = await load();
    const e = s.exhibitions.find((x) => x.id === id);
    if (!e) throw new Error('Exhibition not found.');
    Object.assign(e, patch);
    await persist();
  },

  async approveExhibition(id) {
    await demoApi.adminUpdateExhibition(id, { status: 'approved', rejection_reason: null });
  },

  async rejectExhibition(id, reason: RejectionReason) {
    await demoApi.adminUpdateExhibition(id, { status: 'rejected', rejection_reason: reason });
  },

  // ---- host control (admin only) -------------------------------------------
  async listVenues() {
    const s = await load();
    return [...s.venues].sort((a, b) => a.name.localeCompare(b.name));
  },

  async createVenue(input: VenueDraft) {
    const s = await load();
    const venue: Venue = {
      id: uid('v'),
      name: input.name.trim(),
      type: input.type,
      address: input.address?.trim() || null,
      suburb: input.suburb?.trim() || null,
      website: input.website?.trim() || null,
      instagram: input.instagram?.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      city: 'Sydney',
      owner_user_id: null,
      is_claimed: false,
      is_fixture: input.is_fixture ?? false,
      image_url: input.image_url ?? null,
      video_url: input.video_url ?? null,
        reel_url: input.reel_url ?? null,
    };
    s.venues.push(venue);
    await persist();
    return venue;
  },

  async updateVenue(id, patch) {
    const s = await load();
    const venue = s.venues.find((v) => v.id === id);
    if (!venue) throw new Error('Venue not found.');
    Object.assign(venue, patch);
    await persist();
  },

  async deleteVenue(id) {
    const s = await load();
    s.venues = s.venues.filter((v) => v.id !== id);
    // mirror the DB cascade: a venue's exhibitions go with it
    s.exhibitions = s.exhibitions.filter((e) => e.venue_id !== id);
    await persist();
  },

  async listAllExhibitions() {
    const s = await load();
    return s.exhibitions
      .map((e) => withVenue(e, s.venues))
      .sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  },

  async adminCreateExhibition(draft: ExhibitionDraft) {
    const s = await load();
    let venue = s.venues.find(
      (v) => v.name.trim().toLowerCase() === draft.venue_name.trim().toLowerCase()
    );
    if (!venue) {
      venue = {
        id: uid('v'),
        name: draft.venue_name.trim(),
        type: draft.venue_type,
        address: draft.venue_address.trim() || null,
        city: 'Sydney',
        owner_user_id: null,
      };
      s.venues.push(venue);
    }
    s.exhibitions.push({
      id: uid('e'),
      venue_id: venue.id,
      title: draft.title.trim(),
      artists: draft.artists.trim(),
      start_date: draft.start_date,
      end_date: draft.end_date,
      opening_datetime: draft.opening_datetime,
      description: draft.description.trim(),
      image_url: draft.image_url,
      video_url: draft.video_url ?? null,
      reel_url: draft.reel_url ?? null,
      status: 'approved', // the host publishes directly
      rejection_reason: null,
      is_featured: false,
      city: 'Sydney',
    });
    await persist();
  },

  async deleteExhibition(id) {
    const s = await load();
    s.exhibitions = s.exhibitions.filter((e) => e.id !== id);
    s.watchlist = s.watchlist.filter((w) => w.exhibition_id !== id);
    s.visits = s.visits.filter((v) => v.exhibition_id !== id);
    await persist();
  },

  // ---- owner inbox ---------------------------------------------------------
  async listProposals() {
    const s = await load();
    return (s.proposals ?? [])
      .filter((p) => p.status === 'pending')
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  },

  async approveProposal(proposal, payload) {
    const s = await load();
    const p = s.proposals.find((x) => x.id === proposal.id);
    if (!p) throw new Error('Proposal not found.');
    if (p.action_type === 'add') {
      const slug = String(payload.slug ?? uid('venue'));
      s.venues.push({
        id: `v-${slug}`,
        name: String(payload.name ?? 'Untitled venue'),
        slug,
        type: (payload.type as Venue['type']) ?? 'gallery',
        address: (payload.address as string) ?? null,
        suburb: (payload.suburb as string) ?? null,
        website: (payload.website as string) ?? null,
        instagram: (payload.instagram as string) ?? null,
        latitude: (payload.latitude as number) ?? null,
        longitude: (payload.longitude as number) ?? null,
        city: 'Sydney',
        owner_user_id: null,
        is_claimed: false,
        is_fixture: false,
        image_url: null,
      });
    } else if (p.action_type === 'archive') {
      const venue = s.venues.find((v) => v.id === p.venue_id);
      if (venue) venue.is_fixture = true; // demo analog of status='archived'
    } else {
      const venue = s.venues.find((v) => v.id === p.venue_id);
      if (venue) Object.assign(venue, payload);
    }
    p.status = 'approved';
    await persist();
  },

  async rejectProposal(id, note) {
    const s = await load();
    const p = s.proposals.find((x) => x.id === id);
    if (!p) throw new Error('Proposal not found.');
    p.status = 'rejected';
    p.review_note = note.trim() || null;
    await persist();
  },

  // The discovery pipeline only exists in live mode (it runs on Supabase), so
  // the demo shows an empty shows inbox rather than pretending.
  async listExhibitionProposals() {
    return [];
  },
  async approveExhibitionProposal() {
    throw new Error('The shows inbox needs the live database.');
  },
  async rejectExhibitionProposal() {
    throw new Error('The shows inbox needs the live database.');
  },
  async listImageCandidates() {
    return []; // reading venue sites needs the live backend
  },
  async setExhibitionImage(exhibitionId, imageUrl) {
    const s = await load();
    const e = s.exhibitions.find((x) => x.id === exhibitionId);
    if (e) {
      e.image_url = imageUrl;
      await persist();
    }
  },
  async listVenueImageCandidates() {
    return []; // reading venue sites needs the live backend
  },
  async setVenueImage(venueId, imageUrl) {
    const s = await load();
    const v = s.venues.find((x) => x.id === venueId);
    if (v) {
      v.image_url = imageUrl;
      await persist();
    }
  },
  async requestPasswordReset() {
    throw new Error('Password reset needs the live database.');
  },
  async updatePassword() {
    throw new Error('Password reset needs the live database.');
  },

  async uploadImage(localUri) {
    return localUri; // demo mode keeps the local file uri
  },
};

export async function resetDemoStore(): Promise<void> {
  cache = seedState();
  await persist();
}

export { todayStr };
