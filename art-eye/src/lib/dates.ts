const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function parseDay(d: string): Date {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function fmtDay(d: string, withYear = false): string {
  const date = parseDay(d);
  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return withYear ? `${base} ${date.getFullYear()}` : base;
}

/** "6 JUN — 16 AUG 2026" */
export function fmtRange(start: string, end: string): string {
  return `${fmtDay(start)} — ${fmtDay(end, true)}`;
}

/** "22 JUL, 6 PM" from an ISO datetime */
export function fmtOpening(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const min = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const time = min ? `${h}:${String(min).padStart(2, '0')} ${ampm}` : `${h} ${ampm}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${time}`;
}

/** "SEP" — three-letter month for a date string. */
export function monthAbbr(d: string): string {
  return MONTHS[parseDay(d).getMonth()];
}

/** 7 — day-of-month for a date string. */
export function dayOfMonth(d: string): number {
  return parseDay(d).getDate();
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysUntil(d: string): number {
  return Math.round((parseDay(d).getTime() - parseDay(todayStr()).getTime()) / 86400000);
}

export function isOnNow(start: string, end: string): boolean {
  const t = todayStr();
  return start <= t && t <= end;
}
