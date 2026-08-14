// Gamification and the yearly wrap-up — both derived client-side from a
// user's own visits (already fetched via listVisits) plus the exhibitions
// they refer to. No schema of their own; nothing here talks to a backend.
import { Exhibition, Visit } from './types';

const monthKey = (dateStr: string) => dateStr.slice(0, 7); // 'YYYY-MM'

// Consecutive calendar months, ending this month, with at least one visit
// logged. Breaks (returns the count so far) the moment a month is missing.
export function monthStreak(visits: Visit[]): number {
  if (visits.length === 0) return 0;
  const months = new Set(visits.map((v) => monthKey(v.visit_date)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    if (!months.has(key)) break;
    streak++;
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return streak;
}

export function visitsThisMonth(visits: Visit[]): number {
  const key = monthKey(new Date().toISOString());
  return visits.filter((v) => monthKey(v.visit_date) === key).length;
}

export interface WrappedStats {
  year: number;
  totalVisits: number;
  avgRating: string;
  topVenueType: string | null;
  uniqueVenues: number;
  favouriteShow: { title: string; rating: number } | null;
  firstVisit: { title: string; date: string } | null;
  busiestMonth: string | null;
}

export function computeWrapped(
  visits: Visit[],
  exhibitions: Map<string, Exhibition>,
  year: number
): WrappedStats {
  const yearVisits = [...visits]
    .filter((v) => v.visit_date.startsWith(String(year)))
    .sort((a, b) => (a.visit_date < b.visit_date ? -1 : 1));

  const venueTypeCounts = new Map<string, number>();
  const venueIds = new Set<string>();
  const monthCounts = new Map<string, number>();
  let favourite: { title: string; rating: number } | null = null;
  let first: { title: string; date: string } | null = null;

  for (const v of yearVisits) {
    const e = exhibitions.get(v.exhibition_id);
    if (e?.venue) {
      venueTypeCounts.set(e.venue.type, (venueTypeCounts.get(e.venue.type) ?? 0) + 1);
      venueIds.add(e.venue.id);
    }
    const month = monthKey(v.visit_date);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    if (!favourite || v.rating > favourite.rating) favourite = { title: e?.title ?? 'a show', rating: v.rating };
    if (!first) first = { title: e?.title ?? 'a show', date: v.visit_date };
  }

  const topVenueType = [...venueTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const busiestMonthKey = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const busiestMonth = busiestMonthKey
    ? new Date(`${busiestMonthKey}-01`).toLocaleDateString('en-AU', { month: 'long' })
    : null;

  return {
    year,
    totalVisits: yearVisits.length,
    avgRating: yearVisits.length ? (yearVisits.reduce((s, v) => s + v.rating, 0) / yearVisits.length).toFixed(1) : '—',
    topVenueType,
    uniqueVenues: venueIds.size,
    favouriteShow: favourite,
    firstVisit: first,
    busiestMonth,
  };
}
