import type { Exhibition } from '../types';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function parts(iso: string): { d: number; m: string; y: number } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { d, m: MONTHS[(m ?? 1) - 1], y: y ?? 0 };
}

/** "6 JUN — 16 AUG 2026" — the mono date line. */
export function dateRange(start: string, end: string): string {
  const a = parts(start);
  const b = parts(end);
  if (a.m === b.m && a.y === b.y) return `${a.d} — ${b.d} ${b.m} ${b.y}`;
  if (a.y === b.y) return `${a.d} ${a.m} — ${b.d} ${b.m} ${b.y}`;
  return `${a.d} ${a.m} ${a.y} — ${b.d} ${b.m} ${b.y}`;
}

/**
 * "OPENS 22 JUL, 6PM" — the opening-night tag. Read from the string as
 * written (venue local time), never converted to the device timezone.
 */
export function openingTag(openingDatetime: string): string {
  const m = openingDatetime.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return 'OPENING NIGHT';
  const day = Number(m[3]);
  const month = MONTHS[Number(m[2]) - 1];
  let h = Number(m[4]);
  const mins = Number(m[5]);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `OPENS ${day} ${month}, ${h}${mins ? `:${String(mins).padStart(2, '0')}` : ''}${ampm}`;
}

/** "SEEN 12 JUL 2026" / diary date line. */
export function shortDate(iso: string): string {
  const { d, m, y } = parts(iso);
  return `${d} ${m} ${y}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysUntil(iso: string, from: Date = new Date()): number {
  const target = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function isOnNow(e: Exhibition, now: Date = new Date()): boolean {
  return daysUntil(e.start_date, now) <= 0 && daysUntil(e.end_date, now) >= 0;
}

export function isOpeningSoon(e: Exhibition, now: Date = new Date()): boolean {
  const d = daysUntil(e.start_date, now);
  return d > 0 && d <= 21;
}

export function isClosingSoon(e: Exhibition, now: Date = new Date()): boolean {
  const d = daysUntil(e.end_date, now);
  return isOnNow(e, now) && d >= 0 && d <= 14;
}

/** "CLOSES IN 5 DAYS" / "FINAL DAY" */
export function closingTag(e: Exhibition, now: Date = new Date()): string | null {
  if (!isClosingSoon(e, now)) return null;
  const d = daysUntil(e.end_date, now);
  if (d === 0) return 'FINAL DAY';
  if (d === 1) return 'CLOSES TOMORROW';
  return `CLOSES IN ${d} DAYS`;
}
