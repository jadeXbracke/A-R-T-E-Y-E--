import { Archivo_300Light, Archivo_400Regular, Archivo_500Medium } from '@expo-google-fonts/archivo';
import { useFonts } from 'expo-font';
import { Redirect, Slot, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DEMO_MODE } from '../src/lib/api';
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
  const [fontsLoaded] = useFonts({
    Archivo_300Light,
    Archivo_400Regular,
    Archivo_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
