import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { api, DEMO_MODE } from './api';
import { SignUpInput } from './api-types';
import { Profile } from './types';
import { registerForPushNotifications } from './push';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthState>({
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refresh: async () => {},
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

  // Once signed in (fresh sign-in, sign-up, or an app launch that resumes an
  // existing session), quietly try to register this device for push.
  useEffect(() => {
    if (profile) registerForPushNotifications(profile.id);
  }, [profile?.id]);

  // A password-recovery email signs the user in via the URL; send them
  // straight to the new-password screen. Live mode only.
  useEffect(() => {
    if (DEMO_MODE) return;
    const { supabase } = require('./supabase-api') as typeof import('./supabase-api');
    const { data: sub } = supabase().auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        refresh();
        router.push('/reset');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({
      profile,
      loading,
      async signIn(email, password) {
        setProfile(await api.signIn(email, password));
      },
      async signUp(input) {
        setProfile(await api.signUp(input));
      },
      async signOut() {
        await api.signOut();
        setProfile(null);
      },
      refresh,
    }),
    [profile, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
