import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { data } from '../lib/data';
import { Profile, ProfileType, Role } from '../lib/types';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(
    email: string,
    password: string,
    displayName: string,
    role: Role,
    profileType: ProfileType
  ): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    data
      .restoreSession()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setProfile(await data.signIn(email, password));
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string, role: Role, profileType: ProfileType) => {
      setProfile(await data.signUp(email, password, displayName, role, profileType));
    },
    []
  );

  const signOut = useCallback(async () => {
    await data.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ profile, loading, signIn, signUp, signOut }),
    [profile, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
