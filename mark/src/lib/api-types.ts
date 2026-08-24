import {
  CalendarEvent, Habit, HealthKind, HealthLog, InboxItem, InboxKind,
  KnowledgeEntry, KnowledgeKind, Mark, Pillar, Profile, Reflection,
} from './types';

// One interface, two backends (demo-store / supabase-api) — same pattern as
// art-eye, so the app never knows which mode it runs in.
export interface Api {
  // auth
  getSessionProfile(): Promise<Profile | null>;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;

  // pillars & habits
  listPillars(): Promise<Pillar[]>;
  createPillar(name: string): Promise<Pillar>;
  archivePillar(id: string): Promise<void>;
  listHabits(): Promise<Habit[]>;
  createHabit(pillarId: string, name: string, targetPerWeek: number): Promise<Habit>;
  archiveHabit(id: string): Promise<void>;

  // marks
  listMarks(from: string, to: string): Promise<Mark[]>;
  /** Set or clear the mark for a habit on a date. Resolves to the new state. */
  toggleMark(habitId: string, date: string): Promise<boolean>;

  // health
  listHealthLogs(kind: HealthKind, from: string, to: string): Promise<HealthLog[]>;
  addHealthLog(kind: HealthKind, date: string, payload: Record<string, unknown>): Promise<HealthLog>;

  // mind dump
  listInbox(): Promise<InboxItem[]>;
  addInbox(kind: InboxKind, text: string): Promise<InboxItem>;
  toggleInboxDone(id: string): Promise<void>;
  deleteInbox(id: string): Promise<void>;

  // knowledge
  listKnowledge(): Promise<KnowledgeEntry[]>;
  addKnowledge(kind: KnowledgeKind, title: string, insight: string): Promise<KnowledgeEntry>;

  // agenda
  listEvents(from: string, to: string): Promise<CalendarEvent[]>;
  addEvent(title: string, start: string, end: string): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;

  // reflection
  getReflection(weekStart: string): Promise<Reflection | null>;
  saveReflection(weekStart: string, answers: [string, string, string]): Promise<void>;
}
