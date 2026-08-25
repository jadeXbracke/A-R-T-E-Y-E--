// Demo backend: everything lives in AsyncStorage on this device only.
// Also reused by the live backend for cycle data, which never leaves the
// device (see supabase-api.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Api } from './api-types';
import { addDays, todayKey } from './dates';
import { ALL_DAYS } from './habits';
import {
  CalendarEvent, Checkin, Habit, HealthKind, HealthLog, HealthSync,
  InboxItem, KnowledgeEntry, KnowledgeKind, Mark, Pillar, Profile, SleepLog,
} from './types';

const KEY = 'mark.store.v1';

interface Store {
  profile: Profile | null;
  pillars: Pillar[];
  habits: Habit[];
  marks: Mark[];
  healthLogs: HealthLog[];
  knowledge: KnowledgeEntry[];
  inbox: InboxItem[];
  events: CalendarEvent[];
  checkins: Checkin[];
  sleep: SleepLog[];
  healthSync: HealthSync[];
}

function uid(): string {
  return Crypto.randomUUID();
}

function seed(): Store {
  const pillars: Pillar[] = [
    { id: uid(), name: 'Health', identity: '', position: 0, archived: false },
    { id: uid(), name: 'Mind', identity: '', position: 1, archived: false },
    { id: uid(), name: 'Reading & learning', identity: '', position: 2, archived: false },
    { id: uid(), name: 'Work & skill', identity: '', position: 3, archived: false },
  ];
  const start = addDays(todayKey(), -60); // demo history reaches back
  const habit = (pillarId: string, name: string, position: number, patch: Partial<Habit>): Habit =>
    ({ id: uid(), pillarId, name, rhythm: 'days', days: ALL_DAYS, times: 3,
       startDate: start, paused: false, position, archived: false, ...patch });
  const habits: Habit[] = [
    habit(pillars[0].id, 'Walk', 0, {}),
    habit(pillars[0].id, 'Training', 1, { rhythm: 'weekly', times: 3 }),
    habit(pillars[1].id, 'Meditate', 0, {}),
    habit(pillars[2].id, 'Read 20 minutes', 0, {}),
    habit(pillars[3].id, 'Deep work block', 0, { days: [0, 1, 2, 3, 4] }),
  ];
  // A week of plausible nights + a few step days, so the circle visuals show
  // something real straight away in demo mode.
  const today = todayKey();
  const beds = ['23:12', '23:45', '23:05', '00:20', '23:30', '23:15', '23:50'];
  const wakes = ['07:10', '07:30', '06:55', '08:05', '07:20', '07:05', '07:45'];
  const sleep: SleepLog[] = beds.map((bed, i) => ({
    id: uid(),
    date: addDays(today, i - 6),
    bedTime: bed,
    wakeTime: wakes[i],
    quality: 3 + ((i * 2) % 3),
    source: 'manual',
  }));
  const stepCounts = [8200, 5400, 11300, 7600, 9100];
  const healthSync: HealthSync[] = stepCounts.map((steps, i) => ({
    id: uid(),
    date: addDays(today, i - 4),
    steps,
    source: 'manual',
  }));
  return {
    profile: { id: 'demo', email: 'demo@mark.app' },
    pillars, habits,
    marks: [], healthLogs: [], knowledge: [], inbox: [], events: [], checkins: [],
    sleep, healthSync,
  };
}

let cache: Store | null = null;

async function load(): Promise<Store> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as Store) : seed();
  cache.inbox = cache.inbox ?? []; // stores saved before the mind dump existed
  cache.checkins = cache.checkins ?? []; // stores saved before month cycles existed
  // Stores saved before habits had weekdays / pillars an identity line.
  // Stores saved before rhythms existed: a plain weekday habit, live since
  // the beginning, never paused.
  for (const h of cache.habits) {
    h.days = h.days ?? [0, 1, 2, 3, 4, 5, 6];
    h.rhythm = h.rhythm ?? 'days';
    h.times = h.times ?? 3;
    h.startDate = h.startDate ?? '2000-01-01';
    h.paused = h.paused ?? false;
  }
  for (const p of cache.pillars) p.identity = p.identity ?? '';
  cache.sleep = cache.sleep ?? [];
  cache.healthSync = cache.healthSync ?? [];
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
  async updateName(name) {
    const s = await load();
    if (s.profile) s.profile.name = name;
    await save();
  },

  async listPillars() {
    const s = await load();
    return s.pillars.filter(p => !p.archived).sort((a, b) => a.position - b.position);
  },
  async createPillar(name) {
    const s = await load();
    const pillar: Pillar = { id: uid(), name, identity: '', position: s.pillars.length, archived: false };
    s.pillars.push(pillar);
    await save();
    return pillar;
  },
  async updatePillar(id, patch) {
    const s = await load();
    const p = s.pillars.find(p => p.id === id);
    if (p) {
      if (patch.name !== undefined) p.name = patch.name;
      if (patch.identity !== undefined) p.identity = patch.identity;
    }
    await save();
  },
  async reorderPillars(ids) {
    const s = await load();
    ids.forEach((id, i) => {
      const p = s.pillars.find(p => p.id === id);
      if (p) p.position = i;
    });
    await save();
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
  async createHabit(pillarId, name) {
    const s = await load();
    const habit: Habit = {
      id: uid(), pillarId, name,
      rhythm: 'days', days: ALL_DAYS, times: 3,
      startDate: todayKey(), paused: false,
      position: s.habits.length, archived: false,
    };
    s.habits.push(habit);
    await save();
    return habit;
  },
  async updateHabit(id, patch) {
    const s = await load();
    const h = s.habits.find(h => h.id === id);
    if (h) {
      if (patch.name !== undefined) h.name = patch.name;
      if (patch.rhythm !== undefined) h.rhythm = patch.rhythm;
      if (patch.days !== undefined) h.days = patch.days;
      if (patch.times !== undefined) h.times = patch.times;
      if (patch.paused !== undefined) h.paused = patch.paused;
    }
    await save();
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

  async listInbox() {
    const s = await load();
    return [...s.inbox].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async addInbox(kind, text) {
    const s = await load();
    const item: InboxItem = { id: uid(), kind, text, done: false, createdAt: new Date().toISOString() };
    s.inbox.push(item);
    await save();
    return item;
  },
  async toggleInboxDone(id) {
    const s = await load();
    const item = s.inbox.find(i => i.id === id);
    if (item) item.done = !item.done;
    await save();
  },
  async deleteInbox(id) {
    const s = await load();
    s.inbox = s.inbox.filter(i => i.id !== id);
    await save();
  },

  async listSleep(from, to) {
    const s = await load();
    return s.sleep
      .filter(l => l.date >= from && l.date <= to)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  },
  async upsertSleep(date, bedTime, wakeTime, quality) {
    const s = await load();
    let log = s.sleep.find(l => l.date === date);
    if (log) {
      log.bedTime = bedTime;
      log.wakeTime = wakeTime;
      log.quality = quality;
      log.source = 'manual';
    } else {
      log = { id: uid(), date, bedTime, wakeTime, quality, source: 'manual' };
      s.sleep.push(log);
    }
    await save();
    return log;
  },

  async listHealthSync(from, to) {
    const s = await load();
    return s.healthSync
      .filter(l => l.date >= from && l.date <= to)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  },
  async upsertSteps(date, steps, source) {
    const s = await load();
    const row = s.healthSync.find(l => l.date === date);
    if (row) {
      row.steps = steps;
      row.source = source;
    } else {
      s.healthSync.push({ id: uid(), date, steps, source });
    }
    await save();
  },

  async listKnowledge() {
    const s = await load();
    return [...s.knowledge].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async addKnowledge(kind: KnowledgeKind, title: string, rating: number, note: string) {
    const s = await load();
    const entry: KnowledgeEntry = { id: uid(), kind, title, rating, note, createdAt: new Date().toISOString() };
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

  async getCheckin(kind, periodStart) {
    const s = await load();
    return s.checkins.find(c => c.kind === kind && c.periodStart === periodStart) ?? null;
  },
  async saveCheckin(kind, periodStart, answers) {
    const s = await load();
    const existing = s.checkins.find(c => c.kind === kind && c.periodStart === periodStart);
    if (existing) existing.answers = answers;
    else s.checkins.push({ kind, periodStart, answers });
    await save();
  },
};
