import { Archivo_500Medium } from '@expo-google-fonts/archivo';
import { useFonts } from 'expo-font';
import { Redirect, Slot, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DEMO_MODE } from '../src/lib/api';
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

  useEffect(() => {
    if (fontsSettled) SplashScreen.hideAsync().catch(() => {});
  }, [fontsSettled]);

  if (!fontsSettled) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <EntitlementsProvider>
            <Gate />
          </EntitlementsProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
