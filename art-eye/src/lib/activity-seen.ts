// Device-local "activity seen up to" marker. Kept out of the backend on
// purpose: it's per-device presentation state, and storing it locally means
// the badge works identically in demo and live mode with no migration.
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (userId: string) => `arteye.activity-seen.${userId}`;

export async function getActivitySeen(userId: string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(key(userId))) ?? '';
  } catch {
    return '';
  }
}

export async function setActivitySeen(userId: string, iso: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), iso);
  } catch {
    // presentation state only — losing it just re-shows the badge
  }
}
