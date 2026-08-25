// Persistence for the personal day boundary. Loaded once, before the first
// screen renders, so nothing ever computes "today" against the wrong day.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDayStartHour, setDayStartHour } from './dates';

const KEY = 'mark.dayStart';

export const DAY_START_HOURS = [0, 3, 4, 5, 6];

export async function loadDayStart(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const hour = raw === null ? 4 : parseInt(raw, 10); // 04:00 by default
    setDayStartHour(Number.isFinite(hour) ? hour : 4);
  } catch {
    setDayStartHour(4);
  }
  return getDayStartHour();
}

export async function saveDayStart(hour: number): Promise<void> {
  setDayStartHour(hour);
  await AsyncStorage.setItem(KEY, String(hour)).catch(() => {});
}

export { getDayStartHour };
