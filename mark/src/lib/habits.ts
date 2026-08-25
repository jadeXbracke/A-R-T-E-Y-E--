// Which habits are actually due on a given day.
//
// A habit that runs three times a week should not sit in the way — and must
// not count against — the four days it is off. Everything that asks "how full
// is this day" goes through here.
import { weekdayIndex } from './dates';
import { Habit } from './types';

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Selected weekdays, treating "nothing selected" as every day. */
export function habitDays(habit: Habit): number[] {
  return habit.days?.length ? habit.days : ALL_DAYS;
}

export function isDue(habit: Habit, date: string): boolean {
  return habitDays(habit).includes(weekdayIndex(date));
}

export function dueOn(habits: Habit[], date: string): Habit[] {
  return habits.filter(h => isDue(h, date));
}

/** Marks a full week of this habit asks for. */
export function weeklyTarget(habit: Habit): number {
  return habitDays(habit).length;
}

/** Marks a span of days asks for across every habit. */
export function targetOver(habits: Habit[], dates: string[]): number {
  return dates.reduce((sum, d) => sum + dueOn(habits, d).length, 0);
}

export const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
