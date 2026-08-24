// Cycle registration — STRICTLY REGISTERING, DEVICE-ONLY.
//
// Privacy, by construction:
// - This data lives only in this app's private storage on this device. It is
//   never written to Supabase, never synced, never shared, and no analytics
//   or tracking code runs anywhere near it.
// - wipeAll() below deletes everything in one call (wired to the one-tap
//   "delete all cycle data" button in the app).
// - The module can be switched off entirely; the app then hides it and
//   touches nothing.
//
// Deliberately absent: phase advice, fertility prediction, contraception
// claims, and any assumption that a cycle is 28 days. Lengths are derived
// from the user's own recorded starts, and irregular cycles, hormonal
// contraception or no cycle at all are all fine — nothing here ever errors
// on "unexpected" patterns.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_MODE } from './api';
import { addDays, daysBetween, todayKey } from './dates';
import { CycleEntry, CyclePeriod, CycleSymptom } from './types';

const DATA_KEY = 'mark.cycle.v1';
const ENABLED_KEY = 'mark.cycle.enabled';

interface CycleData {
  periods: CyclePeriod[];
  entries: CycleEntry[];
}

let cache: CycleData | null = null;

function demoSeed(): CycleData {
  // Demo mode only: three plausible past cycles so the ring visual and the
  // observations have something to show. Never seeded in live mode.
  const t = todayKey();
  const starts = [addDays(t, -82), addDays(t, -53), addDays(t, -23)];
  const periods: CyclePeriod[] = starts.map(s => ({ start: s, end: addDays(s, 4) }));
  const entries: CycleEntry[] = [];
  for (const s of starts) {
    for (const offset of [1, 3, 8, 14, 21, 22, 24, 26]) {
      entries.push({
        date: addDays(s, offset),
        symptoms: { energy: offset >= 21 && offset <= 26 ? 2 : 4 },
      });
    }
  }
  return { periods, entries };
}

async function load(): Promise<CycleData> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(DATA_KEY).catch(() => null);
  if (raw) {
    cache = JSON.parse(raw) as CycleData;
  } else {
    cache = DEMO_MODE ? demoSeed() : { periods: [], entries: [] };
    await persist();
  }
  return cache;
}

async function persist(): Promise<void> {
  if (cache) await AsyncStorage.setItem(DATA_KEY, JSON.stringify(cache)).catch(() => {});
}

export const cycleStore = {
  async isEnabled(): Promise<boolean> {
    const v = await AsyncStorage.getItem(ENABLED_KEY).catch(() => null);
    return v !== '0';
  },
  async setEnabled(on: boolean): Promise<void> {
    await AsyncStorage.setItem(ENABLED_KEY, on ? '1' : '0').catch(() => {});
  },

  async listPeriods(): Promise<CyclePeriod[]> {
    return [...(await load()).periods].sort((a, b) => (a.start < b.start ? -1 : 1));
  },
  /** One tap: start a period today (or close the open one first). */
  async startPeriod(date: string): Promise<void> {
    const d = await load();
    if (!d.periods.some(p => p.start === date)) d.periods.push({ start: date });
    await persist();
  },
  async endPeriod(date: string): Promise<void> {
    const d = await load();
    const open = [...d.periods].reverse().find(p => !p.end);
    if (open && date >= open.start) open.end = date;
    await persist();
  },

  async listEntries(): Promise<CycleEntry[]> {
    return [...(await load()).entries];
  },
  async logSymptom(date: string, symptom: CycleSymptom, value: number): Promise<void> {
    const d = await load();
    let entry = d.entries.find(e => e.date === date);
    if (!entry) {
      entry = { date, symptoms: {} };
      d.entries.push(entry);
    }
    if (entry.symptoms[symptom] === value) delete entry.symptoms[symptom]; // tap again = unlog
    else entry.symptoms[symptom] = value;
    await persist();
  },

  /** One-tap full deletion. Gone is gone. */
  async wipeAll(): Promise<void> {
    cache = { periods: [], entries: [] };
    await AsyncStorage.removeItem(DATA_KEY).catch(() => {});
  },
};

// ── Derivations (all tolerant of sparse/irregular data) ─────────────────────

export interface CycleSpan {
  start: string;
  length: number;       // days until next start (or days so far, for current)
  periodDays: number;   // recorded menstruation days
  complete: boolean;
}

export function toSpans(periods: CyclePeriod[]): CycleSpan[] {
  const sorted = [...periods].sort((a, b) => (a.start < b.start ? -1 : 1));
  return sorted.map((p, i) => {
    const next = sorted[i + 1];
    const end = next ? next.start : addDays(todayKey(), 1);
    return {
      start: p.start,
      length: Math.max(daysBetween(p.start, end).length - 1, 1),
      periodDays: p.end ? daysBetween(p.start, p.end).length : Math.min(daysBetween(p.start, todayKey()).length, 10),
      complete: !!next,
    };
  });
}

/**
 * Neutral observations, only with 3+ completed cycles, phrased as what the
 * data shows — never as advice.
 */
export function observations(spans: CycleSpan[], entries: CycleEntry[]): string[] {
  const done = spans.filter(s => s.complete);
  if (done.length < 3) return [];
  const out: string[] = [];

  const lengths = done.map(s => s.length);
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  out.push(`Your last ${done.length} cycles averaged ${avg} days (${Math.min(...lengths)}–${Math.max(...lengths)}).`);

  // Energy by cycle day, if logged often enough: find the 5-day window with
  // the lowest average.
  const byDay = new Map<number, number[]>();
  for (const e of entries) {
    const energy = e.symptoms.energy;
    if (energy === undefined) continue;
    const span = [...spans].reverse().find(s => s.start <= e.date);
    if (!span) continue;
    const day = daysBetween(span.start, e.date).length;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(energy);
  }
  const values = [...byDay.values()].flat();
  if (values.length >= 12 && byDay.size >= 8) {
    const overall = values.reduce((a, b) => a + b, 0) / values.length;
    const maxDay = Math.max(...byDay.keys());
    let worst: { from: number; mean: number } | null = null;
    for (let from = 1; from + 4 <= maxDay; from++) {
      const window = [];
      for (let d = from; d < from + 5; d++) window.push(...(byDay.get(d) ?? []));
      if (window.length < 4) continue;
      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      if (!worst || mean < worst.mean) worst = { from, mean };
    }
    if (worst && worst.mean < overall - 0.7) {
      out.push(`Logged energy has tended to be lower around day ${worst.from}–${worst.from + 4}.`);
    }
  }
  return out;
}
