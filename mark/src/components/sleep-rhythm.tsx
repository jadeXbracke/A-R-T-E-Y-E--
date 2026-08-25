// Sleep, drawn as the thing that actually matters: regularity.
//
// Seven nights as seven horizontal bars, each running from the moment you
// went to bed to the moment you woke, on a shared timeline. A steady rhythm
// stacks the bars into a straight-edged block; a ragged week staggers them.
// No clock face to decode, no score: the shape of the block is the reading.
//
// Two faint verticals mark your usual bed and wake times, so how far a night
// drifted is a distance you can see rather than a number to interpret.
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../lib/theme-context';
import { fromKey } from '../lib/dates';
import { SleepLog } from '../lib/types';
import { space, type } from '../theme';

const WINDOW_START = 19 * 60;      // the timeline opens at 19:00
const WINDOW_MINUTES = 18 * 60;    // and closes at 13:00 the next day
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + (m || 0)) % 1440;
}

/** Where a clock time sits on the timeline, 0…1. Outliers stop at the edge. */
function place(minutes: number): number {
  const rel = (minutes - WINDOW_START + 1440) % 1440;
  if (rel <= WINDOW_MINUTES) return rel / WINDOW_MINUTES;
  // Outside the window: nearer to the evening edge, or to the midday one.
  return rel > WINDOW_MINUTES + (1440 - WINDOW_MINUTES) / 2 ? 0 : 1;
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

export function SleepRhythm({ nights }: { nights: SleepLog[] }) {
  const { palette } = useTheme();
  const last = nights.slice(-7);
  const beds = last.map(n => minutesOf(n.bedTime));
  const wakes = last.map(n => minutesOf(n.wakeTime));
  const avgBed = meanTime(beds);
  const avgWake = meanTime(wakes);

  const Guide = ({ at, colour, opacity }: { at: number; colour: string; opacity?: number }) => (
    <View
      style={{
        position: 'absolute', top: 0, bottom: 0,
        left: `${at * 100}%`, width: 1,
        backgroundColor: colour, opacity,
      }}
    />
  );

  return (
    <View style={{ width: '100%' }}>
      {/* The rows give this container its height; the guides span all of it
          and sit underneath the bars, so the gap between a bar's edge and
          its guide is the drift. */}
      <View style={{ position: 'relative' }}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 16, right: 0, top: 0, bottom: 0 }}
        >
          {/* midnight, so the timeline has an anchor without a row of numbers */}
          <Guide at={place(0)} colour={palette.hairline} />
          {avgBed !== null ? <Guide at={place(avgBed)} colour={palette.ink} opacity={0.3} /> : null}
          {avgWake !== null ? <Guide at={place(avgWake)} colour={palette.ink} opacity={0.3} /> : null}
        </View>

      {last.map(night => {
        const left = place(minutesOf(night.bedTime));
        const right = place(minutesOf(night.wakeTime));
        const width = Math.max(right - left, 0.01);
        const weekday = DAY_INITIALS[(fromKey(night.date).getDay() + 6) % 7];
        return (
          <View key={night.id} style={{ flexDirection: 'row', alignItems: 'center', height: 20 }}>
            <Text style={[type.small, { width: 16, color: palette.dim, fontSize: 9 }]}>{weekday}</Text>
            <View style={{ flex: 1, height: 20, justifyContent: 'center' }}>
              <View
                style={{
                  position: 'absolute',
                  left: `${left * 100}%`, width: `${width * 100}%`,
                  height: 7, borderRadius: 4,
                  backgroundColor: palette.ink,
                }}
              />
            </View>
          </View>
        );
      })}
      </View>

      <View style={{ flexDirection: 'row', marginTop: space.s, paddingLeft: 16 }}>
        <Text style={[type.small, { color: palette.dim, fontSize: 9 }]}>19:00</Text>
        <View style={{ flex: 1 }} />
        <Text style={[type.small, { color: palette.dim, fontSize: 9 }]}>13:00</Text>
      </View>
    </View>
  );
}

/** Average distance, in minutes, of bed and wake times from their usual hour. */
export function sleepRegularity(nights: SleepLog[]): number | null {
  if (nights.length < 3) return null;
  const drift = (values: number[]): number => {
    const mean = meanTime(values)!;
    const gaps = values.map(v => {
      const d = Math.abs(v - mean);
      return Math.min(d, 1440 - d);
    });
    return gaps.reduce((a, b) => a + b, 0) / gaps.length;
  };
  const beds = nights.map(n => minutesOf(n.bedTime));
  const wakes = nights.map(n => minutesOf(n.wakeTime));
  return Math.round((drift(beds) + drift(wakes)) / 2);
}

export function sleepDuration(n: SleepLog): number {
  return (minutesOf(n.wakeTime) - minutesOf(n.bedTime) + 1440) % 1440;
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(Math.round(minutes % 60)).padStart(2, '0')}`;
}
