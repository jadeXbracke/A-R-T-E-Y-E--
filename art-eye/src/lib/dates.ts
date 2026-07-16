const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function parseDay(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function todayStr(): string {
  const t = new Date();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${t.getFullYear()}-${m}-${d}`;
}

function fmtDay(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "6 JUN — 16 AUG" */
export function formatRange(start: string, end: string): string {
  return `${fmtDay(parseDay(start))} — ${fmtDay(parseDay(end))}`;
}

/** "16 AUG 2026" */
export function formatDay(d: string): string {
  const date = parseDay(d);
  return `${fmtDay(date)} ${date.getFullYear()}`;
}

/** "22 JUL, 6–8 PM" style line for an opening datetime */
export function formatOpening(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mins = d.getMinutes();
  const time = mins ? `${h}.${String(mins).padStart(2, '0')} ${suffix}` : `${h} ${suffix}`;
  return `${fmtDay(d)}, ${time}`;
}

export function daysUntil(d: string): number {
  const ms = parseDay(d).getTime() - parseDay(todayStr()).getTime();
  return Math.round(ms / 86400000);
}

export function isOnNow(e: { start_date: string; end_date: string }): boolean {
  const t = todayStr();
  return e.start_date <= t && e.end_date >= t;
}

export function isOpeningSoon(e: { start_date: string }): boolean {
  const d = daysUntil(e.start_date);
  return d > 0 && d <= 21;
}

export function isClosingSoon(e: { start_date: string; end_date: string }): boolean {
  const d = daysUntil(e.end_date);
  return isOnNow(e) && d >= 0 && d <= 14;
}

/** Mono status line for a row: "CLOSES 18 JUL" / "OPENS 22 JUL" / date range */
export function statusLine(e: { start_date: string; end_date: string }): string {
  if (isOpeningSoon(e) || daysUntil(e.start_date) > 0) return `OPENS ${fmtDay(parseDay(e.start_date))}`;
  if (isClosingSoon(e)) return `CLOSES ${fmtDay(parseDay(e.end_date))}`;
  return formatRange(e.start_date, e.end_date);
}
