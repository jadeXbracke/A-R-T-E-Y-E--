// Datamodel — mirrors the Supabase schema in supabase/setup_1_schema.sql.
// Dates are 'YYYY-MM-DD' strings (local calendar days, never UTC-shifted).

export interface Pillar {
  id: string;
  name: string;
  /** Optional "I am someone who…" line. Empty when unused — never required. */
  identity: string;
  position: number;
  archived: boolean;
}

export interface Habit {
  id: string;
  pillarId: string;
  name: string;
  /**
   * Weekdays this habit is due: 0 = Monday … 6 = Sunday. An empty list means
   * every day. The weekly target is simply how many days are selected, so a
   * rest day is never counted as a miss.
   */
  days: number[];
  position: number;
  archived: boolean;
}

/** One check-in: a small piece of evidence of who you are becoming. */
export interface Mark {
  id: string;
  habitId: string;
  date: string;
}

export type HealthKind = 'movement' | 'nutrition' | 'sleep' | 'cycle';

export interface HealthLog {
  id: string;
  kind: HealthKind;
  date: string;
  /** Shape depends on kind — see HealthPayloads. */
  payload: Record<string, unknown>;
}

export interface MovementPayload { type: string; minutes: number }

/** One night; `date` is the morning you woke up. Times as 'HH:MM'. */
export interface SleepLog {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  quality: number; // 0 = unrated, else 1-5
  source: 'manual' | 'health';
}

/** Daily numbers from a health platform, or entered by hand. */
export interface HealthSync {
  id: string;
  date: string;
  steps?: number;
  restingHr?: number;
  activeEnergy?: number;
  source: 'manual' | 'health';
}

// ── Cycle registration: DEVICE-ONLY, see cycle-store.ts ─────────────────────
// Strictly registering: starts/ends and optional daily symptoms. No phase
// advice, no fertility prediction, no assumptions about cycle length.

export interface CyclePeriod {
  start: string;      // YYYY-MM-DD
  end?: string;       // open while menstruating
}

export type CycleSymptom = 'energy' | 'mood' | 'cramp' | 'skin' | 'sleep';

export interface CycleEntry {
  date: string;
  /** Each symptom 1-5 when logged; absent = not logged. Never required. */
  symptoms: Partial<Record<CycleSymptom, number>>;
}
export interface NutritionPayload { quality?: 1 | 2 | 3; glasses?: number; supplements?: boolean; protein?: number }
export interface SleepPayload { hours: number; quality: 1 | 2 | 3 | 4 | 5 }
export interface CyclePayload { symptoms?: string[]; energy?: 1 | 2 | 3 | 4 | 5; period?: boolean }

export type KnowledgeKind = 'book' | 'course' | 'article' | 'podcast';

export type InboxKind = 'book' | 'idea' | 'task' | 'watch' | 'note';

/** Mind dump: anything you want out of your head, captured in seconds. */
export interface InboxItem {
  id: string;
  kind: InboxKind;
  text: string;
  done: boolean;
  createdAt: string; // ISO
}

export interface KnowledgeEntry {
  id: string;
  kind: KnowledgeKind;
  title: string;
  /** 1-5, shown as filled circles. */
  rating: number;
  note: string;
  createdAt: string; // ISO
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  /** 'mark' = created in-app; 'google' reserved for the sync in V1.1. */
  source: 'mark' | 'google';
  externalId?: string;
}

export type CheckinKind = 'week' | 'month' | 'quarter' | 'intention';

/**
 * The month-cycle rhythm: intentions at the start of a month, a short
 * reflection on Sundays, a check-in on the last day of the month and of the
 * quarter. `periodStart` anchors the period (Monday / first of month /
 * first of quarter).
 */
export interface Checkin {
  kind: CheckinKind;
  periodStart: string; // YYYY-MM-DD
  answers: [string, string, string];
}

export interface Profile {
  id: string;
  email: string;
  name?: string;
}
