// Demo backend: everything lives in AsyncStorage on this device only.
// Also reused by the live backend for cycle data, which never leaves the
// device (see supabase-api.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Api } from './api-types';
import {
  CalendarEvent, Habit, HealthKind, HealthLog, KnowledgeEntry, KnowledgeKind,
  Mark, Pillar, Profile, Reflection,
} from './types';

const KEY = 'mark.store.v1';

interface Store {
  profile: Profile | null;
  pillars: Pillar[];
  habits: Habit[];
  marks: Mark[];
  healthLogs: HealthLog[];
  knowledge: KnowledgeEntry[];
  events: CalendarEvent[];
  reflections: Reflection[];
}

function uid(): string {
  return Crypto.randomUUID();
}

function seed(): Store {
  const pillars: Pillar[] = [
    { id: uid(), name: 'Gezondheid', position: 0, archived: false },
    { id: uid(), name: 'Mind', position: 1, archived: false },
    { id: uid(), name: 'Lezen & leren', position: 2, archived: false },
    { id: uid(), name: 'Werk & skill', position: 3, archived: false },
  ];
  const habit = (pillarId: string, name: string, targetPerWeek: number, position: number): Habit =>
    ({ id: uid(), pillarId, name, targetPerWeek, position, archived: false });
  const habits: Habit[] = [
    habit(pillars[0].id, 'Wandelen', 5, 0),
    habit(pillars[0].id, 'Training', 3, 1),
    habit(pillars[1].id, 'Mediteren', 4, 0),
    habit(pillars[2].id, '20 minuten lezen', 5, 0),
    habit(pillars[3].id, 'Deep work-blok', 4, 0),
  ];
  return {
    profile: { id: 'demo', email: 'demo@mark.app' },
    pillars, habits,
    marks: [], healthLogs: [], knowledge: [], events: [], reflections: [],
  };
}

let cache: Store | null = null;

async function load(): Promise<Store> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as Store) : seed();
  if (!raw) await save();
  return cache;
}

async function save(): Promise<void> {
  if (cache) await AsyncStorage.setItem(KEY, JSON.stringify(cache));
}

export const demoApi: Api = {
  async getSessionProfile() {
    return (await load()).profile;
  },
  async signIn() { /* demo is always signed in */ },
  async signUp() { /* demo is always signed in */ },
  async signOut() { /* demo is always signed in */ },

  async listPillars() {
    const s = await load();
    return s.pillars.filter(p => !p.archived).sort((a, b) => a.position - b.position);
  },
  async createPillar(name) {
    const s = await load();
    const pillar: Pillar = { id: uid(), name, position: s.pillars.length, archived: false };
    s.pillars.push(pillar);
    await save();
    return pillar;
  },
  async archivePillar(id) {
    const s = await load();
    const p = s.pillars.find(p => p.id === id);
    if (p) p.archived = true;
    for (const h of s.habits) if (h.pillarId === id) h.archived = true;
    await save();
  },
  async listHabits() {
    const s = await load();
    return s.habits.filter(h => !h.archived).sort((a, b) => a.position - b.position);
  },
  async createHabit(pillarId, name, targetPerWeek) {
    const s = await load();
    const habit: Habit = { id: uid(), pillarId, name, targetPerWeek, position: s.habits.length, archived: false };
    s.habits.push(habit);
    await save();
    return habit;
  },
  async archiveHabit(id) {
    const s = await load();
    const h = s.habits.find(h => h.id === id);
    if (h) h.archived = true;
    await save();
  },

  async listMarks(from, to) {
    const s = await load();
    return s.marks.filter(m => m.date >= from && m.date <= to);
  },
  async toggleMark(habitId, date) {
    const s = await load();
    const i = s.marks.findIndex(m => m.habitId === habitId && m.date === date);
    let marked: boolean;
    if (i >= 0) {
      s.marks.splice(i, 1);
      marked = false;
    } else {
      s.marks.push({ id: uid(), habitId, date });
      marked = true;
    }
    await save();
    return marked;
  },

  async listHealthLogs(kind, from, to) {
    const s = await load();
    return s.healthLogs
      .filter(l => l.kind === kind && l.date >= from && l.date <= to)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  async addHealthLog(kind, date, payload) {
    const s = await load();
    const log: HealthLog = { id: uid(), kind, date, payload };
    s.healthLogs.push(log);
    await save();
    return log;
  },

  async listKnowledge() {
    const s = await load();
    return [...s.knowledge].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async addKnowledge(kind: KnowledgeKind, title: string, insight: string) {
    const s = await load();
    const entry: KnowledgeEntry = { id: uid(), kind, title, insight, createdAt: new Date().toISOString() };
    s.knowledge.push(entry);
    await save();
    return entry;
  },

  async listEvents(from, to) {
    const s = await load();
    return s.events
      .filter(e => e.start.slice(0, 10) >= from && e.start.slice(0, 10) <= to)
      .sort((a, b) => (a.start < b.start ? -1 : 1));
  },
  async addEvent(title, start, end) {
    const s = await load();
    const event: CalendarEvent = { id: uid(), title, start, end, source: 'mark' };
    s.events.push(event);
    await save();
    return event;
  },
  async deleteEvent(id) {
    const s = await load();
    s.events = s.events.filter(e => e.id !== id);
    await save();
  },

  async getReflection(weekStart) {
    const s = await load();
    return s.reflections.find(r => r.weekStart === weekStart) ?? null;
  },
  async saveReflection(weekStart, answers) {
    const s = await load();
    const existing = s.reflections.find(r => r.weekStart === weekStart);
    if (existing) existing.answers = answers;
    else s.reflections.push({ weekStart, answers });
    await save();
  },
};
