// Platform health data (Apple Health / Google Fit) behind one interface.
//
// The manual path is the primary path: everything in the app stays fully
// usable with hand-entered numbers, so a missing platform, a denied
// permission or the web build never produce an empty or broken state.
//
// Wiring up HealthKit requires a development build (not Expo Go):
//   1. `npx expo install react-native-health` and add its config plugin.
//   2. Implement the provider below with granular, per-datatype permission
//      requests (steps / sleep / resting HR / active energy / workouts),
//      READ-ONLY scopes only.
//   3. Return real values from getDailySteps / getSleep; the Body screen
//      already prefers provider data and falls back to manual entries.
// Android: same interface over Health Connect (react-native-health-connect).
export type HealthDataType = 'steps' | 'sleep' | 'restingHr' | 'activeEnergy' | 'workouts';

export interface HealthProvider {
  /** Whether a platform health source exists in this build. */
  available(): boolean;
  /** Ask only for the types the user ticked — never a blanket request. */
  requestPermissions(types: HealthDataType[]): Promise<HealthDataType[]>;
  getDailySteps(date: string): Promise<number | null>;
  getSleep(date: string): Promise<{ bedTime: string; wakeTime: string } | null>;
}

class NullProvider implements HealthProvider {
  available() { return false; }
  async requestPermissions() { return []; }
  async getDailySteps() { return null; }
  async getSleep() { return null; }
}

// Swapped for a HealthKit/Health Connect implementation in a dev build.
export const healthProvider: HealthProvider = new NullProvider();
