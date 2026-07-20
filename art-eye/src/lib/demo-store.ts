// Local demo backend. Active when no Supabase env vars are configured —
// full app flows (auth, curation, submissions, admin approval) work against
// an AsyncStorage-persisted store seeded with the July 2026 Sydney agenda.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api, SignUpInput } from './api-types';
import { SEED_EXHIBITIONS, SEED_VENUES } from './seed';
import {
  Exhibition,
  ExhibitionDraft,
  Profile,
  RejectionReason,
  Venue,
  VenueDraft,
  VenueProposal,
  Visit,
  WatchlistEntry,
} from './types';
import { todayStr } from './dates';

interface DemoUser extends Profile {
  password: string;
}

interface DemoState {
  users: DemoUser[];
  venues: Venue[];
  exhibitions: Exhibition[];
  watchlist: WatchlistEntry[];
  visits: Visit[];
  proposals: VenueProposal[];
  sessionUserId: string | null;
}

// Bump the suffix when the seed changes — installed devices then reload it.
const KEY = 'arteye.demo.v7';

// Demo stand-ins for what the live pipeline files in venue_review_queue.
const SEED_PROPOSALS: VenueProposal[] = [
  {
    id: 'p-demo-add',
    venue_id: null,
    action_type: 'add',
    proposed_payload: {
      slug: 'wentworth-galleries',
      name: 'Wentworth Galleries',
      type: 'gallery',
      address: '61 Phillip Street, Sydney NSW',
      suburb: 'Sydney',
      website: 'https://www.wentworthgalleries.com.au',
      city: 'Sydney',
    },
    evidence: [
      { url: 'https://www.wentworthgalleries.com.au', snippet: 'CBD gallery with regular exhibitions — not yet in the ART EYE register. (demo sample)' },
    ],
    confidence: 0.72,
    reason: 'Demo sample — the discovery job would suggest venues like this for your approval.',
    status: 'pending',
    created_at: '2026-07-19T09:00:00Z',
  },
  {
    id: 'p-demo-update',
    venue_id: 'v-cassandrabird',
    action_type: 'update',
    proposed_payload: { website: 'https://cassandrabird.com' },
    evidence: [
      { url: 'https://cassandrabird.com', snippet: 'Gallery website found for Cassandra Bird, Potts Point. (demo sample)' },
    ],
    confidence: 0.86,
    reason: 'Demo sample — the validate job proposes filling in the missing website.',
    status: 'pending',
    created_at: '2026-07-19T09:05:00Z',
  },
];

function seedState(): DemoState {
  const venues = SEED_VENUES.map((v) => ({ ...v }));
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
    ],
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

  async uploadImage(localUri) {
    return localUri; // demo mode keeps the local file uri
  },
};

export async function resetDemoStore(): Promise<void> {
  cache = seedState();
  await persist();
}

export { todayStr };
