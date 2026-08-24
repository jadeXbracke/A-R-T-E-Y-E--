// The sleep circle: a 24-hour clock face (midnight at the top) with each of
// the last seven nights drawn as an arc from bedtime to wake-up, stacked as
// concentric rings — newest outside. The tighter the arcs align, the more
// regular the sleep. Readable at a glance, no numbers required.
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../lib/theme-context';
import { fonts } from '../theme';
import { SleepLog } from '../lib/types';

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + (m || 0)) % 1440;
}

function point(cx: number, cy: number, r: number, minutes: number) {
  const angle = (minutes / 1440) * 2 * Math.PI - Math.PI / 2; // midnight top
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function nightArc(cx: number, cy: number, r: number, bed: string, wake: string): string {
  const a = minutesOf(bed);
  const b = minutesOf(wake);
  const span = (b - a + 1440) % 1440;
  const from = point(cx, cy, r, a);
  const to = point(cx, cy, r, b);
  const largeArc = span > 720 ? 1 : 0;
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${largeArc} 1 ${to.x} ${to.y}`;
}

export function SleepCircle({ nights, size = 232, children }: {
  nights: SleepLog[]; // oldest → newest, max 7
  size?: number;
  children?: React.ReactNode;
}) {
  const { palette, scheme } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 14;
  const gap = 7;
  const last = nights.slice(-7);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* quiet clock frame: outer hairline + the four quarter hours */}
        <Circle cx={cx} cy={cy} r={size / 2 - 1} stroke={palette.hairline} strokeWidth={1} fill="none" />
        {[0, 360, 720, 1080].map(m => {
          const p1 = point(cx, cy, size / 2 - 1, m);
          const p2 = point(cx, cy, size / 2 - 6, m);
          return <Path key={m} d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`} stroke={palette.dim} strokeWidth={1} />;
        })}
        <SvgText
          x={cx} y={16} textAnchor="middle"
          fontSize={8} letterSpacing={1} fill={palette.dim} fontFamily={fonts.sansMedium}
        >
          00
        </SvgText>
        {/* one arc per night, newest = outermost and darkest */}
        {last.map((n, i) => {
          const r = outer - (last.length - 1 - i) * gap;
          const age = last.length - 1 - i; // 0 = newest
          const opacity = scheme === 'dark' ? 1 - age * 0.11 : 1 - age * 0.12;
          return (
            <Path
              key={n.id}
              d={nightArc(cx, cy, r, n.bedTime, n.wakeTime)}
              stroke={palette.ink}
              strokeOpacity={Math.max(opacity, 0.2)}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </Svg>
      {children}
    </View>
  );
}

/** Average absolute deviation (minutes) of bed & wake times over the window. */
export function sleepRegularity(nights: SleepLog[]): number | null {
  if (nights.length < 3) return null;
  const dev = (values: number[]): number => {
    // circular mean, then mean absolute deviation on the clock
    const rad = values.map(v => (v / 1440) * 2 * Math.PI);
    const mean = Math.atan2(
      rad.reduce((a, r) => a + Math.sin(r), 0),
      rad.reduce((a, r) => a + Math.cos(r), 0),
    );
    const meanMin = ((mean / (2 * Math.PI)) * 1440 + 1440) % 1440;
    const ds = values.map(v => {
      const d = Math.abs(v - meanMin);
      return Math.min(d, 1440 - d);
    });
    return ds.reduce((a, b) => a + b, 0) / ds.length;
  };
  const beds = nights.map(n => minutesOf(n.bedTime));
  const wakes = nights.map(n => minutesOf(n.wakeTime));
  return Math.round((dev(beds) + dev(wakes)) / 2);
}

export function sleepDuration(n: SleepLog): number {
  return (minutesOf(n.wakeTime) - minutesOf(n.bedTime) + 1440) % 1440;
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;
}

export function SleepLegend() {
  const { palette } = useTheme();
  return (
    <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: palette.dim, textAlign: 'center' }}>
      Seven nights, midnight at the top — the tighter the arcs align, the steadier the rhythm.
    </Text>
  );
}
