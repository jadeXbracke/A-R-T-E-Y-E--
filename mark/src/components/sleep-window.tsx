// Sleep, drawn as one circle: the arc is the window you usually sleep in,
// on the same 24-hour dial the rest of the app already uses for time
// (midnight at the top, clockwise). One arc reads at a glance; there is
// nothing to decode. Underneath, a row of dots — closed where a night fell
// inside that usual window, open where it drifted — the same open/closed
// language as every mark in the app.
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../lib/theme-context';
import { fromKey } from '../lib/dates';
import { SleepLog } from '../lib/types';
import { type } from '../theme';

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const REGULAR_WITHIN_MINUTES = 45;

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + (m || 0)) % 1440;
}

function circularDistance(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 1440 - d);
}

/** Circular mean of clock times, so 23:50 and 00:10 average to midnight. */
function meanTime(values: number[]): number | null {
  if (!values.length) return null;
  const rad = values.map(v => (v / 1440) * 2 * Math.PI);
  const angle = Math.atan2(
    rad.reduce((a, r) => a + Math.sin(r), 0),
    rad.reduce((a, r) => a + Math.cos(r), 0),
  );
  return ((angle / (2 * Math.PI)) * 1440 + 1440) % 1440;
}

export interface SleepAverages {
  bedMinutes: number;
  wakeMinutes: number;
}

/** The usual bed and wake time across the given nights, or null if too few. */
export function sleepAverages(nights: SleepLog[]): SleepAverages | null {
  if (nights.length < 2) return null;
  const bedMinutes = meanTime(nights.map(n => minutesOf(n.bedTime)));
  const wakeMinutes = meanTime(nights.map(n => minutesOf(n.wakeTime)));
  if (bedMinutes === null || wakeMinutes === null) return null;
  return { bedMinutes, wakeMinutes };
}

/** Which of the given nights fell close to the usual bed and wake time. */
export function nightsInWindow(nights: SleepLog[]): boolean[] {
  const avg = sleepAverages(nights);
  if (!avg) return nights.map(() => true);
  return nights.map(n =>
    circularDistance(minutesOf(n.bedTime), avg.bedMinutes) <= REGULAR_WITHIN_MINUTES
    && circularDistance(minutesOf(n.wakeTime), avg.wakeMinutes) <= REGULAR_WITHIN_MINUTES);
}

export function sleepDuration(n: SleepLog): number {
  return (minutesOf(n.wakeTime) - minutesOf(n.bedTime) + 1440) % 1440;
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;
}

function angleOf(minutes: number): number {
  return (minutes / 1440) * 2 * Math.PI - Math.PI / 2; // midnight at the top
}

function point(cx: number, cy: number, r: number, minutes: number) {
  const a = angleOf(minutes);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function windowArc(cx: number, cy: number, r: number, bedMinutes: number, wakeMinutes: number): string {
  const span = (wakeMinutes - bedMinutes + 1440) % 1440;
  const from = point(cx, cy, r, bedMinutes);
  const to = point(cx, cy, r, wakeMinutes);
  const largeArc = span > 720 ? 1 : 0;
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${largeArc} 1 ${to.x} ${to.y}`;
}

/** The circle: a track, one solid arc for the usual sleep window, content in the centre. */
export function SleepWindow({ averages, size = 200, children }: {
  averages: SleepAverages | null;
  size?: number;
  children?: React.ReactNode;
}) {
  const { palette } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={r} stroke={palette.hairline} strokeWidth={2} fill="none" />
        {/* a single tick at the top marks midnight, the dial's only anchor */}
        <Path d={`M ${cx} ${cy - r} L ${cx} ${cy - r + 6}`} stroke={palette.dim} strokeWidth={1.5} />
        {averages ? (
          <Path
            d={windowArc(cx, cy, r, averages.bedMinutes, averages.wakeMinutes)}
            stroke={palette.ink} strokeWidth={5} strokeLinecap="round" fill="none"
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

/** One dot per recent night: closed inside the usual window, open outside it. */
export function SleepNightDots({ nights }: { nights: SleepLog[] }) {
  const { palette } = useTheme();
  const last = nights.slice(-7);
  const inWindow = nightsInWindow(last);
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      {last.map((n, i) => {
        const weekday = DAY_INITIALS[(fromKey(n.date).getDay() + 6) % 7];
        const on = inWindow[i];
        return (
          <View key={n.id} style={{ alignItems: 'center', gap: 6 }}>
            <Text style={[type.small, { color: palette.dim, fontSize: 9 }]}>{weekday}</Text>
            <View
              style={{
                width: 10, height: 10, borderRadius: 5,
                borderWidth: 1, borderColor: on ? palette.ink : palette.hairline,
                backgroundColor: on ? palette.ink : 'transparent',
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
