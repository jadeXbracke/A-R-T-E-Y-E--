const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function parts(iso: string): { d: number; m: number; y: number } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { d, m: m - 1, y };
}

/** "6 JUN — 16 AUG" (mono date line, prototype style) */
export function dateRange(startIso: string, endIso: string): string {
  const a = parts(startIso);
  const b = parts(endIso);
  return `${a.d} ${MONTHS[a.m]} — ${b.d} ${MONTHS[b.m]}`;
}

/** "22 JUL, 6–8 PM" style for opening nights */
export function openingLabel(iso: string): string {
  const { d, m } = parts(iso);
  const t = iso.slice(11, 16);
  if (!t) return `${d} ${MONTHS[m]}`;
  const [hh, mm] = t.split(':').map(Number);
  const h12 = ((hh + 11) % 12) + 1;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${d} ${MONTHS[m]}, ${h12}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${ampm}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOnNow(e: { start_date: string; end_date: string }, today = todayIso()): boolean {
  return e.start_date <= today && today <= e.end_date;
}

export function isUpcoming(e: { start_date: string }, today = todayIso()): boolean {
  return e.start_date > today;
}

function daysBetween(aIso: string, bIso: string): number {
  return Math.round((Date.parse(bIso) - Date.parse(aIso)) / 86400000);
}

/** Opens within the next 14 days (or opened in the last 7). */
export function isOpeningSoon(e: { start_date: string }, today = todayIso()): boolean {
  const d = daysBetween(today, e.start_date);
  return d >= -7 && d <= 14;
}

/** Closes within the next 14 days. */
export function isClosingSoon(
  e: { start_date: string; end_date: string },
  today = todayIso()
): boolean {
  const d = daysBetween(today, e.end_date);
  return isOnNow(e, today) && d >= 0 && d <= 14;
}

/** "16 JUL 2026" for diary entries */
export function longDate(iso: string): string {
  const { d, m, y } = parts(iso);
  return `${d} ${MONTHS[m]} ${y}`;
}
