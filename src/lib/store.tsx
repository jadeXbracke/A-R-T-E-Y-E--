import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Backend } from './backend';
import { DemoBackend } from './demoBackend';
import { SupabaseBackend, hasSupabaseConfig } from './supabaseBackend';
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

interface StoreValue {
  backendKind: 'supabase' | 'demo';
  ready: boolean;
  user: UserProfile | null;

  exhibitions: Exhibition[];
  venues: Venue[];
  venueById: (id: string) => Venue | undefined;
  exhibitionById: (id: string) => Exhibition | undefined;

  watchlist: Set<string>;
  visits: Visit[];
  visitFor: (exhibitionId: string) => Visit | undefined;

  refreshAgenda: () => Promise<void>;
  signUp: (args: {
    email: string;
    password: string;
    displayName: string;
    role: Role;
    profileType: ProfileType;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  toggleWatchlist: (exhibitionId: string) => Promise<void>;
  markSeen: (exhibitionId: string, rating: number, reflection: string) => Promise<void>;

  submitExhibition: (input: ExhibitionInput, asPublic: boolean) => Promise<void>;
  listMySubmissions: () => Promise<{ exhibitions: Exhibition[]; venues: Venue[] }>;
  updateSubmission: (id: string, input: ExhibitionInput) => Promise<void>;
  listPending: () => Promise<{ exhibitions: Exhibition[]; venues: Venue[] }>;
  approve: (id: string, edits: ExhibitionInput) => Promise<void>;
  reject: (id: string, reason: RejectionReason) => Promise<void>;
  uploadImage: (localUri: string) => Promise<string>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const backendRef = useRef<Backend | null>(null);
  if (!backendRef.current) {
    backendRef.current = hasSupabaseConfig ? new SupabaseBackend() : new DemoBackend();
  }
  const backend = backendRef.current;

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [visits, setVisits] = useState<Visit[]>([]);

  const refreshAgenda = useCallback(async () => {
    const { exhibitions: ex, venues: vs } = await backend.listAgenda();
    setExhibitions(ex);
    setVenues(vs);
  }, [backend]);

  const refreshPersonal = useCallback(
    async (u: UserProfile | null) => {
      if (!u) {
        setWatchlist(new Set());
        setVisits([]);
        return;
      }
      const [wl, vv] = await Promise.all([backend.getWatchlist(u.id), backend.getVisits(u.id)]);
      setWatchlist(new Set(wl));
      setVisits(vv);
    },
    [backend]
  );

  useEffect(() => {
    (async () => {
      try {
        const u = await backend.restoreSession().catch(() => null);
        setUser(u);
        await Promise.all([refreshAgenda(), refreshPersonal(u)]);
      } catch (err) {
        console.warn('ART EYE: initial load failed', err);
      } finally {
        setReady(true);
      }
    })();
  }, [backend, refreshAgenda, refreshPersonal]);

  const value = useMemo<StoreValue>(
    () => ({
      backendKind: backend.kind,
      ready,
      user,
      exhibitions,
      venues,
      venueById: (id) => venues.find((v) => v.id === id),
      exhibitionById: (id) => exhibitions.find((e) => e.id === id),
      watchlist,
      visits,
      visitFor: (id) => visits.find((v) => v.exhibition_id === id),

      refreshAgenda,

      signUp: async (args) => {
        const u = await backend.signUp(args);
        setUser(u);
        await refreshPersonal(u);
      },
      signIn: async (email, password) => {
        const u = await backend.signIn(email, password);
        setUser(u);
        await refreshPersonal(u);
      },
      signOut: async () => {
        await backend.signOut();
        setUser(null);
        await refreshPersonal(null);
      },

      toggleWatchlist: async (exhibitionId) => {
        if (!user) return;
        if (watchlist.has(exhibitionId)) {
          setWatchlist((prev) => {
            const next = new Set(prev);
            next.delete(exhibitionId);
            return next;
          });
          await backend.removeFromWatchlist(user.id, exhibitionId);
        } else {
          setWatchlist((prev) => new Set(prev).add(exhibitionId));
          await backend.addToWatchlist(user.id, exhibitionId);
        }
      },

      markSeen: async (exhibitionId, rating, reflection) => {
        if (!user) return;
        const visit: Visit = {
          user_id: user.id,
          exhibition_id: exhibitionId,
          rating,
          reflection: reflection.trim(),
          visit_date: new Date().toISOString().slice(0, 10),
        };
        await backend.markSeen(visit);
        await refreshPersonal(user);
      },

      submitExhibition: async (input, asPublic) => {
        await backend.submitExhibition(input, asPublic ? null : (user?.id ?? null));
      },
      listMySubmissions: async () => {
        if (!user) return { exhibitions: [], venues: [] };
        return backend.listMySubmissions(user.id);
      },
      updateSubmission: (id, input) => backend.updateSubmission(id, input),
      listPending: () => backend.listPending(),
      approve: async (id, edits) => {
        await backend.approve(id, edits);
        await refreshAgenda();
      },
      reject: (id, reason) => backend.reject(id, reason),
      uploadImage: (uri) => backend.uploadImage(uri),
    }),
    [backend, ready, user, exhibitions, venues, watchlist, visits, refreshAgenda, refreshPersonal]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
