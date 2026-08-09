// Local demo backend. Active when no Supabase env vars are configured —
// full app flows (auth, curation, submissions, admin approval) work against
// an AsyncStorage-persisted store seeded with the July 2026 Sydney agenda.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api, SignUpInput } from './api-types';
import { SEED_EXHIBITIONS, SEED_VENUES } from './seed';
import {
  ActivityEvent,
  Conversation,
  CuratedList,
  DirectMessage,
  Exhibition,
  ExhibitionDraft,
  FeedItem,
  Follow,
  FollowState,
  PostComment,
  PostEngagement,
  Profile,
  PublicProfile,
  RejectionReason,
  Venue,
  VenueDraft,
  VenueProposal,
  Visit,
  WatchlistEntry,
} from './types';

// Demo curated lists — the demo personas' picks over real current shows.
// In live mode these come from the public guides tables (migration 0007).
const SEED_CURATED: CuratedList[] = [
  {
    id: 'g-editors',
    title: 'Five shows to see this week',
    curator_name: 'ART EYE Editors',
    curator_role: 'curator',
    intro: 'The week distilled — the rooms worth crossing the city for right now.',
    exhibition_ids: ['e-black-myth', 'e-archibald', 'e-salon-des-refuses', 'e-tamara-dean', 'e-primavera'],
  },
  {
    id: 'g-gallerist',
    title: 'A gallerist is watching',
    curator_name: 'Roslyn Oxley9 (demo account)',
    curator_role: 'gallerist',
    intro: 'What the trade goes to see after closing time — sharp painting and one big survey.',
    exhibition_ids: ['e-mitch-cairns', 'e-bartley', 'e-armanious', 'e-nsw-fellowship'],
  },
];
import { todayStr } from './dates';
import { mapsSearchUrl } from './maps';

interface DemoUser extends Profile {
  password: string;
}

// A like on a post (a post = a visit, keyed by its author + exhibition).
interface DemoLike {
  post_user_id: string;
  exhibition_id: string;
  user_id: string;
  created_at: string;
}

// Stored without display_name — joined from users at read time.
type DemoComment = Omit<PostComment, 'display_name'>;

interface DemoBlock {
  blocker_id: string;
  blocked_id: string;
}

interface DemoReport {
  id: string;
  reporter_id: string;
  kind: 'post' | 'comment' | 'profile';
  subject_user_id: string;
  exhibition_id: string | null;
  comment_id: string | null;
  reason: string;
  created_at: string;
}

interface DemoState {
  users: DemoUser[];
  venues: Venue[];
  exhibitions: Exhibition[];
  watchlist: WatchlistEntry[];
  visits: Visit[];
  follows: Follow[];
  likes: DemoLike[];
  comments: DemoComment[];
  messages: DirectMessage[];
  blocks: DemoBlock[];
  reports: DemoReport[];
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
      {
        id: 'u-curator',
        email: 'curator@arteye.demo',
        password: 'arteye',
        role: 'user',
        profile_type: 'enthusiast',
        display_name: 'Sam Curator',
        city: 'Sydney',
        is_private: false,
      },
      {
        id: 'u-mara',
        email: 'mara@arteye.demo',
        password: 'arteye',
        role: 'user',
        profile_type: 'collector',
        display_name: 'Mara Ellison',
        city: 'Sydney',
        is_private: false,
      },
      {
        id: 'u-theo',
        email: 'theo@arteye.demo',
        password: 'arteye',
        role: 'user',
        profile_type: 'artist',
        display_name: 'Theo Nguyen',
        city: 'Sydney',
        is_private: true,
      },
    ],
    venues,
    exhibitions: SEED_EXHIBITIONS.map((e) => ({ ...e })),
    watchlist: [
      { user_id: 'u-curator', exhibition_id: 'e-crothers', created_at: new Date().toISOString() },
    ],
    visits: [
      {
        user_id: 'u-curator',
        exhibition_id: 'e-murakami',
        rating: 5,
        reflection: 'The silver room — I stood there until the guard moved me on.',
        visit_date: '2026-07-04',
      },
      {
        user_id: 'u-curator',
        exhibition_id: 'e-gabori-ledgerwood',
        rating: 4,
        reflection: 'Gabori’s blue holds the whole wall. Ledgerwood hums beside it.',
        visit_date: '2026-07-10',
      },
      {
        user_id: 'u-mara',
        exhibition_id: 'e-archibald',
        rating: 4,
        reflection: 'Went in for one portrait, stayed two hours.',
        visit_date: '2026-07-18',
      },
      {
        user_id: 'u-mara',
        exhibition_id: 'e-primavera',
        rating: 5,
        reflection: 'The most alive room in the city right now.',
        visit_date: '2026-07-20',
      },
      {
        user_id: 'u-theo',
        exhibition_id: 'e-murakami',
        rating: 5,
        reflection: 'Studied the surface for the varnish. Immaculate.',
        visit_date: '2026-07-15',
      },
    ],
    // Follow graph: the admin (Jade) follows Sam and Mara; a pending request
    // sits against Theo's private profile. Sam and Mara follow each other.
    follows: [
      { follower_id: 'u-admin', followee_id: 'u-curator', status: 'accepted', created_at: '2026-07-05T00:00:00.000Z' },
      { follower_id: 'u-admin', followee_id: 'u-mara', status: 'accepted', created_at: '2026-07-06T00:00:00.000Z' },
      { follower_id: 'u-admin', followee_id: 'u-theo', status: 'pending', created_at: '2026-07-19T00:00:00.000Z' },
      { follower_id: 'u-curator', followee_id: 'u-mara', status: 'accepted', created_at: '2026-07-07T00:00:00.000Z' },
      { follower_id: 'u-mara', followee_id: 'u-curator', status: 'accepted', created_at: '2026-07-08T00:00:00.000Z' },
    ],
    // Engagement over the seeded posts, so the feed feels alive on first run.
    likes: [
      { post_user_id: 'u-curator', exhibition_id: 'e-murakami', user_id: 'u-mara', created_at: '2026-07-05T08:30:00.000Z' },
      { post_user_id: 'u-curator', exhibition_id: 'e-murakami', user_id: 'u-theo', created_at: '2026-07-16T11:00:00.000Z' },
      { post_user_id: 'u-mara', exhibition_id: 'e-primavera', user_id: 'u-curator', created_at: '2026-07-21T18:35:00.000Z' },
    ],
    comments: [
      {
        id: 'c-1',
        post_user_id: 'u-curator',
        exhibition_id: 'e-murakami',
        user_id: 'u-mara',
        body: 'That silver room did the same to me — twenty minutes, easily.',
        created_at: '2026-07-05T09:12:00.000Z',
      },
      {
        id: 'c-2',
        post_user_id: 'u-mara',
        exhibition_id: 'e-primavera',
        user_id: 'u-curator',
        body: 'Saving this one for the weekend.',
        created_at: '2026-07-21T18:40:00.000Z',
      },
    ],
    messages: [
      {
        id: 'm-1',
        sender_id: 'u-curator',
        recipient_id: 'u-mara',
        body: 'Are you going to the Primavera opening on Thursday?',
        created_at: '2026-07-19T08:05:00.000Z',
        read_at: '2026-07-19T09:00:00.000Z',
      },
      {
        id: 'm-2',
        sender_id: 'u-mara',
        recipient_id: 'u-curator',
        body: 'Yes — meet at the MCA steps at six?',
        created_at: '2026-07-19T09:02:00.000Z',
        read_at: '2026-07-19T09:30:00.000Z',
      },
      {
        id: 'm-3',
        sender_id: 'u-curator',
        recipient_id: 'u-admin',
        body: 'Did you make it to Murakami yet? The silver room alone is worth it.',
        created_at: '2026-07-22T10:15:00.000Z',
        read_at: null,
      },
    ],
    blocks: [],
    reports: [],
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

// Ids the viewer has blocked — kept out of social reads.
function blockedOf(s: DemoState, viewerId: string | null): Set<string> {
  return new Set(
    (s.blocks ?? []).filter((b) => b.blocker_id === viewerId).map((b) => b.blocked_id)
  );
}

// The viewer's relationship to a target user, from the follow graph.
function followStateFor(s: DemoState, viewerId: string | null, targetId: string): FollowState {
  if (!viewerId || viewerId === targetId) return 'none';
  const f = s.follows.find((x) => x.follower_id === viewerId && x.followee_id === targetId);
  if (!f) return 'none';
  return f.status === 'accepted' ? 'following' : 'requested';
}

// Turn a Visit into a feed item by joining the actor and the exhibition/venue.
function feedItemFrom(s: DemoState, v: Visit): FeedItem | null {
  const user = s.users.find((u) => u.id === v.user_id);
  const ex = s.exhibitions.find((e) => e.id === v.exhibition_id);
  if (!user || !ex) return null;
  const venue = s.venues.find((vn) => vn.id === ex.venue_id);
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
    photo_urls: v.photo_urls ?? [],
    video_url: v.video_url ?? null,
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
    return s.exhibitions
      .filter((e) => e.status === 'approved' && !e.is_fixture && !fixtureVenues.has(e.venue_id))
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
    return {
      ...stripUser(u),
      followers: s.follows.filter((f) => f.followee_id === userId && f.status === 'accepted').length,
      following: s.follows.filter((f) => f.follower_id === userId && f.status === 'accepted').length,
      visit_count: s.visits.filter((v) => v.user_id === userId).length,
      follow_state: state,
      can_view_activity: isOwn || !u.is_private || state === 'following',
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

  async discoverPeople(viewerId) {
    const s = await load();
    // everyone the viewer isn't already connected to, excluding themselves
    const connected = new Set(
      s.follows.filter((f) => f.follower_id === viewerId).map((f) => f.followee_id)
    );
    const blocked = blockedOf(s, viewerId);
    return s.users
      .filter(
        (u) => u.id !== viewerId && !connected.has(u.id) && !blocked.has(u.id) && u.role !== 'admin'
      )
      .map(stripUser);
  },

  async searchPeople(query, viewerId) {
    const s = await load();
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const blocked = blockedOf(s, viewerId);
    return s.users
      .filter(
        (u) =>
          u.id !== viewerId &&
          u.role !== 'admin' &&
          !blocked.has(u.id) &&
          u.display_name.toLowerCase().includes(q)
      )
      .slice(0, 20)
      .map(stripUser);
  },

  async friendsFeed(viewerId) {
    const s = await load();
    const following = new Set(
      s.follows
        .filter((f) => f.follower_id === viewerId && f.status === 'accepted')
        .map((f) => f.followee_id)
    );
    following.add(viewerId); // your own posts belong in your feed too
    return s.visits
      .filter((v) => following.has(v.user_id))
      .map((v) => feedItemFrom(s, v))
      .filter((x): x is FeedItem => x !== null)
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1));
  },

  async userActivity(userId, viewerId) {
    const s = await load();
    const u = s.users.find((x) => x.id === userId);
    if (!u) return [];
    const state = followStateFor(s, viewerId, userId);
    const canView = viewerId === userId || !u.is_private || state === 'following';
    if (!canView) return [];
    return s.visits
      .filter((v) => v.user_id === userId)
      .map((v) => feedItemFrom(s, v))
      .filter((x): x is FeedItem => x !== null)
      .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1));
  },

  // ---- engagement (likes + comments) ---------------------------------------
  async postEngagement(viewerId, posts) {
    const s = await load();
    const out: Record<string, PostEngagement> = {};
    for (const p of posts) {
      const likes = (s.likes ?? []).filter(
        (l) => l.post_user_id === p.user_id && l.exhibition_id === p.exhibition_id
      );
      const comments = (s.comments ?? []).filter(
        (c) => c.post_user_id === p.user_id && c.exhibition_id === p.exhibition_id
      );
      out[p.id] = {
        likes: likes.length,
        liked_by_me: !!viewerId && likes.some((l) => l.user_id === viewerId),
        comments: comments.length,
      };
    }
    return out;
  },

  async toggleLike(viewerId, postUserId, exhibitionId) {
    const s = await load();
    s.likes = s.likes ?? [];
    const idx = s.likes.findIndex(
      (l) => l.post_user_id === postUserId && l.exhibition_id === exhibitionId && l.user_id === viewerId
    );
    const liked = idx === -1;
    if (liked) {
      s.likes.push({
        post_user_id: postUserId,
        exhibition_id: exhibitionId,
        user_id: viewerId,
        created_at: new Date().toISOString(),
      });
    } else {
      s.likes.splice(idx, 1);
    }
    await persist();
    return liked;
  },

  async listComments(postUserId, exhibitionId) {
    const s = await load();
    return (s.comments ?? [])
      .filter((c) => c.post_user_id === postUserId && c.exhibition_id === exhibitionId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .map((c) => ({
        ...c,
        display_name: s.users.find((u) => u.id === c.user_id)?.display_name ?? 'Someone',
      }));
  },

  async addComment(viewerId, postUserId, exhibitionId, body) {
    const s = await load();
    s.comments = s.comments ?? [];
    s.comments.push({
      id: uid('c'),
      post_user_id: postUserId,
      exhibition_id: exhibitionId,
      user_id: viewerId,
      body: body.trim(),
      created_at: new Date().toISOString(),
    });
    await persist();
  },

  async deleteComment(commentId, viewerId) {
    const s = await load();
    s.comments = (s.comments ?? []).filter(
      (c) => !(c.id === commentId && (c.user_id === viewerId || c.post_user_id === viewerId))
    );
    await persist();
  },

  async listActivity(userId) {
    const s = await load();
    const name = (id: string) => s.users.find((u) => u.id === id)?.display_name ?? 'Someone';
    const title = (id: string) => s.exhibitions.find((e) => e.id === id)?.title ?? 'a show';
    const likes = (s.likes ?? [])
      .filter((l) => l.post_user_id === userId && l.user_id !== userId)
      .map((l): ActivityEvent => ({
        id: `like:${l.user_id}:${l.exhibition_id}`,
        kind: 'like',
        actor_id: l.user_id,
        actor_name: name(l.user_id),
        exhibition_id: l.exhibition_id,
        exhibition_title: title(l.exhibition_id),
        created_at: l.created_at ?? '',
      }));
    const comments = (s.comments ?? [])
      .filter((c) => c.post_user_id === userId && c.user_id !== userId)
      .map((c): ActivityEvent => ({
        id: `comment:${c.id}`,
        kind: 'comment',
        actor_id: c.user_id,
        actor_name: name(c.user_id),
        exhibition_id: c.exhibition_id,
        exhibition_title: title(c.exhibition_id),
        body: c.body,
        created_at: c.created_at,
      }));
    const blocked = blockedOf(s, userId);
    return [...likes, ...comments]
      .filter((e) => !blocked.has(e.actor_id))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  // ---- direct messages -----------------------------------------------------
  async listConversations(userId) {
    const s = await load();
    const blocked = blockedOf(s, userId);
    const mine = (s.messages ?? [])
      .filter((m) => m.sender_id === userId || m.recipient_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const byPeer = new Map<string, { last: DirectMessage; unread: number }>();
    for (const m of mine) {
      const peerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      if (blocked.has(peerId)) continue;
      const entry = byPeer.get(peerId) ?? { last: m, unread: 0 };
      if (m.recipient_id === userId && !m.read_at) entry.unread += 1;
      byPeer.set(peerId, entry);
    }
    return [...byPeer.entries()]
      .map(([peerId, entry]): Conversation | null => {
        const peer = s.users.find((u) => u.id === peerId);
        return peer ? { peer: stripUser(peer), last: entry.last, unread: entry.unread } : null;
      })
      .filter((c): c is Conversation => c !== null)
      .sort((a, b) => (a.last.created_at < b.last.created_at ? 1 : -1));
  },

  async listMessages(userId, peerId) {
    const s = await load();
    return (s.messages ?? [])
      .filter(
        (m) =>
          (m.sender_id === userId && m.recipient_id === peerId) ||
          (m.sender_id === peerId && m.recipient_id === userId)
      )
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  },

  async sendMessage(senderId, recipientId, body) {
    const s = await load();
    // a block in either direction stops messages, matching the live RLS
    const stopped = (s.blocks ?? []).some(
      (b) =>
        (b.blocker_id === recipientId && b.blocked_id === senderId) ||
        (b.blocker_id === senderId && b.blocked_id === recipientId)
    );
    if (stopped) throw new Error('You can’t message this person.');
    s.messages = s.messages ?? [];
    s.messages.push({
      id: uid('m'),
      sender_id: senderId,
      recipient_id: recipientId,
      body: body.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
    });
    await persist();
  },

  async markThreadRead(userId, peerId) {
    const s = await load();
    const now = new Date().toISOString();
    for (const m of s.messages ?? []) {
      if (m.recipient_id === userId && m.sender_id === peerId && !m.read_at) m.read_at = now;
    }
    await persist();
  },

  async unreadMessageCount(userId) {
    const s = await load();
    return (s.messages ?? []).filter((m) => m.recipient_id === userId && !m.read_at).length;
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
      mediums: draft.mediums ?? [],
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
      mediums: draft.mediums ?? [],
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
    // mirror the DB cascade: engagement on those posts goes too
    s.likes = (s.likes ?? []).filter((l) => l.exhibition_id !== id);
    s.comments = (s.comments ?? []).filter((c) => c.exhibition_id !== id);
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

  // ---- safety --------------------------------------------------------------
  async listBlockedIds(viewerId) {
    const s = await load();
    return (s.blocks ?? []).filter((b) => b.blocker_id === viewerId).map((b) => b.blocked_id);
  },

  async blockUser(viewerId, targetId) {
    const s = await load();
    s.blocks = s.blocks ?? [];
    if (!s.blocks.some((b) => b.blocker_id === viewerId && b.blocked_id === targetId)) {
      s.blocks.push({ blocker_id: viewerId, blocked_id: targetId });
    }
    // blocking severs the follow relationship in both directions
    s.follows = s.follows.filter(
      (f) =>
        !(f.follower_id === viewerId && f.followee_id === targetId) &&
        !(f.follower_id === targetId && f.followee_id === viewerId)
    );
    await persist();
  },

  async unblockUser(viewerId, targetId) {
    const s = await load();
    s.blocks = (s.blocks ?? []).filter(
      (b) => !(b.blocker_id === viewerId && b.blocked_id === targetId)
    );
    await persist();
  },

  async reportContent(input) {
    const s = await load();
    s.reports = s.reports ?? [];
    s.reports.push({
      id: uid('r'),
      reporter_id: input.reporterId,
      kind: input.kind,
      subject_user_id: input.subjectUserId,
      exhibition_id: input.exhibitionId ?? null,
      comment_id: input.commentId ?? null,
      reason: input.reason.trim(),
      created_at: new Date().toISOString(),
    });
    await persist();
  },

  async deleteAccount(userId) {
    const s = await load();
    s.users = s.users.filter((u) => u.id !== userId);
    s.visits = s.visits.filter((v) => v.user_id !== userId);
    s.watchlist = s.watchlist.filter((w) => w.user_id !== userId);
    s.follows = s.follows.filter((f) => f.follower_id !== userId && f.followee_id !== userId);
    s.likes = (s.likes ?? []).filter((l) => l.user_id !== userId && l.post_user_id !== userId);
    s.comments = (s.comments ?? []).filter(
      (c) => c.user_id !== userId && c.post_user_id !== userId
    );
    s.messages = (s.messages ?? []).filter(
      (m) => m.sender_id !== userId && m.recipient_id !== userId
    );
    s.blocks = (s.blocks ?? []).filter(
      (b) => b.blocker_id !== userId && b.blocked_id !== userId
    );
    if (s.sessionUserId === userId) s.sessionUserId = null;
    await persist();
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
