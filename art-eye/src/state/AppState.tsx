import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Exhibition, Profile, Visit } from '../types';
import type { SignUpInput } from '../lib/api';
import { client } from '../lib/client';

interface AppState {
  ready: boolean;
  profile: Profile | null;
  exhibitions: Exhibition[];
  watchlist: Set<string>;
  visits: Visit[];
  refreshAgenda: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  toggleWatchlist: (exhibitionId: string) => Promise<void>;
  markSeen: (exhibitionId: string, rating: number, reflection: string) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [visits, setVisits] = useState<Visit[]>([]);

  const refreshAgenda = useCallback(async () => {
    setExhibitions(await client.listApprovedExhibitions());
  }, []);

  const loadUserData = useCallback(async (p: Profile | null) => {
    if (!p) {
      setWatchlist(new Set());
      setVisits([]);
      return;
    }
    const [w, v] = await Promise.all([client.getWatchlist(p.id), client.getVisits(p.id)]);
    setWatchlist(new Set(w));
    setVisits(v);
  }, []);

  const refreshUserData = useCallback(
    () => loadUserData(profile),
    [loadUserData, profile],
  );

  useEffect(() => {
    (async () => {
      try {
        const p = await client.restoreSession();
        setProfile(p);
        await Promise.all([refreshAgenda(), loadUserData(p)]);
      } catch (err) {
        console.warn('ART EYE: failed to restore session', err);
      } finally {
        setReady(true);
      }
    })();
  }, [refreshAgenda, loadUserData]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const p = await client.signIn(email, password);
      setProfile(p);
      await loadUserData(p);
    },
    [loadUserData],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const p = await client.signUp(input);
      setProfile(p);
      await loadUserData(p);
    },
    [loadUserData],
  );

  const signOut = useCallback(async () => {
    await client.signOut();
    setProfile(null);
    setWatchlist(new Set());
    setVisits([]);
  }, []);

  const toggleWatchlist = useCallback(
    async (exhibitionId: string) => {
      if (!profile) return;
      const on = !watchlist.has(exhibitionId);
      setWatchlist((prev) => {
        const next = new Set(prev);
        if (on) next.add(exhibitionId);
        else next.delete(exhibitionId);
        return next;
      });
      await client.setWatchlisted(profile.id, exhibitionId, on);
    },
    [profile, watchlist],
  );

  const markSeen = useCallback(
    async (exhibitionId: string, rating: number, reflection: string) => {
      if (!profile) return;
      await client.saveVisit(profile.id, exhibitionId, rating, reflection);
      await loadUserData(profile);
    },
    [profile, loadUserData],
  );

  const value = useMemo<AppState>(
    () => ({
      ready,
      profile,
      exhibitions,
      watchlist,
      visits,
      refreshAgenda,
      refreshUserData,
      signIn,
      signUp,
      signOut,
      toggleWatchlist,
      markSeen,
    }),
    [
      ready,
      profile,
      exhibitions,
      watchlist,
      visits,
      refreshAgenda,
      refreshUserData,
      signIn,
      signUp,
      signOut,
      toggleWatchlist,
      markSeen,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
