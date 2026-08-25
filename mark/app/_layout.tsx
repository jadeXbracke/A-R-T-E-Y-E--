import { Archivo_500Medium } from '@expo-google-fonts/archivo';
import { useFonts } from 'expo-font';
import { Redirect, Slot, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DEMO_MODE } from '../src/lib/api';
import { loadAnalyticsConsent } from '../src/lib/analytics';
import { BackdropProvider } from '../src/lib/backdrop';
import { loadDayStart } from '../src/lib/day-start';
import { EntitlementsProvider } from '../src/lib/entitlements';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { ThemeProvider, useTheme } from '../src/lib/theme-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate() {
  const { palette, scheme } = useTheme();
  const { profile, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <View style={{ flex: 1, backgroundColor: palette.bg }} />;

  // Live mode requires an account; demo mode is always "signed in".
  const needsAuth = !DEMO_MODE && !profile && pathname !== '/auth';
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {needsAuth ? <Redirect href="/auth" /> : null}
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  // A font that fails to load must not strand the app on a blank screen —
  // fall through to the system face instead of waiting forever.
  const [fontsLoaded, fontError] = useFonts({
    Archivo_500Medium,
  });
  const fontsSettled = fontsLoaded || !!fontError;
  // The day boundary decides what "today" means, so it has to be in place
  // before a single screen computes a date.
  const [dayStartReady, setDayStartReady] = useState(false);
  useEffect(() => {
    Promise.all([loadDayStart(), loadAnalyticsConsent()])
      .finally(() => setDayStartReady(true));
  }, []);

  useEffect(() => {
    if (fontsSettled && dayStartReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsSettled, dayStartReady]);

  if (!fontsSettled || !dayStartReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <EntitlementsProvider>
            <BackdropProvider>
              <Gate />
            </BackdropProvider>
          </EntitlementsProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
