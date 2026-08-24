// The circle motif. Open ring = still to do, closed disc = a mark set.
// Pure Views (border-radius circles) — no SVG dependency, timeless anyway.
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '../lib/theme-context';

/** The daily check-in control: tap to set (or unset) a mark. */
export function MarkRing({ marked, onPress, size = 28 }: {
  marked: boolean;
  onPress: () => void;
  size?: number;
}) {
  const { palette } = useTheme();
  const scale = useRef(new Animated.Value(marked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: marked ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [marked, scale]);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marked }}
    >
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 1.25, borderColor: palette.ink,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            width: size - 8, height: size - 8, borderRadius: (size - 8) / 2,
            backgroundColor: palette.ink,
            transform: [{ scale }],
          }}
        />
      </View>
    </Pressable>
  );
}

/**
 * The day circle on Vandaag: a disc that fills as today's marks are set,
 * ringed by seven dots — one per weekday, closed once that day is complete.
 */
export function DayCircle({ todayFraction, weekDone, todayIndex, size = 168 }: {
  todayFraction: number;      // 0..1 of today's habits marked
  weekDone: boolean[];        // Mon..Sun, complete days
  todayIndex: number;         // 0..6
  size?: number;
}) {
  const { palette } = useTheme();
  const dot = 9;
  const r = size / 2 - dot / 2;
  const inner = size - 56;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {weekDone.map((done, i) => {
        // Monday at the top, clockwise.
        const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const style: ViewStyle = {
          position: 'absolute',
          left: size / 2 + r * Math.cos(angle) - dot / 2,
          top: size / 2 + r * Math.sin(angle) - dot / 2,
          width: dot, height: dot, borderRadius: dot / 2,
          borderWidth: 1, borderColor: i === todayIndex ? palette.ink : palette.dim,
          backgroundColor: done ? palette.ink : 'transparent',
        };
        return <View key={i} style={style} />;
      })}
      <View
        style={{
          width: inner, height: inner, borderRadius: inner / 2,
          borderWidth: 1, borderColor: palette.hairline,
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: inner * Math.sqrt(Math.min(todayFraction, 1)),
            height: inner * Math.sqrt(Math.min(todayFraction, 1)),
            borderRadius: inner / 2,
            backgroundColor: palette.tint,
            position: 'absolute',
          }}
        />
      </View>
    </View>
  );
}

/** Seven small day dots for one habit's week. */
export function WeekDots({ days, size = 10 }: { days: boolean[]; size?: number }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {days.map((on, i) => (
        <View
          key={i}
          style={{
            width: size, height: size, borderRadius: size / 2,
            borderWidth: 1, borderColor: on ? palette.ink : palette.hairline,
            backgroundColor: on ? palette.ink : 'transparent',
          }}
        />
      ))}
    </View>
  );
}

/** A dot whose fill steps with intensity (0 = open, 1 = closed). */
export function IntensityDot({ fraction, size = 12 }: { fraction: number; size?: number }) {
  const { palette } = useTheme();
  const filled = Math.max(0, Math.min(1, fraction));
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 1, borderColor: filled > 0 ? palette.ink : palette.hairline,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: (size - 4) * filled, height: (size - 4) * filled,
          borderRadius: size / 2, backgroundColor: palette.ink,
        }}
      />
    </View>
  );
}
