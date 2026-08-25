// Sleep, back to the circle: each of the last seven nights drawn as an arc
// on the same 24-hour dial (midnight at the top), stacked as concentric
// rings — newest outermost and darkest, older nights fading inward. Tightly
// aligned arcs read as a steady rhythm; scattered ones read as a ragged
// week. No numbers required to see it.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../lib/theme-context';
import { SleepLog } from '../lib/types';

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + (m || 0)) % 1440;
}

function point(cx: number, cy: number, r: number, minutes: number) {
  const angle = (minutes / 1440) * 2 * Math.PI - Math.PI / 2; // midnight at the top
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

export function SleepCircle({ nights, size = 220, children }: {
  nights: SleepLog[]; // oldest → newest, max 7
  size?: number;
  children?: React.ReactNode;
}) {
  const { palette, scheme } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 12;
  const gap = 7;
  const last = nights.slice(-7);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={size / 2 - 1} stroke={palette.hairline} strokeWidth={1} fill="none" />
        {/* four quiet ticks anchor the dial without a single number on it */}
        {[0, 360, 720, 1080].map(m => {
          const p1 = point(cx, cy, size / 2 - 1, m);
          const p2 = point(cx, cy, size / 2 - 6, m);
          return <Path key={m} d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`} stroke={palette.dim} strokeWidth={1} />;
        })}
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

export function sleepDuration(n: SleepLog): number {
  return (minutesOf(n.wakeTime) - minutesOf(n.bedTime) + 1440) % 1440;
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;
}
