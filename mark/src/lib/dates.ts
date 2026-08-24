// Local-calendar date helpers. All keys are 'YYYY-MM-DD' in device-local time.

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** Monday of the week containing `key`. */
export function weekStart(key: string): string {
  const d = fromKey(key);
  const shift = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - shift);
  return dateKey(d);
}

export function monthStart(key: string): string {
  return key.slice(0, 8) + '01';
}

export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let k = from;
  while (k <= to) {
    out.push(k);
    k = addDays(k, 1);
  }
  return out;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatLong(key: string): string {
  const d = fromKey(key);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatShort(key: string): string {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function monthLabel(key: string): string {
  const d = fromKey(key);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function monthEnd(key: string): string {
  const d = fromKey(monthStart(key));
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return dateKey(d);
}

export function quarterStart(key: string): string {
  const d = fromKey(key);
  const m = Math.floor(d.getMonth() / 3) * 3;
  return dateKey(new Date(d.getFullYear(), m, 1));
}

export function quarterEnd(key: string): string {
  const d = fromKey(quarterStart(key));
  d.setMonth(d.getMonth() + 3);
  d.setDate(0);
  return dateKey(d);
}

export function daysInMonth(key: string): number {
  return fromKey(monthEnd(key)).getDate();
}
