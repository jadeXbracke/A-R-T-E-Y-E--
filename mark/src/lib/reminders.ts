// Evening reminder: if habits are still open today, one gentle local
// notification at the hour the user chose. Rescheduled on every app focus,
// cancelled when the day is complete. Native only — the web build skips it.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const HOUR_KEY = 'mark.reminder.hour'; // '0' = off

// Pulled in lazily so the web bundle never touches native notification APIs.
type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;
function mod(): NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (!Notifications) {
    Notifications = require('expo-notifications') as NotificationsModule;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return Notifications;
}

export async function getReminderHour(): Promise<number> {
  const v = await AsyncStorage.getItem(HOUR_KEY).catch(() => null);
  if (v === null) return 20; // default: 20:00
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 20;
}

export async function setReminderHour(hour: number): Promise<void> {
  await AsyncStorage.setItem(HOUR_KEY, String(hour)).catch(() => {});
}

/** Call whenever today's state changes; keeps exactly one reminder scheduled. */
export async function syncEveningReminder(openCount: number): Promise<void> {
  const n = mod();
  if (!n) return;
  try {
    await n.cancelAllScheduledNotificationsAsync();
    const hour = await getReminderHour();
    if (!hour || openCount <= 0) return;
    const target = new Date();
    target.setHours(hour, 0, 0, 0);
    if (target <= new Date()) return; // that hour already passed today
    const { status } = await n.requestPermissionsAsync();
    if (status !== 'granted') return;
    await n.scheduleNotificationAsync({
      content: {
        title: 'MARK',
        body: openCount === 1
          ? 'One habit still open today — a small mark is enough.'
          : `${openCount} habits still open today — a small mark is enough.`,
      },
      trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    // Reminders are a courtesy; never let them break the app.
  }
}
