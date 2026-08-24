import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { Profile } from './types';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  refresh(): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, name?: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState>({
  profile: null,
  loading: true,
  refresh: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setProfile(await api.getSessionProfile());
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    await api.signIn(email, password);
    await refresh();
  }, [refresh]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    await api.signUp(email, password, name);
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api.signOut();
    await refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ profile, loading, refresh, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
