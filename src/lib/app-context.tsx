import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from './api';
import type { Exhibition, Profile, Visit } from './types';
import { todayISO } from './format';

interface AppState {
  ready: boolean;
  profile: Profile | null;
  exhibitions: Exhibition[]; // approved agenda, with venue joined
  watchlistIds: string[];
  visits: Visit[];
  isDemo: boolean;

  refreshAgenda(): Promise<void>;
  refreshPersonal(): Promise<void>;
  setProfile(p: Profile | null): void;
  signOut(): Promise<void>;
  toggleWatchlist(exhibitionId: string): Promise<void>;
  markSeen(exhibitionId: string, rating: number, reflection: string): Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  const refreshAgenda = useCallback(async () => {
    try {
      setExhibitions(await api.listApproved());
    } catch (e) {
      console.warn('Failed to load agenda', e);
    }
  }, []);

  const refreshPersonal = useCallback(async () => {
    if (!profile) return;
    try {
      const [w, v] = await Promise.all([
        api.getWatchlist(profile.id),
        api.listVisits(profile.id),
      ]);
      setWatchlistIds(w);
      setVisits(v);
    } catch (e) {
      console.warn('Failed to load personal record', e);
    }
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const restored = await api.restoreSession();
        setProfile(restored);
        await refreshAgenda();
      } finally {
        setReady(true);
      }
    })();
  }, [refreshAgenda]);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    Promise.all([api.getWatchlist(profile.id), api.listVisits(profile.id)])
      .then(([w, v]) => {
        if (alive) {
          setWatchlistIds(w);
          setVisits(v);
        }
      })
      .catch((e) => console.warn('Failed to load personal record', e));
    return () => {
      alive = false;
    };
  }, [profile]);

  const signOut = useCallback(async () => {
    await api.signOut();
    setProfile(null);
    setWatchlistIds([]);
    setVisits([]);
  }, []);

  const toggleWatchlist = useCallback(
    async (exhibitionId: string) => {
      if (!profile) return;
      if (watchlistIds.includes(exhibitionId)) {
        setWatchlistIds((ids) => ids.filter((id) => id !== exhibitionId));
        await api.removeFromWatchlist(profile.id, exhibitionId);
      } else {
        setWatchlistIds((ids) => [exhibitionId, ...ids]);
        await api.addToWatchlist(profile.id, exhibitionId);
      }
    },
    [profile, watchlistIds],
  );

  const markSeen = useCallback(
    async (exhibitionId: string, rating: number, reflection: string) => {
      if (!profile) return;
      const visit: Visit = {
        user_id: profile.id,
        exhibition_id: exhibitionId,
        rating,
        reflection: reflection.trim() || null,
        visit_date: todayISO(),
      };
      await api.saveVisit(visit);
      setVisits((v) => [visit, ...v.filter((x) => x.exhibition_id !== exhibitionId)]);
      setWatchlistIds((ids) => ids.filter((id) => id !== exhibitionId));
    },
    [profile],
  );

  const value = useMemo<AppState>(
    () => ({
      ready,
      profile,
      exhibitions,
      watchlistIds,
      visits,
      isDemo: api.isDemo,
      refreshAgenda,
      refreshPersonal,
      setProfile,
      signOut,
      toggleWatchlist,
      markSeen,
    }),
    [ready, profile, exhibitions, watchlistIds, visits, refreshAgenda, refreshPersonal, signOut, toggleWatchlist, markSeen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
