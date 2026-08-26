// When is a habit actually asking for something?
//
// Three rhythms, because time does not have one shape: fixed weekdays, a
// number of times a week, or a number of times a month. On top of that a
// habit only counts from the day it was created, and a paused habit asks for
// nothing at all — so the app never presents a day as missed when nothing was
// ever expected of it.
import {
  addDays, daysBetween, daysInMonth, monthEnd, monthStart, weekStart, weekdayIndex,
} from './dates';
import { Habit, Mark } from './types';

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Selected weekdays, treating "nothing selected" as every day. */
export function habitDays(habit: Habit): number[] {
  return habit.days?.length ? habit.days : ALL_DAYS;
}

/** Was this habit live on this date at all? */
export function isActive(habit: Habit, date: string): boolean {
  if (habit.paused) return false;
  return !habit.startDate || date >= habit.startDate;
}

function period(habit: Habit, date: string): [string, string] {
  return habit.rhythm === 'monthly'
    ? [monthStart(date), monthEnd(date)]
    : [weekStart(date), addDays(weekStart(date), 6)];
}

/**
 * Whether the habit belongs on this day's list. A flexible habit stays in
 * view until its quota for the period is met, then steps aside — and a day
 * it was already marked on always keeps showing it, so a mark can be undone.
 */
export function isDue(habit: Habit, date: string, marks: Mark[]): boolean {
  if (!isActive(habit, date)) return false;
  if (habit.rhythm === 'days') return habitDays(habit).includes(weekdayIndex(date));

  const [from, to] = period(habit, date);
  const inPeriod = marks.filter(m => m.habitId === habit.id && m.date >= from && m.date <= to);
  if (inPeriod.some(m => m.date === date)) return true;
  return inPeriod.length < Math.max(habit.times, 1);
}

export function dueOn(habits: Habit[], date: string, marks: Mark[]): Habit[] {
  return habits.filter(h => isDue(h, date, marks));
}

/** What a full week of this habit asks for — used for the label in settings. */
export function rhythmLabel(habit: Habit): string {
  const n = habit.rhythm === 'days' ? habitDays(habit).length : Math.max(habit.times, 1);
  const unit = habit.rhythm === 'monthly' ? 'month' : 'week';
  if (habit.rhythm === 'days') return `${n} ${n === 1 ? 'day' : 'days'} a week`;
  return `${n} ${n === 1 ? 'time' : 'times'} a ${unit}`;
}

/**
 * How many marks a span of days asks for across every habit. Structural on
 * purpose: it counts what was expected, not what happened, so a target never
 * shifts underneath a number that is being compared to it.
 */
export function targetOver(habits: Habit[], dates: string[]): number {
  if (!dates.length) return 0;
  return habits.reduce((sum, h) => {
    const live = dates.filter(d => isActive(h, d));
    if (!live.length) return sum;
    if (h.rhythm === 'days') {
      const days = habitDays(h);
      return sum + live.filter(d => days.includes(weekdayIndex(d))).length;
    }
    const span = h.rhythm === 'weekly' ? 7 : daysInMonth(live[0]);
    return sum + Math.round(Math.max(h.times, 1) * (live.length / span));
  }, 0);
}

/** The window of marks the due/target maths needs around a date. */
export function marksWindow(date: string): [string, string] {
  const from = [weekStart(date), monthStart(date)].sort()[0];
  const to = [addDays(weekStart(date), 6), monthEnd(date)].sort()[1];
  return [from, to];
}

export { daysBetween };
