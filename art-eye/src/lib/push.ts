// Push notification registration. Native only (iOS/Android) — Expo's push
// service has no meaningful role in the web export, so this is a deliberate
// no-op there. Registration runs once per sign-in; failures are swallowed
// (a denied permission or a simulator with no push capability must never
// block sign-in or crash the app).
import { Platform } from 'react-native';

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Device = await import('expo-device');
    if (!Device.isDevice) return; // simulators/emulators can't receive real pushes

    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return;

    const Constants = (await import('expo-constants')).default;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return; // not linked to an EAS project yet — nothing to register against

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { api } = await import('./api');
    await api.registerPushToken(userId, token);
  } catch {
    // Registration is a nice-to-have, never a hard requirement to use the app.
  }
}
