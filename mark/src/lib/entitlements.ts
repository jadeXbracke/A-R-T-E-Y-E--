// Freemium structure, RevenueCat-ready.
//
// Free: unlimited habits, daily check-in, basic week progress.
// Premium (€4.99/month or €39.99/year): the FEATURES flagged true below.
// The flag map is the single place to move a feature between tiers.
//
// Purchases: in the store build, initialise react-native-purchases with the
// RevenueCat API key and map `customerInfo.entitlements.active['premium']`
// into setPremium(). The webhook also mirrors status into the
// `subscriptions` table so the backend can trust it. Until that build
// exists, demo mode unlocks everything so nothing blocks daily use.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_MODE } from './api';

export type PremiumFeature =
  | 'healthSync' | 'calendarSync' | 'cycle' | 'correlations' | 'export' | 'accentColors';

// true = premium-gated. Shift features between tiers here and only here.
export const PREMIUM_FLAGS: Record<PremiumFeature, boolean> = {
  healthSync: true,
  calendarSync: true,
  cycle: true,
  correlations: true,
  export: true,
  accentColors: true,
};

export const PRICING = { monthly: '€4.99 / month', yearly: '€39.99 / year' };

const KEY = 'mark.premium';

interface Entitlements {
  premium: boolean;
  has(feature: PremiumFeature): boolean;
  setPremium(on: boolean): void;
}

const Ctx = createContext<Entitlements>({ premium: false, has: () => true, setPremium: () => {} });

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [premium, setPremiumState] = useState(DEMO_MODE);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === '1') setPremiumState(true);
    }).catch(() => {});
  }, []);

  const setPremium = (on: boolean) => {
    setPremiumState(on);
    AsyncStorage.setItem(KEY, on ? '1' : '0').catch(() => {});
  };

  const has = (feature: PremiumFeature) => !PREMIUM_FLAGS[feature] || premium || DEMO_MODE;

  return React.createElement(Ctx.Provider, { value: { premium, has, setPremium } }, children);
}

export function useEntitlements() {
  return useContext(Ctx);
}
