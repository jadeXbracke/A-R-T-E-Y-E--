import {
  CalendarEvent, Checkin, CheckinKind, Habit, HealthKind, HealthLog,
  InboxItem, InboxKind, KnowledgeEntry, KnowledgeKind, Mark, Pillar, Profile,
} from './types';

// One interface, two backends (demo-store / supabase-api) — same pattern as
// art-eye, so the app never knows which mode it runs in.
export interface Api {
  // auth
  getSessionProfile(): Promise<Profile | null>;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, name?: string): Promise<void>;
  signOut(): Promise<void>;
  updateName(name: string): Promise<void>;

  // pillars & habits
  listPillars(): Promise<Pillar[]>;
  createPillar(name: string): Promise<Pillar>;
  archivePillar(id: string): Promise<void>;
  listHabits(): Promise<Habit[]>;
  createHabit(pillarId: string, name: string, targetPerWeek: number): Promise<Habit>;
  updateHabit(id: string, patch: { name?: string; targetPerWeek?: number }): Promise<void>;
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
  addKnowledge(kind: KnowledgeKind, title: string, rating: number, note: string): Promise<KnowledgeEntry>;

  // agenda
  listEvents(from: string, to: string): Promise<CalendarEvent[]>;
  addEvent(title: string, start: string, end: string): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;

  // cycle check-ins (weekly reflection, month/quarter check-ins, intentions)
  getCheckin(kind: CheckinKind, periodStart: string): Promise<Checkin | null>;
  saveCheckin(kind: CheckinKind, periodStart: string, answers: [string, string, string]): Promise<void>;
}
