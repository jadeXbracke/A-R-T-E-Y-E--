// Dark/light with a manual override on top of the system default.
// Monochrome in both modes — only the ground and ink swap.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Palette, palettes, Scheme } from '../theme';

export type ThemePref = 'system' | Scheme;
export type NavSide = 'bottom' | 'left' | 'right';
const KEY = 'mark.theme';
const NAV_KEY = 'mark.nav';

interface ThemeState {
  scheme: Scheme;
  pref: ThemePref;
  palette: Palette;
  setPref(pref: ThemePref): void;
  nav: NavSide;
  setNav(side: NavSide): void;
}

const ThemeContext = createContext<ThemeState>({
  scheme: 'light',
  pref: 'system',
  palette: palettes.light,
  setPref: () => {},
  nav: 'bottom',
  setNav: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');
  const [nav, setNavState] = useState<NavSide>('bottom');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
    });
    AsyncStorage.getItem(NAV_KEY).then(v => {
      if (v === 'bottom' || v === 'left' || v === 'right') setNavState(v);
    });
  }, []);

  const setPref = (next: ThemePref) => {
    setPrefState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  };

  const setNav = (next: NavSide) => {
    setNavState(next);
    AsyncStorage.setItem(NAV_KEY, next).catch(() => {});
  };

  const scheme: Scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;

  return (
    <ThemeContext.Provider value={{ scheme, pref, palette: palettes[scheme], setPref, nav, setNav }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
