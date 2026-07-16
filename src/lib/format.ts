import type { Exhibition } from './types';

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

function parts(iso: string): { d: number; m: string } {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { d, m: MONTHS[(m ?? 1) - 1] };
}

/** "6 JUN – 16 AUG" — the mono date line used everywhere. */
export function dateRange(e: Pick<Exhibition, 'start_date' | 'end_date'>): string {
  const s = parts(e.start_date);
  const en = parts(e.end_date);
  return `${s.d} ${s.m} – ${en.d} ${en.m}`;
}

/** "OPENING 22 JUL, 6 PM" — red mono opening-night tag. */
export function openingTag(e: Pick<Exhibition, 'opening_datetime'>): string | null {
  if (!e.opening_datetime) return null;
  const dt = new Date(e.opening_datetime);
  const { d, m } = parts(e.opening_datetime.slice(0, 10));
  let h = dt.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `OPENING ${d} ${m}, ${h} ${suffix}`;
}

/** "16 JUL 2026" for diary entries. */
export function diaryDate(iso: string): string {
  const { d, m } = parts(iso);
  return `${d} ${m} ${iso.slice(0, 4)}`;
}

export function todayISO(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

function daysUntil(iso: string): number {
  const ms = new Date(iso + 'T00:00:00').getTime() - new Date(todayISO() + 'T00:00:00').getTime();
  return Math.round(ms / 86_400_000);
}

export function isOnNow(e: Exhibition): boolean {
  const today = todayISO();
  return e.start_date <= today && today <= e.end_date;
}

export function isOpeningSoon(e: Exhibition): boolean {
  const d = daysUntil(e.start_date);
  return d > 0 && d <= 21;
}

export function isClosingSoon(e: Exhibition): boolean {
  if (!isOnNow(e)) return false;
  return daysUntil(e.end_date) <= 14;
}

export type AgendaFilter = 'all' | 'opening' | 'closing' | 'museums' | 'galleries';

export const FILTERS: { key: AgendaFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'opening', label: 'OPENING SOON' },
  { key: 'closing', label: 'CLOSING SOON' },
  { key: 'museums', label: 'MUSEUMS' },
  { key: 'galleries', label: 'GALLERIES' },
];

export function applyFilter(list: Exhibition[], filter: AgendaFilter): Exhibition[] {
  switch (filter) {
    case 'opening':
      return list.filter(isOpeningSoon);
    case 'closing':
      return list.filter(isClosingSoon);
    case 'museums':
      return list.filter((e) => e.venue?.type === 'museum');
    case 'galleries':
      return list.filter((e) => e.venue?.type === 'gallery');
    default:
      return list.filter((e) => isOnNow(e) || isOpeningSoon(e));
  }
}
