// Product analytics — and the wall between it and health data.
//
// The rule is enforced by the type system, not by discipline: an event is
// one of the names below and carries nothing else. There is no free-form
// payload to accidentally put a symptom, a cycle day, a sleep time or a
// habit name into, so no future edit can leak special-category data through
// this path even by mistake.
//
// Consent: analytics is off until the person turns it on (GDPR requires
// opt-in here, and none of it is needed to run the app).
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Where people get stuck — screens opened and flows completed. Deliberately
 * absent: anything from Body, the cycle module, or any habit's name or
 * content. Those screens must never call this module at all.
 */
export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_completed'
  | 'habit_created'
  | 'pillar_created'
  | 'mark_set'
  | 'past_day_edited'
  | 'checkin_saved'
  | 'export_created'
  | 'import_completed'
  | 'paywall_viewed'
  | 'subscription_started';

/** The only shapes a property may take — counts and buckets, never content. */
export interface AnalyticsProps {
  /** How many of a thing, e.g. habits — a number, never a name. */
  count?: number;
  /** Which surface, from a fixed set. */
  screen?: 'today' | 'growth' | 'knowledge' | 'more' | 'paywall';
}

const CONSENT_KEY = 'mark.analytics.consent';

let consented = false;

export async function loadAnalyticsConsent(): Promise<boolean> {
  try {
    consented = (await AsyncStorage.getItem(CONSENT_KEY)) === '1';
  } catch {
    consented = false;
  }
  return consented;
}

export function hasAnalyticsConsent(): boolean {
  return consented;
}

export async function setAnalyticsConsent(on: boolean): Promise<void> {
  consented = on;
  await AsyncStorage.setItem(CONSENT_KEY, on ? '1' : '0').catch(() => {});
}

/**
 * Record an event, if and only if the person opted in. No provider is wired
 * yet: when one is, it is called from here and nowhere else, so this stays
 * the single place any data can leave for analytics.
 */
export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (!consented) return;
  if (__DEV__) console.log('[analytics]', event, props);
  // Provider call goes here — and only here.
}
