// Datamodel — mirrors the Supabase schema in supabase/setup_1_schema.sql.
// Dates are 'YYYY-MM-DD' strings (local calendar days, never UTC-shifted).

export interface Pillar {
  id: string;
  name: string;
  position: number;
  archived: boolean;
}

export interface Habit {
  id: string;
  pillarId: string;
  name: string;
  /** How many marks per week feel right — soft target, never a punishment. */
  targetPerWeek: number;
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
