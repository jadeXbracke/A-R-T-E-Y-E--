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
 * Seven small day dots for one habit's week. Days the habit was never due
 * stay blank — a rest day should not read as an open circle.
 */
export function WeekDots({ days, scheduled, size = 10 }: {
  days: boolean[];
  scheduled?: boolean[];
  size?: number;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {days.map((on, i) => {
        const due = scheduled ? scheduled[i] : true;
        return (
          <View
            key={i}
            style={{
              width: size, height: size, borderRadius: size / 2,
              borderWidth: due ? 1 : 0,
              borderColor: on ? palette.ink : palette.hairline,
              backgroundColor: on ? palette.ink : 'transparent',
            }}
          />
        );
      })}
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
