// Sleep duration helpers shared by the sleep and steps-style goal ring.
export interface SleepLike { bedTime: string; wakeTime: string }

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + (m || 0)) % 1440;
}

export function sleepDuration(n: SleepLike): number {
  return (minutesOf(n.wakeTime) - minutesOf(n.bedTime) + 1440) % 1440;
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;
}
