// Dark/light with a manual override on top of the system default.
// Monochrome in both modes — only the ground and ink swap.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Palette, palettes, Scheme } from '../theme';

export type ThemePref = 'system' | Scheme;
const KEY = 'mark.theme';

interface ThemeState {
  scheme: Scheme;
  pref: ThemePref;
  palette: Palette;
  setPref(pref: ThemePref): void;
}

const ThemeContext = createContext<ThemeState>({
  scheme: 'light',
  pref: 'system',
  palette: palettes.light,
  setPref: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
    });
  }, []);

  const setPref = (next: ThemePref) => {
    setPrefState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  };

  const scheme: Scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;

  return (
    <ThemeContext.Provider value={{ scheme, pref, palette: palettes[scheme], setPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
